from faster_whisper import WhisperModel
from pydub import AudioSegment
from deep_translator import GoogleTranslator
import tempfile
import os
import re
import json

from services.llm_service import get_ai_response
from services.db_service import save_chat, create_chat_session, update_chat_session, generate_chat_title

# ---------------------------------------------------------------
# Odia phonetic map  (loaded from odia.json)
# Maps each Odia Unicode character → Roman phonetic syllable.
# Used to build a pronunciation glossary for the LLM so it can
# match Whisper’s garbled Devanagari output to real Odia words.
# ---------------------------------------------------------------
_ODIA_CHAR_PHONETIC: dict = {}
try:
    _odia_json_path = os.path.join(os.path.dirname(__file__), "odia_language_data", "odia.json")
    with open(_odia_json_path, encoding="utf-8") as _f:
        _ODIA_CHAR_PHONETIC = json.load(_f)["language"]["odia"]
    print("[AgriGPT Voice] Odia phonetic map loaded ({} entries)".format(len(_ODIA_CHAR_PHONETIC)))
except Exception as _e:
    print(f"[AgriGPT Voice] Warning: could not load odia.json — {_e}")


def _odia_to_phonetic(text: str) -> str:
    """Transliterate an Odia-script string to Roman phonetics using odia.json."""
    return "".join(_ODIA_CHAR_PHONETIC.get(ch, ch) for ch in text)


# Key Odia agricultural vocabulary: (Odia script, English meaning)
# Phonetics are computed at import time via _odia_to_phonetic().
_ODIA_AG_VOCAB = [
    ("\u0b1a\u0b3e\u0b37",   "farming/cultivation"),
    ("\u0b1a\u0b3e\u0b37\u0b40", "farmer"),
    ("\u0b2b\u0b38\u0b32",   "crop"),
    ("\u0b27\u0b3e\u0b28",   "paddy/rice"),
    ("\u0b1c\u0b2e\u0b3f",   "land/field"),
    ("\u0b2a\u0b3e\u0b23\u0b3f", "water"),
    ("\u0b16\u0b24",         "fertilizer/manure"),
    ("\u0b2c\u0b3f\u0b1c",   "seed"),
    ("\u0b2e\u0b3e\u0b1f\u0b3f", "soil"),
    ("\u0b17\u0b1b",         "plant/tree"),
    ("\u0b38\u0b3f\u0b1e\u0b4d\u0b1a\u0b28", "irrigation"),
    ("\u0b2a\u0b4b\u0b15",   "pest/insect"),
    ("\u0b30\u0b4b\u0b17",   "crop disease"),
    ("\u0b09\u0b2a\u0b1c",   "yield/produce"),
    ("\u0b2e\u0b4c\u0b38\u0b41\u0b2e", "season/weather"),
    ("\u0b2c\u0b43\u0b37\u0b4d\u0b1f\u0b3f", "rain"),
    ("\u0b05\u0b2e\u0b33",   "harvest"),
    ("\u0b1c\u0b33",         "water/irrigation"),
    ("\u0b36\u0b38\u0b4d\u0b5f", "grain/cereal"),
    ("\u0b06\u0b33\u0b41",   "potato"),
    ("\u0b1f\u0b2e\u0b3e\u0b1f", "tomato"),
    ("\u0b2a\u0b4d\u0b5f\u0b3e\u0b1c", "onion"),
    ("\u0b21\u0b3e\u0b32\u0b3f", "lentil/dal"),
    ("\u0b15\u0b43\u0b37\u0b3f", "agriculture"),
    ("\u0b15\u0b43\u0b37\u0b15", "cultivator/farmer"),
    ("\u0b38\u0b3e\u0b30",   "fertilizer"),
    ("\u0b2b\u0b33",         "fruit"),
    ("\u0b09\u0b26\u0b4d\u0b2d\u0b3f\u0b26", "plant/vegetation"),
    ("\u0b15\u0b40\u0b1f\u0b28\u0b3e\u0b36\u0b15", "pesticide"),
    ("\u0b2c\u0b28\u0b4d\u0b5f\u0b3e", "flood"),
    ("\u0b16\u0b30\u0b3e",   "drought"),
]

