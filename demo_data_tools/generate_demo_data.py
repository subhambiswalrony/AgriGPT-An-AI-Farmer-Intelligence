"""
AgriGPT Demo Data Generator
============================
Standalone script — does NOT import any Flask app code.
Connects directly to MongoDB using credentials from backend/.env

Usage:
    python generate_demo_data.py

Identification marker:
    All demo users  → email ends with  @demo.agrigpt
    All demo names  → prefixed with    "Demo_"
    Demo feedback   → email ends with  @demo.agrigpt

Cleanup:
    Run clear_demo_data.py to safely remove all generated data.
"""

import os
import sys
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Load backend/.env without importing Flask app ─────────────────────────
_env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
if _env_path.exists():
    with open(_env_path, encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                _val = _val.strip().strip('"').strip("'")
                os.environ.setdefault(_key.strip(), _val)
else:
    print(f"⚠️  backend/.env not found at {_env_path}")
    print("   Set MONGO_URI and MONGO_DB as environment variables manually.")

MONGO_URI = os.environ.get("MONGO_URI")
MONGO_DB  = os.environ.get("MONGO_DB")

if not MONGO_URI or not MONGO_DB:
    print("❌ MONGO_URI or MONGO_DB is not set.")
    print("   Ensure backend/.env exists with MONGO_URI and MONGO_DB defined.")
    sys.exit(1)

try:
    from pymongo import MongoClient
except ImportError:
    print("❌ pymongo not installed. Run:  pip install pymongo")
    sys.exit(1)

try:
    import bcrypt
except ImportError:
    print("❌ bcrypt not installed. Run:  pip install bcrypt")
    sys.exit(1)

# ── MongoDB connection ─────────────────────────────────────────────────────
client = MongoClient(MONGO_URI)
db     = client[MONGO_DB]

users_col       = db.users
sessions_col    = db.chat_sessions
history_col     = db.chat_history
reports_col     = db.farming_reports
feedback_col    = db.user_feedback
predictions_col = db.disease_predictions
weather_col     = db.weather_searches

# ── Identification Marker ─────────────────────────────────────────────────
DEMO_DOMAIN = "@demo.agrigpt"

# ── Realistic Indian Data Pools ───────────────────────────────────────────
FIRST_NAMES = [
    "Aarav", "Amit", "Anjali", "Ankit", "Arjun", "Ashok", "Bhavna",
    "Chandana", "Deepak", "Devika", "Divya", "Farhan", "Geeta", "Gopi",
    "Hari", "Hemant", "Indira", "Jayant", "Kavitha", "Kiran", "Lalit",
    "Lalita", "Mahesh", "Meena", "Mohan", "Neeraj", "Poonam", "Pooja",
    "Pradeep", "Prakash", "Priya", "Rahul", "Raja", "Rakesh", "Ramesh",
    "Ravi", "Rekha", "Rohit", "Sangeeta", "Sanjay", "Santosh", "Seema",
    "Shiva", "Sita", "Sumir", "Sunita", "Suresh", "Tarun", "Uma", "Usha",
    "Vijay", "Vikas", "Vinita", "Vivek", "Yash", "Dinesh", "Girish",
    "Harish", "Jagdish", "Kamlesh", "Manish", "Naresh", "Paresh", "Rajesh",
    "Satish", "Suresh", "Umesh", "Yogesh", "Zara", "Natasha", "Pallavi",
]

LAST_NAMES = [
    "Biswal", "Chauhan", "Devi", "Ghosh", "Gupta", "Iyer", "Jha", "Joshi",
    "Kapoor", "Kumar", "Mishra", "Nair", "Pande", "Patel", "Pillai", "Rao",
    "Reddy", "Sahoo", "Sharma", "Singh", "Sinha", "Tiwari", "Verma", "Yadav",
    "Das", "Dubey", "Garg", "Malhotra", "Pandey", "Rathore", "Saxena",
    "Thakur", "Tripathi", "Agarwal", "Bhat", "Chaudhary", "Desai",
]

# Districts spread across major agricultural states
DISTRICTS = [
    "Patna", "Gaya", "Muzaffarpur", "Darbhanga",           # Bihar
    "Varanasi", "Lucknow", "Agra", "Meerut", "Kanpur",     # UP
    "Bhopal", "Indore", "Jabalpur", "Sagar",                # MP
    "Raipur", "Bilaspur", "Durg",                           # Chhattisgarh
    "Nagpur", "Pune", "Nashik", "Aurangabad", "Amravati",   # Maharashtra
    "Kolkata", "Howrah", "Asansol", "Siliguri", "Bardhaman",# West Bengal
    "Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur",      # Odisha
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",        # Rajasthan
    "Hyderabad", "Visakhapatnam", "Vijayawada", "Guntur",   # Andhra/Telangana
    "Chennai", "Coimbatore", "Madurai", "Salem", "Trichy",  # Tamil Nadu
    "Bengaluru", "Mysore", "Hubli", "Mangalore", "Bellary", # Karnataka
    "Chandigarh", "Amritsar", "Ludhiana", "Patiala",        # Punjab
    "Guwahati", "Dibrugarh", "Jorhat", "Silchar",           # Assam
    "Ranchi", "Jamshedpur", "Dhanbad",                      # Jharkhand
]

# Crops tracked by admin's agricultural keyword scanner
CROPS = [
    "rice", "wheat", "maize", "cotton", "sugarcane", "potato", "tomato",
    "onion", "soybean", "groundnut", "mustard", "sunflower", "barley",
    "paddy", "mango", "banana", "millet", "corn",
]

CROP_DISPLAY = {c: c.capitalize() for c in CROPS}

# Plant disease labels returned by the prediction service (Upload Page)
PLANT_DISEASE_LABELS = [
    "Tomato Late Blight",
    "Tomato Early Blight",
    "Tomato Leaf Mold",
    "Tomato Bacterial Spot",
    "Tomato Mosaic Virus",
    "Potato Late Blight",
    "Potato Early Blight",
    "Potato Healthy",
    "Rice Blast",
    "Rice Brown Spot",
    "Rice Leaf Scald",
    "Wheat Stripe Rust",
    "Wheat Stem Rust",
    "Wheat Powdery Mildew",
    "Maize Gray Leaf Spot",
    "Maize Common Rust",
    "Maize Northern Leaf Blight",
    "Cotton Bacterial Blight",
    "Cotton Leaf Curl Virus",
    "Groundnut Early Leaf Spot",
    "Groundnut Late Leaf Spot",
    "Mango Powdery Mildew",
    "Mango Anthracnose",
    "Healthy Leaf",
]

# Image filenames that might be uploaded
IMAGE_FILENAMES = [
    "leaf_photo.jpg", "crop_scan.jpg", "field_image.png",
    "plant_leaf.jpg", "diseased_leaf.jpg", "crop_photo.jpeg",
    "farm_upload.jpg", "leaf_closeup.png", "IMG_{n}.jpg",
    "WhatsApp Image {n}.jpeg", "scan_{n}.jpg", "upload_{n}.png",
]

# Diseases tracked by admin's keyword scanner
DISEASES = [
    "blight", "rust", "wilt", "rot", "mildew", "mosaic",
    "spot", "canker", "smut", "scab", "yellowing", "fungal",
    "bacterial", "blast", "borer", "aphid", "leaf curl",
]

LANGUAGES     = ["english", "hindi", "bengali", "telugu", "odia", "marathi"]
LANG_WEIGHTS  = [0.55, 0.25, 0.08, 0.05, 0.04, 0.03]   # realistic distribution

# ── Q&A pairs — embed crop/disease keywords for admin agriculture analytics ──
QA_PAIRS = [
    (
        "How to prevent {disease} in {crop}?",
        "To prevent {disease} in {crop}, ensure proper drainage, use disease-resistant "
        "varieties, apply recommended fungicides at the right growth stage, and practice "
        "crop rotation every season. Monitor fields regularly for early signs.",
    ),
    (
        "What is the best fertilizer schedule for {crop} in {district}?",
        "For {crop} in {district} region, apply NPK 10-26-26 basal dose at sowing. "
        "Top-dress with urea (20 kg/acre) at 30 days after germination. Always conduct "
        "a soil test before application for best results.",
    ),
    (
        "My {crop} field has {disease}. What should I do?",
        "{disease} in {crop} requires immediate action. Remove infected plants, improve "
        "field drainage, apply Mancozeb 75% WP at 2.5 g/litre, and avoid overhead "
        "irrigation. Repeat spray after 10 days if needed.",
    ),
    (
        "Ideal temperature and irrigation for {crop}?",
        "{crop} grows best at 20–30°C. It requires irrigation at germination, tillering, "
        "flowering, and grain‑filling stages. Avoid waterlogging — provide raised beds "
        "or bund drainage in flood‑prone areas like {district}.",
    ),
    (
        "How to identify {disease} symptoms in {crop}?",
        "Symptoms of {disease} in {crop} include: yellowing or browning of leaves, dark "
        "lesions, wilting, stunted growth, and premature leaf drop. Examine the lower "
        "canopy first as infection typically starts there.",
    ),
    (
        "Which organic method controls {disease} in {crop}?",
        "For organic control of {disease}: spray neem oil at 5 ml/litre water, use "
        "Trichoderma viride 2.5 kg/ha mixed in FYM, maintain proper plant spacing, "
        "and remove crop debris after harvest. These practices also improve soil health.",
    ),
    (
        "What is the market rate for {crop} in {district} this season?",
        "MSP for {crop} has been revised upward this year. I recommend checking the "
        "{district} mandi board website or Agmarknet portal for today's live arrival "
        "prices. Prices vary 10–15% between regulated and unregulated markets.",
    ),
    (
        "How do I prepare soil for {crop} cultivation?",
        "Prepare soil for {crop} by deep ploughing twice before sowing, adding 10 t/ha "
        "farmyard manure, and maintaining soil pH between 6.0–7.0. Apply lime if pH < 5.8. "
        "{district} soils typically need micronutrient zinc supplementation.",
    ),
    (
        "Can I grow {crop} in {district} during Rabi season?",
        "Yes, {district} agroclimatic conditions are suitable for growing {crop} in Rabi. "
        "Sow between October and November. Use certified seeds, ensure winter irrigation "
        "is available, and apply recommended doses of P and K fertilisers.",
    ),
    (
        "How to increase {crop} yield in small-scale farming?",
        "To increase {crop} yield on small farms: use high-yielding varieties (HYV), "
        "follow recommended spacing, adopt integrated pest management for {disease} "
        "control, use mulching to conserve moisture, and keep records of input costs.",
    ),
    (
        "What causes {disease} and how to prevent it?",
        "{disease} is caused by fungal or bacterial pathogens favoured by high humidity "
        "and warm temperatures. Prevention: use disease-free seeds, apply seed treatment "
        "with Thiram 75%, ensure good air circulation, and avoid excess nitrogen in {crop}.",
    ),
    (
        "Tell me about intercropping {crop} with other crops.",
        "Intercropping {crop} with legumes like cowpea or moong improves soil nitrogen "
        "and provides additional income. In {district}, a 2:1 row ratio is common. "
        "This system also reduces {disease} spread due to increased biodiversity.",
    ),
]

REPORT_TEMPLATES = [
    (
        "Crop Health Assessment — {crop_d} in {district}\n\n"
        "Field Status: The {crop_d} crop shows moderate vegetative growth with occasional "
        "{disease} symptoms on older leaves. Overall health: FAIR.\n\n"
        "Key Observations:\n"
        "• Primary concern: {disease} affecting 15–20% of plant canopy\n"
        "• Soil moisture: Adequate\n"
        "• Weed pressure: Low\n\n"
        "Recommendations:\n"
        "1. Apply Mancozeb 75% WP @ 2 kg/ha within 48 hours\n"
        "2. Reduce irrigation frequency temporarily\n"
        "3. Monitor for secondary pests\n\n"
        "Follow-up: Re-assess field condition in 7 days."
    ),
    (
        "Agricultural Advisory Report — {crop_d} Cultivation\n"
        "District: {district} | Season: Kharif/Rabi\n\n"
        "Crop Profile:\n"
        "• Variety: Recommended HYV for {district} region\n"
        "• Sowing date: Within optimal window\n"
        "• Expected yield: 3.5–5.0 t/ha under good management\n\n"
        "Soil & Nutrient Status:\n"
        "• Soil type: Alluvial / Black cotton (typical for region)\n"
        "• pH: 6.2–7.0 (suitable for {crop_d})\n"
        "• NPK status: Medium — basal dose recommended\n\n"
        "Disease Risk: Moderate risk of {disease} during monsoon.\n"
        "Irrigations required: 4–6 critical irrigations.\n\n"
        "Economic Outlook: Positive given current MSP revision."
    ),
    (
        "Disease Management Plan — {crop_d}\n"
        "Location: {district} | Issue: {disease}\n\n"
        "Diagnosis: Field inspection confirms {disease} infection at early stage.\n\n"
        "Immediate Actions (0–3 days):\n"
        "• Remove and destroy infected plant material\n"
        "• Apply Copper Oxychloride 50% WP @ 3 g/litre\n"
        "• Avoid overhead irrigation for 5 days\n\n"
        "Follow-up Actions (7–14 days):\n"
        "• Second spray of systemic fungicide if required\n"
        "• Soil drenching with Trichoderma viride\n"
        "• Record all chemical applications for audit trail\n\n"
        "Long-term Prevention:\n"
        "• Use certified seed next season\n"
        "• Practice 2-year crop rotation with non-host crops"
    ),
    (
        "Seasonal Crop Planning Report\n"
        "District: {district} | Primary Crop: {crop_d}\n\n"
        "Climate Analysis:\n"
        "• Normal rainfall: 900–1200 mm annually\n"
        "• Temperature range: 18–38°C\n"
        "• Recommended crop: {crop_d} (well-suited to local conditions)\n\n"
        "Input Requirements per Acre:\n"
        "• Seeds: 8–10 kg (certified variety)\n"
        "• FYM: 4–5 tonnes\n"
        "• Fertiliser: NPK as per soil test\n"
        "• Pesticide (preventive): 1 application against {disease}\n\n"
        "Expected Return: ₹35,000–55,000 per acre at current MSP.\n"
        "Risk Factors: Untimely rainfall, {disease} outbreak, labour availability."
    ),
    (
        "Integrated Pest Management (IPM) Report — {crop_d}\n"
        "Region: {district}\n\n"
        "Pest Survey Summary:\n"
        "• Major pest identified: {disease}\n"
        "• Economic threshold level (ETL): Approaching critical\n"
        "• Natural enemy population: Moderate\n\n"
        "IPM Strategy:\n"
        "1. Cultural control: Adjust sowing date, remove crop debris\n"
        "2. Biological control: Release Trichogramma @ 50,000/ha\n"
        "3. Chemical control: Apply targeted pesticide only at ETL\n"
        "   Recommended: Chlorpyrifos 20% EC @ 2 ml/litre\n\n"
        "Cost-Benefit Ratio: IPM reduces chemical cost by 40%.\n"
        "Environmental impact: Minimal when ETL-based spraying is followed."
    ),
]

FEEDBACK_MSGS = [
    "AgriGPT is very helpful for daily farming advice. Got instant guidance on {crop_d} disease management.",
    "The platform helped me understand the correct fertilizer dose for my {crop_d} field in just one query.",
    "Excellent tool! The voice input feature works perfectly even in our local dialect. Saved a lot of time.",
    "Very useful for quick decisions during the growing season. AgriGPT prevented major losses from {disease}.",
    "The crop report feature is outstanding. I now share PDF reports with my district agricultural officer.",
    "Good platform overall. Sometimes responses take a few seconds but the quality of advice is excellent.",
    "I use AgriGPT every morning to check crop health recommendations. Highly recommend to all farmers.",
    "Please add more regional language support. Otherwise this is the best farming app available.",
    "Got a precise irrigation schedule for {crop_d}. Saved water and improved yields significantly.",
    "AgriGPT is better than calling the Kisan Helpline. Instant responses available 24 hours a day.",
    "Identified {disease} outbreak early and controlled it before it spread. Thank you AgriGPT team!",
    "Very professional platform. The admin dashboard shows great insights about farming trends nationwide.",
    "Would love weather-integration for my district. Otherwise, this app is a game-changer for smallholders.",
    "Our entire farmer group in the village now uses AgriGPT regularly. Great initiative by the team!",
    "Simple and intuitive interface. Works very well on low-end mobile phones with slow internet.",
    "The {crop_d} cultivation guide was accurate and detailed. Followed it and got 20% better yield.",
    "AgriGPT should be promoted in every Gram Panchayat. Farmers need this kind of smart assistance.",
    "Used the report feature to document {disease} management. Very helpful for government subsidy claims.",
]

# ── Helper functions ──────────────────────────────────────────────────────

def _naive_utc_ago(days_back: int = 30) -> datetime:
    """Naive UTC datetime (for users.created_at which uses datetime.utcnow)."""
    seconds = random.randint(0, days_back * 86400)
    return datetime.utcnow() - timedelta(seconds=seconds)


def _aware_utc_ago(days_back: int = 30) -> datetime:
    """Timezone-aware UTC datetime (for sessions, reports, feedback, chat messages)."""
    seconds = random.randint(0, days_back * 86400)
    return datetime.now(timezone.utc) - timedelta(seconds=seconds)


def _pick_language() -> str:
    return random.choices(LANGUAGES, weights=LANG_WEIGHTS, k=1)[0]


def _pick_crop() -> str:
    return random.choice(CROPS)


def _pick_disease() -> str:
    return random.choice(DISEASES)


def _random_name() -> str:
    return f"Demo_{random.choice(FIRST_NAMES)}_{random.choice(LAST_NAMES)}"


def _name_to_email(name: str) -> str:
    slug = name.replace("Demo_", "").replace("_", ".").lower()
    suffix = random.randint(100, 9999)
    return f"{slug}{suffix}{DEMO_DOMAIN}"


def _batch_insert(collection, documents: list, label: str, batch_size: int = 500) -> int:
    total = 0
    for i in range(0, len(documents), batch_size):
        result = collection.insert_many(documents[i : i + batch_size], ordered=False)
        total += len(result.inserted_ids)
    print(f"   ✅ Inserted {total:,} {label}")
    return total


# ── Stage 1 — Users ───────────────────────────────────────────────────────

def generate_users(count: int = 1100) -> list:
    print(f"\n📌 Stage 1/7 — Generating {count:,} demo users …")
    # Hash password ONCE and reuse — bcrypt is intentionally slow
    hashed_pw = bcrypt.hashpw(b"Demo@AgriGPT2024", bcrypt.gensalt())

    docs = []
    for _ in range(count):
        name      = _random_name()
        email     = _name_to_email(name)
        created   = _naive_utc_ago(30)
        last_login = (created + timedelta(hours=random.randint(1, 120))
                      if random.random() > 0.25 else None)
        docs.append({
            "email":         email,
            "password":      hashed_pw,
            "name":          name,
            "profilePicture": "",
            "auth_providers": ["local"],
            "created_at":    created,
            "last_login":    last_login,
        })

    result = users_col.insert_many(docs, ordered=False)
    user_ids = [str(uid) for uid in result.inserted_ids]
    print(f"   ✅ Inserted {len(user_ids):,} users  (emails: *{DEMO_DOMAIN})")
    return user_ids


# ── Stage 2 — Chat Sessions ───────────────────────────────────────────────

def generate_chat_sessions(user_ids: list, target: int = 3300) -> list:
    print(f"\n📌 Stage 2/7 — Generating ~{target:,} chat sessions …")
    sessions_per_user = max(2, target // len(user_ids))
    docs = []

    for uid in user_ids:
        count = sessions_per_user + random.choice([-1, 0, 0, 1, 2])
        for _ in range(max(1, count)):
            crop    = _pick_crop()
            lang    = _pick_language()
            created = _aware_utc_ago(30)
            title   = (f"{CROP_DISPLAY[crop]} Farming Query"
                       if random.random() > 0.4
                       else f"Help with {CROP_DISPLAY[crop]} crop")
            docs.append({
                "user_id":    uid,
                "title":      title,
                "language":   lang,
                "created_at": created,
                "updated_at": created + timedelta(minutes=random.randint(3, 90)),
            })

    _batch_insert(sessions_col, docs, "chat sessions")
    return docs   # docs now carry user_id for message generation


# ── Stage 3 — Chat Messages ───────────────────────────────────────────────

def generate_chat_messages(user_ids: list) -> None:
    print(f"\n📌 Stage 3/7 — Generating chat messages …")

    # Retrieve inserted session IDs grouped by user_id
    session_docs = list(
        sessions_col.find(
            {"user_id": {"$in": user_ids}},
            {"_id": 1, "user_id": 1, "language": 1, "created_at": 1},
        )
    )
    print(f"   Found {len(session_docs):,} sessions to populate …")

    messages = []
    for sess in session_docs:
        sid      = str(sess["_id"])
        uid      = sess["user_id"]
        lang     = sess.get("language", "english")
        base_ts  = sess.get("created_at", datetime.now(timezone.utc))

        crop    = _pick_crop()
        disease = _pick_disease()
        district = random.choice(DISTRICTS)

        n_pairs   = random.randint(2, 6)
        cur_time  = base_ts

        for _ in range(n_pairs):
            qa          = random.choice(QA_PAIRS)
            user_text   = qa[0].format(crop=CROP_DISPLAY[crop], disease=disease, district=district)
            asst_text   = qa[1].format(crop=CROP_DISPLAY[crop], disease=disease, district=district)
            input_type  = "voice" if random.random() < 0.18 else "text"
            user_ts     = cur_time + timedelta(seconds=random.randint(20, 180))
            asst_ts     = user_ts  + timedelta(seconds=random.randint(5,  60))
            cur_time    = asst_ts

            messages.append({
                "chat_id":       sid,
                "user_id":       uid,
                "role":          "user",
                "content":       user_text,
                "input_type":    input_type,
                "response_type": "text",
                "language":      lang,
                "timestamp":     user_ts,
            })
            messages.append({
                "chat_id":       sid,
                "user_id":       uid,
                "role":          "assistant",
                "content":       asst_text,
                "input_type":    input_type,
                "response_type": "text",
                "language":      lang,
                "timestamp":     asst_ts,
            })

    _batch_insert(history_col, messages, "chat messages", batch_size=1000)


# ── Stage 4 — Farming Reports ─────────────────────────────────────────────

def generate_reports(user_ids: list, target: int = 560) -> None:
    print(f"\n📌 Stage 4/7 — Generating {target:,}+ farming reports …")

    # Give ~55% of users at least one report (realistic)
    reporter_count = min(len(user_ids), target)
    reporters = random.sample(user_ids, reporter_count)

    docs = []
    for uid in reporters:
        crop     = _pick_crop()
        disease  = _pick_disease()
        district = random.choice(DISTRICTS)
        lang     = _pick_language()
        template = random.choice(REPORT_TEMPLATES)
        report_text = template.format(
            crop_d=CROP_DISPLAY[crop],
            district=district,
            disease=disease,
        )
        docs.append({
            "user_id":     uid,
            "crop_name":   CROP_DISPLAY[crop],
            "region":      district,
            "report_data": report_text,
            "language":    lang,
            "timestamp":   _aware_utc_ago(30),
        })

    _batch_insert(reports_col, docs, "farming reports")


# ── Stage 6 — Disease Predictions ───────────────────────────────────────────

def generate_disease_predictions(user_ids: list, target: int = 850) -> None:
    print(f"\n📌 Stage 6/7 — Generating {target:,} disease prediction records …")

    # Only a subset of registered users use the Upload Page (realistic)
    scanner_count = min(len(user_ids), int(target * 0.75))
    scanners = random.sample(user_ids, scanner_count)

    docs = []
    for _ in range(target):
        uid        = random.choice(scanners)
        disease    = random.choice(PLANT_DISEASE_LABELS)
        confidence = round(random.uniform(68.0, 99.5), 1)
        n          = random.randint(1000, 9999)
        tmpl       = random.choice(IMAGE_FILENAMES)
        image_name = tmpl.format(n=n) if "{n}" in tmpl else tmpl

        docs.append({
            "user_id":    uid,
            "disease":    disease,
            "confidence": confidence,
            "image_name": image_name,
            "timestamp":  _aware_utc_ago(30),
        })

    _batch_insert(predictions_col, docs, "disease predictions")


# ── Stage 7 — Weather Searches ────────────────────────────────────────────

# Minimal but realistic weather output structure (mirrors Node server response)
def _fake_weather_output(city: str) -> dict:
    temp     = round(random.uniform(18.0, 42.0), 1)
    humidity = random.randint(35, 95)
    rainfall = round(random.uniform(0.0, 25.0), 1)
    return {
        "location": city,
        "weather": {
            "temperature":   temp,
            "feels_like":    round(temp - random.uniform(1, 4), 1),
            "humidity":      humidity,
            "description":   random.choice([
                "clear sky", "few clouds", "scattered clouds",
                "light rain", "moderate rain", "overcast clouds",
                "mist", "haze",
            ]),
            "wind_speed":    round(random.uniform(2.0, 18.0), 1),
            "rainfall_mm":   rainfall,
        },
        "soil": {
            "moisture":     random.randint(20, 80),
            "temperature":  round(temp - random.uniform(2, 8), 1),
            "ph":           round(random.uniform(5.5, 7.8), 1),
            "nitrogen":     random.randint(20, 90),
            "phosphorus":   random.randint(10, 60),
            "potassium":    random.randint(15, 75),
        },
        "advisory": f"Weather conditions in {city} are {'favourable' if humidity < 70 else 'humid'}. "
                    f"Monitor crops for moisture-related diseases.",
    }


def generate_weather_searches(user_ids: list, target: int = 1400) -> None:
    print(f"\n📌 Stage 7/7 — Generating {target:,} weather search records …")

    # ~35% trial users, ~65% registered users
    n_trial      = int(target * 0.35)
    n_registered = target - n_trial

    docs = []

    # Trial user searches — no user_id
    for _ in range(n_trial):
        city = random.choice(DISTRICTS)
        docs.append({
            "input":          {"city": city},
            "user_id":        None,
            "user_type":      "trial",
            "_is_demo":       True,          # marker for safe cleanup
            "weather_output": _fake_weather_output(city),
            "timestamp":      _aware_utc_ago(30),
        })

    # Registered user searches
    for _ in range(n_registered):
        uid  = random.choice(user_ids)
        city = random.choice(DISTRICTS)
        docs.append({
            "input":          {"city": city},
            "user_id":        uid,
            "user_type":      "registered",
            "weather_output": _fake_weather_output(city),
            "timestamp":      _aware_utc_ago(30),
        })

    random.shuffle(docs)   # mix trial and registered timestamps naturally
    _batch_insert(weather_col, docs, "weather searches")


# ── Stage 5 — Feedback ────────────────────────────────────────────────────

def generate_feedback(target: int = 320) -> None:
    print(f"\n📌 Stage 5/7 — Generating {target:,} feedback entries …")

    statuses        = ["new", "in-progress", "resolved"]
    status_weights  = [0.50, 0.20, 0.30]

    docs = []
    for _ in range(target):
        first   = random.choice(FIRST_NAMES)
        last    = random.choice(LAST_NAMES)
        name    = f"Demo_{first} {last}"
        slug    = f"{first.lower()}.{last.lower()}{random.randint(100, 9999)}"
        email   = f"{slug}{DEMO_DOMAIN}"

        crop    = _pick_crop()
        disease = _pick_disease()
        msg     = random.choice(FEEDBACK_MSGS).format(
            crop_d=CROP_DISPLAY[crop],
            disease=disease,
        )

        status  = random.choices(statuses, weights=status_weights, k=1)[0]
        ts      = _aware_utc_ago(30)

        doc = {
            "name":      name,
            "email":     email,
            "message":   msg,
            "user_id":   None,
            "status":    status,
            "timestamp": ts,
        }
        if status == "resolved":
            doc["resolved_at"] = ts + timedelta(hours=random.randint(2, 72))

        docs.append(doc)

    _batch_insert(feedback_col, docs, "feedback entries")


# ── Entry point ────────────────────────────────────────────────────────────

def main() -> None:
    separator = "=" * 62
    print(separator)
    print("  AgriGPT — Demo Data Generator")
    print(f"  Target database : {MONGO_DB}")
    print(f"  Demo identifier : *{DEMO_DOMAIN}")
    print(separator)

    # Verify connection
    print("\n🔌 Connecting to MongoDB Atlas …")
    try:
        client.admin.command("ping")
        print("   ✅ Connection successful.\n")
    except Exception as exc:
        print(f"   ❌ Connection failed: {exc}")
        sys.exit(1)

    # Check for existing demo data to avoid accidental double-inserts
    existing = users_col.count_documents(
        {"email": {"$regex": f"{DEMO_DOMAIN}$", "$options": "i"}}
    )
    if existing > 0:
        print(f"⚠️  Warning: {existing:,} demo users already exist in the database.")
        answer = input("   Continue and add more demo data? [y/N]: ").strip().lower()
        if answer != "y":
            print("   Aborted. Run clear_demo_data.py first to remove existing demo data.")
            client.close()
            sys.exit(0)

    # Run all stages
    user_ids = generate_users(1100)
    generate_chat_sessions(user_ids, target=3300)
    generate_chat_messages(user_ids)
    generate_reports(user_ids, target=560)
    generate_feedback(target=320)
    generate_disease_predictions(user_ids, target=850)
    generate_weather_searches(user_ids, target=1400)

    # Final summary
    print(f"\n{separator}")
    print("  ✅ Demo data generation COMPLETE")
    print(separator)
    print(f"  Users inserted       : ~1,100   (all emails end with {DEMO_DOMAIN})")
    print(f"  Chat sessions        : ~3,300+")
    print(f"  Chat messages        : ~45,000+ (with crop/disease keywords)")
    print(f"  Farming reports      : ~560+")
    print(f"  Feedback entries     : 320")
    print(f"  Disease predictions  : ~850    (registered users, Upload Page)")
    print(f"  Weather searches     : ~1,400  (35% trial · 65% registered)")
    print()
    print("  The admin dashboard will now reflect real + demo data combined.")
    print("  To remove all demo data safely, run:  python clear_demo_data.py")
    print(separator)

    client.close()


if __name__ == "__main__":
    main()
