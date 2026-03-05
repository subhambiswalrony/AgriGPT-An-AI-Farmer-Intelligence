import os
import json
import requests as http_client
from pathlib import Path
from services.llm_service import get_ai_response
from services.db_service import save_report

# ─────────────────────────────────────────────
#  Load datasets from JSON files
# ─────────────────────────────────────────────
_DATA_DIR = Path(__file__).parent / "dataset"

with open(_DATA_DIR / "crop_requirements.json", encoding="utf-8") as _f:
    CROP_REQUIREMENTS_DB: dict = json.load(_f)

with open(_DATA_DIR / "state_annual_rainfall.json", encoding="utf-8") as _f:
    STATE_ANNUAL_RAINFALL: dict = json.load(_f)

WEATHER_PORT = int(os.getenv("WEATHER_PORT", 3020))



# ─────────────────────────────────────────────
#  HELPER: Fetch environmental data from Node server
# ─────────────────────────────────────────────
def fetch_environmental_data(district: str, state: str) -> dict:
    """Call the Node.js weather server to get live temp, humidity, and soil type.
    Falls back gracefully if the server is unavailable."""
    city_query = f"{district}, {state}, India"
    url = f"http://127.0.0.1:{WEATHER_PORT}/api/agriculture-data"
    try:
        resp = http_client.get(url, params={"city": city_query}, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        weather_current = data.get("weather", {}).get("current", {})
        main = weather_current.get("main", {})
        soil = data.get("soil_and_water", {})

        temperature = main.get("temp")
        humidity    = main.get("humidity")
        soil_type   = (
            soil.get("SoilCommonNameEnglish")
            or soil.get("SoilType")
            or "Unknown"
        )

        # Annual rainfall from state lookup table
        annual_rainfall = STATE_ANNUAL_RAINFALL.get(state.lower().strip())

        print(f"  ✓ Weather fetched → Temp: {temperature}°C, Humidity: {humidity}%, "
              f"Soil: {soil_type}, Rainfall: {annual_rainfall} mm/yr")

        return {
            "temperature":    temperature,
            "humidity":       humidity,
            "soil_type":      soil_type,
            "annual_rainfall": annual_rainfall,
        }

    except Exception as e:
        print(f"  ⚠️ Weather fetch failed ({e}). Using N/A placeholders.")
        return {
            "temperature":    None,
            "humidity":       None,
            "soil_type":      "Unknown",
            "annual_rainfall": STATE_ANNUAL_RAINFALL.get(state.lower().strip()),
        }


# ─────────────────────────────────────────────
#  HELPER: Lookup crop requirements
# ─────────────────────────────────────────────
def get_crop_requirements(crop_name: str) -> dict | None:
    """Fuzzy-match crop name to CROP_REQUIREMENTS_DB and return requirements dict."""
    key = crop_name.lower().strip()
    # exact match first
    if key in CROP_REQUIREMENTS_DB:
        return CROP_REQUIREMENTS_DB[key]
    # partial match
    for db_key, db_val in CROP_REQUIREMENTS_DB.items():
        if db_key in key or key in db_key:
            return db_val
    return None


# ─────────────────────────────────────────────
#  MAIN: Generate farming report (5 inputs)
# ─────────────────────────────────────────────
def generate_farming_report(
    user_id: str,
    crop_name: str,
    district: str,
    state: str,
    farming_type: str,
    language: str = "English"
) -> dict:
    """Generate agricultural suitability report – all env & crop data are auto-fetched."""

    if not crop_name or not district or not state:
        return {"error": "Crop name, district, and state are required"}

    print(f"\n{'='*60}")
    print(f"📊 Generating Agricultural Suitability Report (Auto-Fetch Mode):")
    print(f"   Crop: {crop_name}")
    print(f"   Location: {district}, {state}")
    print(f"   Farming Type: {farming_type}")
    print(f"   Language: {language}")
    print(f"   User: {user_id}")
    print(f"{'='*60}")

    # ── 1. Auto-fetch environmental data ──
    env = fetch_environmental_data(district, state)
    temperature    = f"{env['temperature']} °C" if env["temperature"] is not None else "N/A (use regional average)"
    humidity       = f"{env['humidity']} %" if env["humidity"] is not None else "N/A (use regional average)"
    annual_rainfall = f"{env['annual_rainfall']} mm/year" if env["annual_rainfall"] else "N/A"
    soil_type      = env["soil_type"]

    # ── 2. Lookup crop requirements from DB ──
    crop_req = get_crop_requirements(crop_name)
    if crop_req:
        cr_temp_range    = f"{crop_req['ideal_temp_min']} – {crop_req['ideal_temp_max']} °C"
        cr_humidity_max  = f"≤ {crop_req['ideal_humidity_max']} %"
        cr_rainfall_max  = f"≤ {crop_req['ideal_rainfall_max']} mm/year"
        cr_soil          = crop_req["preferred_soil"]
        cr_quality       = crop_req["quality_sensitive"]
    else:
        cr_temp_range    = "N/A – consult local agronomy data"
        cr_humidity_max  = "N/A"
        cr_rainfall_max  = "N/A"
        cr_soil          = "Loamy / Well-drained"
        cr_quality       = "Moderate – refer to standard crop guidelines"

    # ── 3. Language instruction ──
    lang_instruction = f"Write EVERY single word in {language} language ONLY. Do NOT mix any other language."
    if language == "English":
        lang_instruction = "Write in English only. Do NOT mix any other language."
    elif language == "Hindi":
        lang_instruction = "हर शब्द केवल हिंदी में लिखें।"

    # ── 4. Build prompt ──
    prompt = f"""You are an Agricultural Decision Support Expert.

Generate a structured, evidence-based, analytical agricultural suitability report.
All environmental and crop requirement data have been SYSTEM-FETCHED (real-time or from a verified crop database).

**CRITICAL LANGUAGE REQUIREMENT:**
{lang_instruction}

======================
SYSTEM-FETCHED DATA
======================

Crop: {crop_name}
Location: {district}, {state}
Farming Type: {farming_type}

[ENVIRONMENTAL CONDITIONS – Auto-Fetched]
• Current Temperature:   {temperature}
• Current Humidity:      {humidity}
• State Annual Rainfall: {annual_rainfall}
• Soil Type:             {soil_type}

[CROP REQUIREMENT DATASET – From AgriGPT Database]
• Ideal Temperature Range:  {cr_temp_range}
• Max Ideal Humidity:        {cr_humidity_max}
• Max Annual Rainfall:       {cr_rainfall_max}
• Preferred Soil Types:      {cr_soil}
• Quality Sensitivity:       {cr_quality}

======================
SCORING CRITERIA (Total = 100 pts)
======================

Temperature compatibility  → 30 points
Humidity compatibility     → 25 points
Rainfall compatibility     → 25 points
Soil compatibility         → 20 points

Classification:
  80–100 → Highly Suitable
  60–79  → Moderately Suitable
  40–59  → Risky
  < 40   → Not Recommended

======================
INSTRUCTIONS
======================

1. Compare current environmental data with crop requirements for each factor.
2. Allocate points strictly per the scoring criteria above.
3. Identify quality risks and yield impacts based on mismatches.
4. Provide an economic feasibility insight specific to {farming_type} farming.
5. Provide 3 actionable management recommendations.
6. Keep all analysis data-driven and concise.

**FORMAT YOUR RESPONSE EXACTLY AS BELOW (use these exact headers):**

ENVIRONMENTAL_SUMMARY:
• [Temperature observation]
• [Humidity observation]
• [Rainfall and soil observation]

CROP_REQUIREMENT_SUMMARY:
• [Temperature requirement and comparison]
• [Humidity and rainfall requirement]
• [Soil and quality sensitivity notes]

COMPATIBILITY_ANALYSIS:
• ✅/⚠️/❌ Temperature ([score]/30): [analysis]
• ✅/⚠️/❌ Humidity ([score]/25): [analysis]
• ✅/⚠️/❌ Rainfall ([score]/25): [analysis]
• ✅/⚠️/❌ Soil ([score]/20): [analysis]

SUITABILITY_SCORE:
• Total Score: [XX]/100 – [Classification]
• [One sentence explaining the score breakdown]
• [One sentence on key limiting factor if any]

QUALITY_IMPACT_ANALYSIS:
• [Quality risk or benefit 1]
• [Quality risk or benefit 2]
• [Quality risk or benefit 3]

ECONOMIC_FEASIBILITY:
• [Market demand and price outlook for {farming_type} farming in {state}]
• [Input cost vs. expected yield return given current suitability]
• [Risk assessment and mitigation for commercial viability]

FINAL_RECOMMENDATION:
• [Recommendation 1 – crop management action]
• [Recommendation 2 – risk mitigation or soil/water management]
• [Recommendation 3 – whether to proceed, defer, or switch crop]

Write ALL content in {language} ONLY. Start each bullet with •"""

    try:
        response = get_ai_response(prompt)

        print(f"\n✓ AI Response received ({len(response)} chars)")
        print(f"First 200 chars: {response[:200]}...")

        report_data = parse_suitability_report(
            response, crop_name, district, state, farming_type, language
        )

        # Save to database (only for authenticated users)
        if user_id != "trial_user":
            try:
                save_report(user_id, crop_name, f"{district}, {state}", report_data, language)
                print(f"✓ Report saved to database for user: {user_id}")
            except Exception as e:
                print(f"⚠️ Failed to save report: {e}")

        print(f"✓ Report generated successfully")
        print(f"{'='*60}\n")

        return report_data

    except Exception as e:
        print(f"❌ Error generating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to generate report: {str(e)}"}


def parse_suitability_report(
    response: str,
    crop_name: str,
    district: str,
    state: str,
    farming_type: str,
    language: str
) -> dict:
    """Parse AI response into structured suitability report (7 sections)"""

    report = {
        "crop": crop_name,
        "district": district,
        "state": state,
        "region": f"{district}, {state}",
        "farming_type": farming_type,
        "language": language,
        "environmentalSummary": [],
        "cropRequirementSummary": [],
        "compatibilityAnalysis": [],
        "suitabilityScore": [],
        "qualityImpactAnalysis": [],
        "economicFeasibility": [],
        "finalRecommendation": []
    }

    try:
        print(f"\n🔍 Parsing suitability report (7 sections)...")

        section_map = {
            "environmentalSummary":   ["ENVIRONMENTAL_SUMMARY", "ENVIRONMENTAL SUMMARY"],
            "cropRequirementSummary": ["CROP_REQUIREMENT_SUMMARY", "CROP REQUIREMENT SUMMARY", "CROP_REQUIREMENT"],
            "compatibilityAnalysis":  ["COMPATIBILITY_ANALYSIS", "COMPATIBILITY ANALYSIS"],
            "suitabilityScore":       ["SUITABILITY_SCORE", "SUITABILITY SCORE"],
            "qualityImpactAnalysis":  ["QUALITY_IMPACT_ANALYSIS", "QUALITY IMPACT ANALYSIS", "QUALITY_IMPACT"],
            "economicFeasibility":    ["ECONOMIC_FEASIBILITY", "ECONOMIC FEASIBILITY", "ECONOMIC_FEASIBILITY_INSIGHT"],
            "finalRecommendation":    ["FINAL_RECOMMENDATION", "FINAL RECOMMENDATION"]
        }

        SKIP_KEYWORDS = [
            'ENVIRONMENTAL_SUMMARY', 'CROP_REQUIREMENT', 'COMPATIBILITY_ANALYSIS',
            'SUITABILITY_SCORE', 'QUALITY_IMPACT', 'ECONOMIC_FEASIBILITY', 'FINAL_RECOMMENDATION'
        ]

        current_section = None
        lines = response.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            upper_line = line.upper().replace(':', '').strip()

            # Check if this line is a section header
            section_found = False
            for section_key, patterns in section_map.items():
                if any(pattern in upper_line for pattern in patterns):
                    current_section = section_key
                    section_found = True
                    print(f"  ✓ Found section: {section_key}")
                    break

            if section_found:
                continue

            # Add content to current section
            if current_section:
                cleaned = line.lstrip('•-*·▪▸→').strip()
                if len(cleaned) < 5:
                    continue
                # Skip lines that are section headers themselves
                if any(kw in cleaned.upper() for kw in SKIP_KEYWORDS):
                    continue

                report[current_section].append(cleaned)
                print(f"    → {current_section}: {cleaned[:70]}...")

        # Summary
        print(f"\n📊 Parse Results:")
        for key in ["environmentalSummary", "cropRequirementSummary", "compatibilityAnalysis",
                    "suitabilityScore", "qualityImpactAnalysis", "economicFeasibility", "finalRecommendation"]:
            print(f"  {key}: {len(report[key])} items")

        # Fallback for any empty sections
        any_empty = any(
            len(report[k]) == 0
            for k in ["environmentalSummary", "cropRequirementSummary", "compatibilityAnalysis",
                      "suitabilityScore", "qualityImpactAnalysis", "economicFeasibility", "finalRecommendation"]
        )

        if any_empty:
            print("⚠️ Some sections empty, applying fallback data")
            fallback = get_fallback_suitability_data(crop_name, language)
            for k in fallback:
                if isinstance(report.get(k), list) and len(report[k]) == 0:
                    report[k] = fallback[k]

        return report

    except Exception as e:
        print(f"❌ Parse error: {str(e)}")
        import traceback
        traceback.print_exc()
        fallback = get_fallback_suitability_data(crop_name, language)
        return {
            "crop": crop_name,
            "district": district,
            "state": state,
            "region": f"{district}, {state}",
            "farming_type": farming_type,
            "language": language,
            **fallback
        }


def get_fallback_suitability_data(crop_name: str, language: str) -> dict:
    """Fallback data when AI parsing fails"""
    return {
        "environmentalSummary": [
            f"Current environmental conditions recorded for {crop_name} suitability analysis.",
            "Temperature, humidity, annual rainfall, and soil type were auto-fetched from AgriGPT weather services.",
            "Detailed AI analysis unavailable — please regenerate the report."
        ],
        "cropRequirementSummary": [
            f"{crop_name} requires specific temperature and moisture conditions for optimal growth.",
            "Soil compatibility and humidity levels are critical quality factors.",
            "Refer to standard agronomic guidelines for precise thresholds."
        ],
        "compatibilityAnalysis": [
            "⚠️ Temperature (–/30): Analysis pending — please regenerate the report.",
            "⚠️ Humidity (–/25): Analysis pending — please regenerate the report.",
            "⚠️ Rainfall (–/25): Analysis pending — please regenerate the report.",
            "⚠️ Soil (–/20): Analysis pending — please regenerate the report."
        ],
        "suitabilityScore": [
            "Total Score: N/A – Unable to calculate. Please regenerate the report.",
            "Ensure location is valid and the crop name is correctly spelled."
        ],
        "qualityImpactAnalysis": [
            f"Quality impact for {crop_name} depends on alignment with ideal environmental conditions.",
            "Excess humidity may increase fungal disease risk and reduce shelf life.",
            "Temperature deviations can reduce crop quality, sugar content, and marketability."
        ],
        "economicFeasibility": [
            f"Economic viability for {crop_name} farming will depend on suitability score and market prices.",
            "Input cost vs. expected yield return analysis is pending — regenerate the report.",
            "Consult local market data and agri-extension services for current pricing."
        ],
        "finalRecommendation": [
            "Regenerate the report ensuring the district and state names are correct.",
            "Consult a local agronomist for region-specific crop suitability guidance.",
            "Monitor weather and soil conditions regularly throughout the crop cycle."
        ]
    }