# Pre-compute: list of (roman_phonetic, english_meaning, odia_script)
_ODIA_AG_PHONETICS = [
    (_odia_to_phonetic(odia), meaning, odia)
    for odia, meaning in _ODIA_AG_VOCAB
]


def _build_odia_phonetic_glossary() -> str:
    """Return a compact glossary string for injection into the LLM prompt.
    Each line maps the Roman phonetic sound → Odia script → English meaning,
    so the LLM can match Whisper’s phonetic Devanagari to real Odia words.
    """
    lines = [
        "Odia pronunciation glossary (Roman phonetics → Odia script → meaning):",
    ]
    for phonetic, meaning, odia in _ODIA_AG_PHONETICS:
        lines.append(f"  {phonetic} = {odia} = {meaning}")
    return "\n".join(lines)

# ---------------------------------------------------------------
# Whisper Model — small, CPU, int8 for balanced speed and accuracy.
# ---------------------------------------------------------------
def _load_whisper_model():
    try:
        print("[AgriGPT Voice] Loading Whisper model: small")
        m = WhisperModel("small", device="cpu", compute_type="int8")
        print("[AgriGPT Voice] Loaded: small")
        return m
    except Exception as e:
        raise RuntimeError(f"Failed to load Whisper small model: {e}")

whisper_model = _load_whisper_model()

# ---------------------------------------------------------------
# Supported Indian languages
# Maps Whisper language codes → human-readable names
# ---------------------------------------------------------------
SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "bn": "Bengali",
    "te": "Telugu",
    "ta": "Tamil",
    "mr": "Marathi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "gu": "Gujarati",
    "ur": "Urdu",
    "en": "English",
    # Odia is not in Whisper's vocabulary; we back-detect it via Unicode script
}

# ---------------------------------------------------------------
# LLM language instructions
# Tells Gemini exactly which script/language to respond in.
# ---------------------------------------------------------------
LANG_INSTRUCTIONS = {
    "hi": "You MUST respond entirely in Hindi using Devanagari script.",
    "or": "You MUST respond entirely in Odia using Odia script (Unicode U+0B00–U+0B7F). Do NOT use Bengali or Hindi.",
    "bn": "You MUST respond entirely in Bengali.",
    "te": "You MUST respond entirely in Telugu.",
    "ta": "You MUST respond entirely in Tamil.",
    "mr": "You MUST respond entirely in Marathi using Devanagari script.",
    "kn": "You MUST respond entirely in Kannada.",
    "ml": "You MUST respond entirely in Malayalam.",
    "pa": "You MUST respond entirely in Punjabi using Gurmukhi script.",
    "gu": "You MUST respond entirely in Gujarati.",
    "ur": "You MUST respond entirely in Urdu.",
    "en": "You MUST respond entirely in English.",
}

# ---------------------------------------------------------------
# Out-of-scope fallback messages per language
# ---------------------------------------------------------------
FALLBACK_MESSAGES = {
    "hi": "🌾 मैं AgriGPT हूँ और मैं केवल कृषि और खेती से संबंधित प्रश्नों में सहायता करता हूँ।",
    "or": "🌾 ମୁଁ AgriGPT ଏବଂ ମୁଁ କେବଳ କୃଷି ସମ୍ବନ୍ଧୀୟ ପ୍ରଶ୍ନରେ ସହାୟତା କରେ।",
    "bn": "🌾 আমি AgriGPT এবং আমি শুধুমাত্র কৃষি ও চাষাবাদ সংক্রান্ত প্রশ্নে সহায়তা করি।",
    "ta": "🌾 நான் AgriGPT மற்றும் நான் வேளாண்மை தொடர்பான கேள்விகளுக்கு மட்டுமே உதவுகிறேன்।",
    "te": "🌾 నేను AgriGPT మరియు నేను వ్యవసాయం సంబంధించిన ప్రశ్ఞలకు మాత్రమే సహాయం చేస్తాను।",
    "mr": "🌾 मी AgriGPT आहे आणि मी फक्त शेतीसंबंधित प्रश्नांमध्येच मदद करतो।",
    "kn": "🌾 ನಾನು AgriGPT ಮತ್ತು ನಾನು ಕೃಷಿ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
    "ml": "🌾 ഞാൻ AgriGPT ആണ്, ഞാൻ കൃഷിയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾക്ക് മാത്രമേ സഹായിക്കൂ.",
    "pa": "🌾 ਮੈਂ AgriGPT ਹਾਂ ਅਤੇ ਮੈਂ ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਨਾਲ ਸੰਬੰਧਿਤ ਸਵਾਲਾਂ ਵਿੱਚ ਹੀ ਮਦਦ ਕਰਦਾ ਹਾਂ।",
    "gu": "🌾 હું AgriGPT છું અને હું માત્ર ખેતી સંબંધિત પ્રશ્નોમાં મદદ કરું છું।",
    "ur": "🌾 میں AgriGPT ہوں اور میں صرف زراعت سے متعلق سوالات میں مدد کرتا ہوں۔",
    "en": "🌾 I am AgriGPT and I only assist with agricultural and farming-related queries.",
}

