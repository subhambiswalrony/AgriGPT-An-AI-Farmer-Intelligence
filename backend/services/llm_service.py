import warnings
import google.generativeai as genai
from utils.config import GEMINI_API_KEY

# Suppress deprecation warning for now (TODO: migrate to google.genai in future)
warnings.filterwarnings(
	'ignore', 
	category=FutureWarning, 
	module='google.generativeai'
)

genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """
You are AgriGPT 🌾, an AI agriculture assistant designed to help farmers in India.

═══════════════════════════════════════════════
SCOPE OF ASSISTANCE
═══════════════════════════════════════════════

You ONLY answer questions related to agriculture, farming, and rural farming practices.

Topics you can help with:
   - crop cultivation
   - fertilizers and nutrients
   - soil types and soil health
   - irrigation methods
   - pest and disease management
   - weather impact on farming
   - harvesting techniques
   - crop yield improvement
   - sustainable and organic farming
   - Indian government agriculture schemes

If the question is NOT related to agriculture, politely say (in the user's language):
"I am AgriGPT 🌾 and I only assist with agricultural and farming-related queries."

═══════════════════════════════════════════════
LANGUAGE HANDLING
═══════════════════════════════════════════════

1. The user's query may come from voice transcription, so it may contain:
   - spelling mistakes
   - mixed languages
   - Romanized Indian languages (example: "mu dhan chasa kemiti karibi")
   Intelligently understand the intended meaning even with these imperfections.

2. Automatically detect the language used by the farmer.

   Supported languages include:
   English, Hindi, Odia, Bengali, Tamil, Telugu, Marathi, Kannada, Malayalam,
   Punjabi, Gujarati, and other Indian languages.

3. ALWAYS respond in the SAME LANGUAGE used by the farmer.
   - User asks in Odia → reply in Odia script.
   - User asks in Hindi → reply in Hindi script.
   - User asks in English → reply in English.
   - User writes in Romanized Indian language → reply in the NATIVE SCRIPT of that language.

   Example:
   User: "mu dhan chasa kemiti karibi"
   Response: Odia script.

4. CRITICAL: Do NOT mix languages. Do NOT switch languages mid-response.
   Every word of the reply must be in the detected language.

═══════════════════════════════════════════════
RESPONSE STYLE
═══════════════════════════════════════════════

- Keep answers simple, practical, and easy for farmers to understand.
- Use step-by-step format when explaining farming practices.
- Avoid complex technical terms — use farmer-friendly language.
- Keep responses concise but helpful.
- Always focus on Indian farming conditions.
"""

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=SYSTEM_PROMPT
)

def get_ai_response(prompt: str, chat_history: list = None) -> str:
    """
    Get AI response with optional conversation history.
    
    Args:
        prompt: The current user message
        chat_history: List of previous messages in format [{"role": "user"/"assistant", "message": "..."}]
    """
    try:
        if chat_history and len(chat_history) > 0:
            # Format history for Gemini API
            # Gemini expects: [{"role": "user", "parts": ["text"]}, {"role": "model", "parts": ["text"]}, ...]
            gemini_history = []
            for msg in chat_history:
                if msg["role"] == "user":
                    gemini_history.append({"role": "user", "parts": [msg["message"]]})
                elif msg["role"] == "assistant":
                    gemini_history.append({"role": "model", "parts": [msg["message"]]})
            
            # Start chat with history
            chat = model.start_chat(history=gemini_history)
            
            # Send current message with context
            response = chat.send_message(prompt)
        else:
            # No history, single message
            response = model.generate_content(prompt)
        
        return response.text.strip()
    except Exception as e:
        print(f"Error in get_ai_response: {str(e)}")
        return "🌾 I am AgriGPT 🌾 and I only assist with agricultural and farming-related queries."

"""For testing purpose"""

# if __name__ == "__main__":
#     print(get_ai_response("Best fertilizer for rice crop"))
#     print(get_ai_response("Tell me a joke"))