# ---------------------------------------------------------------
# Unicode-script → language-code mapping
# Used to verify / correct Whisper's language detection.
# Odia (U+0B00–U+0B7F) is listed BEFORE Bengali (U+0980–U+09FF)
# so it takes priority when Odia characters appear in the text.
# ---------------------------------------------------------------
SCRIPT_LANG_MAP = [
    (re.compile(r'[\u0B00-\u0B7F]'), 'or'),   # Odia  ← must be before Bengali
    (re.compile(r'[\u0900-\u097F]'), 'hi'),   # Devanagari → Hindi / Marathi
    (re.compile(r'[\u0980-\u09FF]'), 'bn'),   # Bengali / Assamese
    (re.compile(r'[\u0B80-\u0BFF]'), 'ta'),   # Tamil
    (re.compile(r'[\u0C00-\u0C7F]'), 'te'),   # Telugu
    (re.compile(r'[\u0C80-\u0CFF]'), 'kn'),   # Kannada
    (re.compile(r'[\u0D00-\u0D7F]'), 'ml'),   # Malayalam
    (re.compile(r'[\u0A80-\u0AFF]'), 'gu'),   # Gujarati
    (re.compile(r'[\u0A00-\u0A7F]'), 'pa'),   # Gurmukhi → Punjabi
    (re.compile(r'[\u0600-\u06FF]'), 'ur'),   # Arabic → Urdu
]

def _correct_language_by_script(text: str, detected_lang: str) -> str:
    """
    Cross-check Whisper's detected language against the Unicode script of
    the transcribed text. Script membership is deterministic, so when the
    two disagree we trust the script.
    """
    for pattern, lang_code in SCRIPT_LANG_MAP:
        if pattern.search(text):
            if lang_code != detected_lang:
                print(f"[AgriGPT Voice] Script override: '{detected_lang}' → '{lang_code}'")
            return lang_code
    return detected_lang


def _convert_to_16khz_mono_wav(input_path: str, output_path: str) -> None:
    """
    Re-encode audio to 16 kHz mono WAV — the format Whisper performs best on.
    Accepts any format pydub / ffmpeg can read (webm, ogg, mp4, mp3, …).
    """
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
    audio.export(output_path, format="wav")


def _translate_to_english(text: str) -> str | None:
    """Translate any text to English using deep-translator (auto source detection).
    Returns None if translation fails or produces empty output.
    """
    try:
        result = GoogleTranslator(source="auto", target="en").translate(text)
        if result and result.strip() and result.strip().lower() != text.strip().lower():
            print(f"[AgriGPT Voice] Translated to EN: {result[:120]}")
            return result.strip()
    except Exception as e:
        print(f"[AgriGPT Voice] Translation failed: {e}")
    return None


def _translate_to_odia(text: str) -> str | None:
    """Translate phonetic Devanagari (Whisper's Odia approximation) to proper Odia script.
    Used so the frontend shows real Odia text instead of garbled Hindi.
    """
    try:
        result = GoogleTranslator(source="auto", target="or").translate(text)
        if result and result.strip():
            print(f"[AgriGPT Voice] Translated to Odia script: {result[:120]}")
            return result.strip()
    except Exception as e:
        print(f"[AgriGPT Voice] Odia translation failed: {e}")
    return None


def _build_combined_prompt(user_text: str, language_code: str, lang_prob: float = 100.0, english_meaning: str | None = None) -> str:
    """
    Build a single prompt that asks the LLM to both validate the domain and
    answer — eliminating a separate round-trip for _is_agriculture_query.
    When lang_prob is low the audio likely comes from a language Whisper does not
    support (e.g. Odia), producing a phonetic Devanagari approximation; in that
    case we add an explicit hint so the LLM judges intent, not literal text.
    """
    lang_instruction = LANG_INSTRUCTIONS.get(
        language_code,
        "Respond only in the same language as the question."
    )
    fallback_msg = FALLBACK_MESSAGES.get(language_code, FALLBACK_MESSAGES["en"])

    phonetic_note = ""
    if lang_prob < 80:
        glossary = _build_odia_phonetic_glossary()
        meaning_hint = ""
        if english_meaning:
            meaning_hint = (
                f"\nAutomatic English translation of the audio (for reference): \"{english_meaning}\"\n"
                "Use this translation as the primary signal for understanding what the user asked.\n"
            )
        phonetic_note = (
            "IMPORTANT: The query below is a speech-to-text transcription of Odia audio "
            "by an engine that has NO Odia language model. "
            "The Odia words have been phonetically approximated in Devanagari script and "
            "will look like garbled or non-standard Hindi/Bengali. "
            "Use the glossary below to map the approximate sounds back to real Odia words "
            "and judge agricultural INTENT — do NOT reject the query just because the "
            "Devanagari text looks broken.\n\n"
            f"{glossary}\n"
            "\nExample: 'चाखा' or 'चाशा' sounds like CHASHA = \u0b1a\u0b3e\u0b37 = farming.\n"
            f"{meaning_hint}\n"
        )

    return (
        f"{lang_instruction}\n\n"
        "You are AgriGPT, an AI assistant specialised in agriculture and farming.\n\n"
        f"{phonetic_note}"
        "If the following query is related to agriculture, farming, crops, soil, "
        "irrigation, fertilizers, pest control, or weather impact on farming — "
        "answer it helpfully in the language specified above.\n\n"
        "If it is NOT related to agriculture, respond with ONLY this exact message:\n"
        f"{fallback_msg}\n\n"
        f"Query: {user_text}"
    )


# ---------------------------------------------------------------
# Main Voice Handler
# Pipeline:
#   Upload → 16 kHz WAV → Whisper transcription + lang detection
#   → script-based lang correction → domain check
#   → LLM response in detected language → return
# ---------------------------------------------------------------
def handle_voice(audio_file, user_id, chat_id=None):
    audio_path = None
    wav_path   = None
    try:
        # ── 1. Save uploaded audio ────────────────────────────────
        with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as tmp:
            audio_path = tmp.name
            audio_file.save(audio_path)

        # ── 2. Convert to 16 kHz mono WAV ────────────────────────
        wav_path = audio_path + "_16k.wav"
        _convert_to_16khz_mono_wav(audio_path, wav_path)

        # ── 3. Whisper transcription — pass 1: auto language detection ──
        # Whisper has NO Odia model. Odia audio gets misclassified as Hindi,
        # Bengali, Nepali, Maithili, etc. with low confidence, and transcribed
        # as a garbled mix of scripts.  We detect this case and re-transcribe
        # with a forced Hindi hint so Odia sounds map to *consistent* phonetic
        # Devanagari — the best Whisper can give us for Odia.
        _WHISPER_OPTS = dict(
            beam_size=1,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
        )
        # Languages Whisper confuses with Odia (no Odia model in Whisper)
        _ODIA_CONFUSED = {"hi", "bn", "ne", "mr", "mai", "bho", "as"}

        segments, info = whisper_model.transcribe(wav_path, **_WHISPER_OPTS)
        user_text     = " ".join(seg.text for seg in segments).strip()
        language_code = info.language or "en"
        lang_prob     = round(info.language_probability * 100, 1)

        print(f"[AgriGPT Voice] Pass-1 lang: {language_code} ({lang_prob}%)")
        print(f"[AgriGPT Voice] Pass-1 text: {user_text[:120]}")

        # ── 3b. Odia re-transcription (pass 2) ───────────────────
        # If low-confidence AND the guessed language is one Whisper confuses
        # with Odia, force a second transcription with language="hi" so that
        # Odia phonemes map to Devanagari consistently instead of being split
        # across random scripts.
        english_meaning = None   # filled below if Odia is detected
        odia_display    = None   # proper Odia-script version for frontend display
        if language_code in _ODIA_CONFUSED and lang_prob < 75:
            print(f"[AgriGPT Voice] Suspected Odia — re-transcribing with Hindi hint for consistent phonetics")
            seg2, _ = whisper_model.transcribe(wav_path, language="hi", **_WHISPER_OPTS)
            retranscribed = " ".join(s.text for s in seg2).strip()
            if retranscribed:
                user_text = retranscribed
                print(f"[AgriGPT Voice] Pass-2 text: {user_text[:120]}")
            # Translate phonetic Devanagari → English (LLM intent signal)
            english_meaning = _translate_to_english(user_text)
            # Translate phonetic Devanagari → Odia script (frontend display)
            odia_display = _translate_to_odia(user_text)
            language_code = "or"
            lang_prob     = 0.0   # signal to LLM prompt builder that this is forced

        # ── 4. Script-based language correction ──────────────────
        # If Odia Unicode codepoints appear in the transcript (unlikely with
        # Whisper small, but possible), override to Odia.
        if user_text and language_code != "or":
            language_code = _correct_language_by_script(user_text, language_code)

        # ── 4b. Broader Odia probability heuristic ───────────────
        # Catch cases where pass-2 wasn't triggered but confidence is still
        # suspiciously low for a closely related language.
        if language_code in _ODIA_CONFUSED and lang_prob < 80:
            print(f"[AgriGPT Voice] Low-confidence {language_code} ({lang_prob}%) — overriding to Odia")
            # Still attempt a translation to help the LLM
            if english_meaning is None:
                english_meaning = _translate_to_english(user_text)
            if odia_display is None:
                odia_display = _translate_to_odia(user_text)
            language_code = "or"

        lang_name = SUPPORTED_LANGUAGES.get(language_code, language_code.upper())
        print(f"[AgriGPT Voice] Final language: {language_code} ({lang_name})")

        # ── 5. Handle empty transcription ────────────────────────
        if not user_text:
            return {
                "user_text"    : "",
                "ai_reply"     : FALLBACK_MESSAGES.get("en"),
                "response_type": "fallback",
                "language"     : language_code,
                "lang_prob"    : lang_prob,
            }

        # ── 6 & 7. Domain check + AI response in one LLM call ───
        fallback_msg  = FALLBACK_MESSAGES.get(language_code, FALLBACK_MESSAGES["en"])
        combined      = _build_combined_prompt(user_text, language_code, lang_prob, english_meaning)
        response      = get_ai_response(combined)
        if fallback_msg.strip() in response.strip():
            response      = fallback_msg
            response_type = "fallback"
            print("[AgriGPT Voice] Out-of-scope query — returning fallback")
        else:
            response_type = "ai"
            print(f"[AgriGPT Voice] AI response generated ({len(response)} chars)")

        # ── 8. Create/update session + persist to MongoDB ────────
        if chat_id is None:
            lang_name_full = SUPPORTED_LANGUAGES.get(language_code, language_code.upper())
            title   = generate_chat_title(user_text, lang_name_full)
            chat_id = create_chat_session(user_id, title, language_code)
            print(f"[AgriGPT Voice] New chat session created: {chat_id}")
        else:
            update_chat_session(chat_id)

        save_chat(
            user_id       = user_id,
            question      = user_text,
            answer        = response,
            response_type = response_type,
            language      = language_code,
            input_type    = "voice",
            chat_id       = chat_id,
        )

        return {
            "user_text"    : odia_display or user_text,  # show proper Odia script; fallback to phonetic
            "ai_reply"     : response,
            "response_type": response_type,
            "language"     : language_code,
            "lang_prob"    : lang_prob,
            "chat_id"      : chat_id,
        }

    except Exception as e:
        print(f"[AgriGPT Voice] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error"  : "Voice processing failed",
            "details": str(e),
        }

    finally:
        for path in (audio_path, wav_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass


