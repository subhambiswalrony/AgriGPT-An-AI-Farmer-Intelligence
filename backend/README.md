# 🌾 AgriGPT - Agricultural Expert Chatbot Backend

A multilingual AI-powered chatbot backend designed to assist Indian farmers with agriculture and farming-related queries. Built with Flask and powered by Google's Gemini 2.5-flash AI model, featuring dual authentication (Email/Password + Google Sign-In via Firebase).

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin_SDK-orange.svg)](https://firebase.google.com/)

## 🚀 Core Features

### 1. **Multilingual Support**
- Supports 13 Indian languages including:
  - English, Hindi, Odia, Bengali, Tamil, Telugu
  - Kannada, Malayalam, Marathi, Gujarati, Punjabi, Urdu, Assamese
- Automatic language detection with Odia-safe Unicode handling
- Responds in the same language as the user's query
- Language-specific fallback messages for non-agriculture queries

### 2. **AI-Powered Chat**
- Google Gemini 2.5-flash integration for intelligent responses
- Specialized agricultural knowledge base covering:
  - Crop cultivation practices
  - Fertilizers and soil types
  - Irrigation techniques
  - Pest and disease management
  - Weather impact on farming
  - Indian government agriculture schemes
  - Regional soil composition analysis
- Smart filtering: Only responds to agriculture-related queries
- Same-language enforcement (no language mixing)

### 3. **Voice Input Support**
- Speech-to-text transcription using Faster Whisper (completely offline and free)
- Whisper model: `tiny` (optimized for CPU with int8 compute)
- Supports multiple audio formats (WAV, MP3, etc.)
- Voice queries work seamlessly in 13+ Indian languages
- AI-based agriculture query validation for voice inputs
- Real-time audio processing and transcription
- **Authentication required** for voice features

### 4. **User Authentication & Authorization**
- JWT-based authentication system
- **Multiple authentication methods:**
  - Traditional email/password authentication
  - **Google Sign-In with Firebase** (OAuth 2.0)
  - Hybrid support: Google users can add password for email login
- Secure user signup and login
- Password encryption with bcrypt
- Firebase Admin SDK for token verification
- Token-based API protection
- Token verification with `@token_required` decorator
- Profile management:
  - Update name and email
  - Change password with current password verification
  - Upload/change/remove profile picture
- Automatic timestamp tracking:
  - Account creation time (`created_at`)
  - Last login time (`last_login`)
- **Auth provider tracking**: Monitors authentication methods per user (google, local)

### 5. **Trial System for Non-Authenticated Users**
- Free trial access for text chat without authentication
- Trial users identified as `user_id="trial_user"`
- Trial user conversations NOT saved to database
- Voice features restricted to authenticated users only
- Seamless upgrade path to full features with authentication

### 6. **Farming Report Generation**
- AI-powered comprehensive farming reports using Gemini AI
- Generates reports in 13 Indian languages
- Report includes 4 key sections:
  - **Sowing Advice**: Timing, depth, spacing, watering (4 points)
  - **Fertilizer Plan**: NPK quantities, organic manure (4 points)
  - **Weather Protection**: Sun, rain, cold, wind (4 points)
  - **Farming Calendar**: Week-by-week activities (4 points)
- Language-specific prompts for accurate native responses
- Flexible parsing with multiple section detection patterns
- Comprehensive debug logging for troubleshooting
- Fallback data for English, Hindi, Odia
- Reports saved to database for authenticated users

### 7. **Chat History Management**
- Complete conversation history stored in MongoDB
- Tracks input types (text vs voice)
- Tracks response types (AI vs Fallback)
- Language detection per conversation
- Timestamped messages for all interactions
- Separate collections for chats and farming reports

### 8. **Database Integration**
- MongoDB for data persistence
- Database: `agrigpt`
- Collections:
  - `users` - User accounts with authentication details, Firebase UID, and auth providers
  - `chat_history` - Complete conversation logs with metadata
  - `farming_reports` - Generated farming reports with crop/region/language data
- User schema includes:
  - `firebase_uid` - Firebase user identifier (for Google Sign-In users)
  - `auth_providers` - Array of authentication methods (["google"], ["local"], or ["google", "local"])
  - `password` - Hashed password (optional, only for local/hybrid auth)
- Timezone-aware timestamps using `datetime.now(timezone.utc)`
- Comprehensive error handling and logging

## 📋 API Endpoints

### Health Check
- `GET /` - Server health status

### Authentication (No token required)
- `POST /api/signup` - **Initiate signup** (sends OTP to email; does NOT create account yet)
  - Body: `{ "email": "user@example.com", "password": "password", "name": "Name" }`
  - Returns: `{ "message": "OTP sent", "otp_id": "..." }`

- `POST /api/verify-signup-otp` - **Complete signup** (verifies OTP and creates account)
  - Body: `{ "email": "user@example.com", "otp": "123456", "name": "Name", "password": "password" }`
  - Returns: `{ "user_id", "email", "name", "token" }`
  
- `POST /api/login` - **Initiate login** (verifies password then sends OTP)
  - Body: `{ "email": "user@example.com", "password": "password" }`
  - Returns: `{ "message": "OTP sent to your email", "otp_id": "..." }`

- `POST /api/verify-login-otp` - **Complete login** (verifies OTP and issues JWT)
  - Body: `{ "email": "user@example.com", "otp": "123456" }`
  - Returns: `{ "user_id", "email", "name", "token" }`

- `POST /api/auth/google` - **Google Sign-In with Firebase**
  - Headers: `Authorization: Bearer <firebase_id_token>`
  - Body: None (user info extracted from Firebase token)
  - Returns: `{ "user_id", "firebase_uid", "email", "name", "auth_providers", "token" }`
  - Creates new user or syncs existing user with MongoDB

### User Profile (Token required)
- `PUT /api/update-profile` - Update user profile
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "name": "New Name", "email": "new@example.com", "profilePicture": "base64_image" }`
  - Returns: `{ "success": true, "message", "name", "email", "profilePicture" }`
  
- `PUT /api/change-password` - Change password
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "currentPassword": "old", "newPassword": "new" }`
  - Returns: `{ "success": true, "message" }`

- `POST /api/create-password` - **Create password for Google Sign-In users**
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "password": "new_password" }`
  - Returns: `{ "success": true, "message", "auth_providers": ["google", "local"] }`
  - Allows Google users to add email/password login capability

- `DELETE /api/delete-account` - Delete user account
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ "success": true, "message" }`

### Chat (Trial & Authenticated)
- `POST /api/chat` - Send text message
  - Headers: `Authorization: Bearer <token>` (optional, defaults to trial user)
  - Body: `{ "message": "Your farming question", "chat_id": "<id>" (optional) }`
  - Returns: `{ "reply": "AI response", "chat_id": "...", "session_id": "..." }`

- `POST /api/voice` - Send voice input (authenticated users only)
  - Headers: `Authorization: Bearer <token>` (required)
  - Body: `multipart/form-data` with `audio` file
  - Returns: `{ "transcription": "...", "response": "...", "language": "..." }`

- `GET /api/chats` - Get all chat sessions (authenticated users only)
  - Headers: `Authorization: Bearer <token>` (required)
  - Returns: Array of chat session objects

- `GET /api/chats/<chat_id>` - Get full message history for a session
  - Headers: `Authorization: Bearer <token>` (required)
  - Returns: `{ "session": {...}, "messages": [...] }`

- `DELETE /api/chats/<chat_id>` - Delete a specific chat session
  - Headers: `Authorization: Bearer <token>` (required)
  - Returns: `{ "message": "Chat deleted successfully" }`

- `GET /api/history` - Retrieve flat chat history (authenticated users only)
  - Headers: `Authorization: Bearer <token>` (required)
  - Returns: Array of chat objects with timestamps

### Report Generation (Trial & Authenticated)
- `POST /api/report` - Generate farming report
  - Headers: `Authorization: Bearer <token>` (optional, defaults to trial user)
  - Body: `{ "cropName": "Rice", "region": "Odisha", "language": "English" }`
  - Returns: Report object with 4 sections (sowing, fertilizer, weather, calendar)

- `GET /api/reports` - Get all saved farming reports (authenticated users only)
  - Headers: `Authorization: Bearer <token>` (required)
  - Returns: Array of saved report objects with timestamps

### Feedback System (Trial & Authenticated)
- `POST /api/feedback` - Submit user feedback
  - Headers: `Authorization: Bearer <token>` (optional, includes user info if authenticated)
  - Body: `{ "name": "User Name", "email": "user@example.com", "message": "Feedback message" }`
  - Returns: `{ "success": true, "message": "Feedback submitted successfully" }`

### Admin Panel (Developer-only, Token required)
- `GET /api/check-developer` - Check if user is a developer
  - Headers: `Authorization: Bearer <token>` (required)
  - Returns: `{ "is_developer": true/false, "email": "dev@example.com" }`

- `GET /api/admin/feedbacks` - Get all feedbacks (with auto-delete of old resolved)
  - Headers: `Authorization: Bearer <token>` (required, must be developer)
  - Returns: Array of feedback objects with status, timestamps, user info
  - Auto-deletes resolved feedbacks older than 7 days

- `DELETE /api/admin/feedback/<feedback_id>` - Delete specific feedback
  - Headers: `Authorization: Bearer <token>` (required, must be developer)
  - Returns: `{ "success": true, "message": "Feedback deleted successfully" }`

- `PUT /api/admin/feedback/<feedback_id>/status` - Update feedback status
  - Headers: `Authorization: Bearer <token>` (required, must be developer)
  - Body: `{ "status": "resolved" }`
  - Returns: `{ "success": true, "message": "Feedback status updated" }`
  - Adds `resolved_at` timestamp when marked as resolved

- `GET /api/admin/statistics` - Get comprehensive statistics
  - Headers: `Authorization: Bearer <token>` (required, must be developer)
  - Returns: Statistics object with:
    - `users`: Total users, new users (last 7 days)
    - `chat_sessions`: Total sessions, recent activity
    - `reports`: Total and weekly report generation
    - `feature_usage`: Most used feature with count
    - `recent_activity`: Detailed 7-day activity breakdown

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8 or higher
- MongoDB installed and running
- Google Gemini API key

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd "Major Project/backend"
   ```

2. **Create Virtual Environment** (Recommended)
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/
   MONGO_DB=agrigpt
   
   # JWT Configuration
   JWT_SECRET_KEY=your-secret-key-here
   JWT_EXPIRY_HOURS=24
   
   # Firebase Configuration (for Google Sign-In)
   FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
   
   # Email Configuration (for OTP)
   EMAIL_ID=your_email@gmail.com
   EMAIL_APP_PASSWORD=your_app_password
   OTP_EXPIRY_MINUTES=10
   ```

5. **Firebase Setup** (Optional - for Google Sign-In)
   
   If you want to enable Google Sign-In:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication in Authentication > Sign-in method
   - Download service account key from Project Settings > Service Accounts
   - Save as `firebase-credentials.json` in the `backend/` directory
   - Add to `.gitignore` to keep credentials secure

6. **Start MongoDB**
   ```bash
   # Windows
   mongod
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

7. **Run the Application**
   ```bash
   python app.py
   ```

   Server will start at: `http://localhost:5000`

## 📦 Dependencies

### Core Framework
- **flask** 3.0+ - Web framework for API development
- **flask-cors** - Cross-origin resource sharing for frontend integration

### AI & Language Processing
- **google-generativeai** - Google Gemini 2.5-flash AI integration
- **langdetect** - Automatic language detection (13+ Indian languages)
- **faster-whisper** - Offline speech-to-text recognition (Whisper tiny model)

### Database & Storage
- **pymongo** - MongoDB driver for data persistence

### Authentication & Security
- **pyjwt** - JWT token generation and validation
- **bcrypt** - Password hashing and verification
- **firebase-admin** - Firebase Admin SDK for Google Sign-In token verification

### Audio Processing
- **pydub** - Audio file format conversion and processing
- **numpy** - Numerical computing for audio data
- **scipy** - Scientific computing utilities
- **sounddevice** - Audio input/output stream handling

### Utilities
- **python-dotenv** - Environment variable management from .env files
- **weasyprint** - PDF generation support for farming reports
- **gunicorn** - Production WSGI server for deployment
- **torch** - PyTorch deep learning framework (required by Faster Whisper)

## 📁 Project Structure

```
backend/
├── 📄 app.py                      # Main Flask application entry point with Firebase initialization
├── 📄 chat.py                     # Text chat handler with multilingual language detection
├── 📄 voice.py                    # Voice input handler with Faster Whisper STT (offline)
├── 📄 report.py                   # AI-powered farming report generation with Gemini AI
├── 📄 make_admin.py               # CLI utility to grant/revoke developer (admin panel) access
├── 📄 test_db.py                  # Database connection testing utility script
├── 📄 requirements.txt            # Python dependencies and versions
├── 📄 .env                        # Environment variables (create this - not in repo)
├── 📄 .gitignore                  # Git ignore patterns
├── 📄 firebase-credentials.json   # Firebase Admin SDK credentials (download from console)
├── 📄 README.md                   # Backend documentation (this file)
│
├── 📁 routes/                     # API route handlers
│   ├── 📄 __init__.py            # Routes package initializer
│   ├── 📄 auth_routes.py         # Authentication & profile endpoints (dual auth support)
│   ├── 📄 otp_routes.py          # OTP verification and email routes
│   ├── 📄 feedback_routes.py     # User feedback submission & admin feedback management
│   └── 📁 __pycache__/           # Python compiled bytecode cache
│
├── 📁 services/                   # Business logic layer
│   ├── 📄 __init__.py            # Services package initializer
│   ├── 📄 auth_service.py        # User authentication logic with Firebase sync & timestamps
│   ├── 📄 db_service.py          # MongoDB operations (users, developers, feedback, chat, reports)
│   ├── 📄 firebase_service.py    # Firebase Admin SDK integration & token verification
│   ├── 📄 llm_service.py         # Google Gemini AI integration & system prompts
│   ├── 📄 otp_service.py         # OTP generation, validation, and email sending
│   ├── 📄 pdf_service.py         # PDF generation utilities for farming reports
│   └── 📁 __pycache__/           # Python compiled bytecode cache
│
├── 📁 utils/                      # Utility functions and helpers
│   ├── 📄 __init__.py            # Utils package initializer
│   ├── 📄 config.py              # Environment configuration loader from .env
│   └── 📁 __pycache__/           # Python compiled bytecode cache
│
└── 📁 __pycache__/                # Root-level Python compiled bytecode cache
```

### Key Files Explained

**Core Application Files:**
- `app.py` - Flask server initialization, CORS setup, route registration, Firebase Admin SDK init
- `chat.py` - Handles text chat requests, language detection, AI validation, response generation
- `voice.py` - Processes voice audio files, Whisper transcription, language detection from audio
- `report.py` - Generates comprehensive farming reports with 4 sections in user's language
- `make_admin.py` - CLI utility to grant or revoke developer (admin panel) access for a user
- `test_db.py` - Test MongoDB connectivity, view collections, test CRUD operations

**Routes (API Endpoints):**
- `auth_routes.py` - `/api/signup`, `/api/login`, `/api/verify-login-otp`, `/api/verify-signup-otp`, `/api/auth/google`, `/api/link-google`, `/api/update-profile`, `/api/change-password`, `/api/create-password`, `/api/delete-account`
- `otp_routes.py` - `/api/send-otp`, `/api/verify-otp`, `/api/reset-password`
- `feedback_routes.py` - `/api/feedback`, `/api/check-developer`, `/api/admin/feedbacks`, `/api/admin/feedback/<id>`, `/api/admin/feedback/<id>/status`, `/api/admin/statistics`

**Services (Business Logic):**
- `auth_service.py` - User creation, login validation, password hashing (bcrypt), JWT generation, Google account linking, duplicate prevention
- `db_service.py` - MongoDB connection, CRUD operations for 6 collections (users, developers, feedback, chat, sessions, reports, otp_verifications)
- `firebase_service.py` - Firebase token verification, Google user sync
- `llm_service.py` - Gemini AI client, system prompts, response generation
- `otp_service.py` - Email sending via SMTP, OTP generation, validation, 10-minute expiry
- `pdf_service.py` - Report to PDF conversion (future feature)

**Configuration:**
- `requirements.txt` - Flask, PyMongo, Firebase Admin, Google GenAI, Faster Whisper, etc.
- `.env` - API keys (Gemini, Firebase), MongoDB URI, JWT secret, email credentials
- `config.py` - Loads environment variables, provides configuration constants

## 🔐 Authentication Flow

1. **Signup** (OTP-Verified):
   - Step 1: POST `/api/signup` with `{email, password, name}` → Sends OTP to email
   - Step 2: POST `/api/verify-signup-otp` with `{email, otp, name, password}` → Creates account & returns JWT

2. **Login** (OTP-Verified):
   - Step 1: POST `/api/login` with `{email, password}` → Verifies credentials, sends OTP to email
   - Step 2: POST `/api/verify-login-otp` with `{email, otp}` → Returns JWT token

3. **Google Sign-In**: POST `/api/auth/google` with Firebase ID token in `Authorization` header → Returns JWT

4. **Profile Management**:
   - Update profile: PUT `/api/update-profile`
   - Change password: PUT `/api/change-password` (requires current password)
   - Link Google account: POST `/api/link-google`

5. **Protected Endpoints**: Include token in header
   ```
   Authorization: Bearer <your-jwt-token>
   ```

6. **Trial Access**: Chat and report endpoints work without authentication
   - Text chat accessible without token (trial user)
   - Voice features require authentication
   - Trial users not saved to database

## 🧪 Testing with Postman

### 1. Initiate Signup (Sends OTP)
```json
POST http://localhost:5000/api/signup
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "secure123",
  "name": "John Farmer"
}
```

### 2. Complete Signup (Verify OTP)
```json
POST http://localhost:5000/api/verify-signup-otp
Content-Type: application/json

{
  "email": "farmer@example.com",
  "otp": "123456",
  "name": "John Farmer",
  "password": "secure123"
}
```

### 3. Initiate Login (Sends OTP)
```json
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "secure123"
}
```

### 4. Complete Login (Verify OTP)
```json
POST http://localhost:5000/api/verify-login-otp
Content-Type: application/json

{
  "email": "farmer@example.com",
  "otp": "123456"
}
```

### 5. Google Sign-In (Firebase)
```json
POST http://localhost:5000/api/auth/google
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```
Note: Get the Firebase ID token from frontend after Google authentication
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "secure123"
}
```

### 3. Google Sign-In (Firebase)
```json
POST http://localhost:5000/api/auth/google
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```
```
Note: Get the Firebase ID token from frontend after Google authentication

### 6. Create Password (Google Users)
```json
POST http://localhost:5000/api/create-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "password": "newsecure123"
}
```

### 7. Update Profile
```json
PUT http://localhost:5000/api/update-profile
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "newfarmer@example.com",
  "profilePicture": "data:image/png;base64,..."
}
```

### 6. Change Password
```json
PUT http://localhost:5000/api/change-password
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "currentPassword": "secure123",
  "newPassword": "newsecure456"
}
```

### 5. Chat (Agricultural Query)
```json
POST http://localhost:5000/api/chat
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "message": "धान की खेती के लिए कौन सी मिट्टी सबसे अच्छी है?"
}
```

### 6. Generate Farming Report
```json
POST http://localhost:5000/api/report
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "cropName": "Rice",
  "region": "Odisha",
  "language": "English"
}
```

### 14. Get Chat History (Flat)
```
GET http://localhost:5000/api/history
Authorization: Bearer <your-token>
```

### 15. Voice Input (requires audio file)
```
POST http://localhost:5000/api/voice
Authorization: Bearer <your-token>
Content-Type: multipart/form-data

audio: <audio-file.wav>
```

## 🌐 Language Support Examples

### Supported Languages (13)
- **English**: "What is the best fertilizer for rice?"
- **Hindi (हिन्दी)**: "धान के लिए सबसे अच्छा उर्वरक कौन सा है?"
- **Odia (ଓଡ଼ିଆ)**: "ଧାନ ପାଇଁ ସର୍ବୋତ୍ତମ ସାର କେଉଁଟି?"
- **Bengali (বাংলা)**: "ধানের জন্য সেরা সার কোনটি?"
- **Tamil (தமிழ்)**: "நெல் விவசாயத்திற்கு சிறந்த உரம் எது?"
- **Telugu (తెలుగు)**: "వరికి ఉత్తమ ఎరువు ఏది?"
- **Kannada (ಕನ್ನಡ)**: "ಅಕ್ಕಿಗೆ ಉತ್ತಮ ಗೊಬ್ಬರ ಯಾವುದು?"
- **Malayalam (മലയാളം)**: "നെല്ലിന് മികച്ച വളം എന്താണ്?"
- **Marathi (मराठी)**: "तांदळासाठी सर्वोत्तम खत कोणते?"
- **Gujarati (ગુજરાતી)**: "ચોખા માટે શ્રેષ્ઠ ખાતર કયું છે?"
- **Punjabi (ਪੰਜਾਬੀ)**: "ਚੌਲਾਂ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਖਾਦ ਕਿਹੜੀ ਹੈ?"
- **Urdu (اردو)**: "چاول کے لیے بہترین کھاد کون سی ہے؟"
- **Assamese (অসমীয়া)**: "ধানৰ বাবে সৰ্বশ্ৰেষ্ঠ সাৰ কি?"

## 📊 Database Schema

MongoDB Database: `agrigpt`

### 1. Users Collection (`users`)
```json
{
  "_id": ObjectId("..."),
  "email": "farmer@example.com",
  "password": "$2b$12$...",  // Hashed password (optional for Google-only users)
  "name": "John Farmer",
  "profilePicture": "data:image/png;base64,...",  // Base64 encoded image
  "firebase_uid": "firebase_user_id_here",  // Only for Google Sign-In users
  "auth_providers": ["google", "local"],  // Array of authentication methods
  "created_at": ISODate("2025-01-04T10:30:00.000Z"),
  "last_login": ISODate("2025-01-05T15:45:00.000Z")
}
```

### 2. Chat History Collection (`chat_history`)
```json
{
  "_id": ObjectId("..."),
  "user_id": "user_object_id",  // References users._id
  "input_type": "text",  // or "voice"
  "question": "धान की खेती कैसे करें?",
  "answer": "धान की खेती के लिए सबसे पहले...",
  "response_type": "ai",  // or "fallback"
  "language": "Hindi",  // Detected language name
  "timestamp": ISODate("2025-01-05T10:35:00.000Z")
}
```

### 3. Farming Reports Collection (`farming_reports`)
```json
{
  "_id": ObjectId("..."),
  "user_id": "user_object_id",  // References users._id
  "crop_name": "Rice",
  "region": "Odisha",
  "language": "English",
  "report_data": {
    "sowingAdvice": [
      { "emoji": "🌱", "text": "Best sowing time is June-July..." },
      { "emoji": "📏", "text": "Seed depth: 2-3 cm, spacing: 20x15 cm" },
      { "emoji": "🌾", "text": "Row spacing 20 cm for better growth" },
      { "emoji": "💧", "text": "Regular watering needed in first 2 weeks" }
    ],
    "fertilizerPlan": [
      { "emoji": "🌿", "text": "NPK 120:60:40 kg/hectare recommended" },
      { "emoji": "🔢", "text": "Split doses: 50% basal, 25% after 30 days..." },
      { "emoji": "🌱", "text": "Organic manure: 10 tons/hectare" },
      { "emoji": "💧", "text": "Foliar spray of micronutrients at flowering" }
    ],
    "weatherProtection": [
      { "emoji": "☀️", "text": "Protect from extreme heat with irrigation" },
      { "emoji": "🌧️", "text": "Ensure proper drainage during heavy rain" },
      { "emoji": "❄️", "text": "Cold protection during winter months" },
      { "emoji": "💨", "text": "Windbreaks recommended for exposed areas" }
    ],
    "farmingCalendar": [
      { "emoji": "📅", "text": "Week 1-2: Land preparation and sowing" },
      { "emoji": "🌱", "text": "Week 3-4: First weeding and thinning" },
      { "emoji": "💧", "text": "Week 5-8: Regular irrigation and fertilizer" },
      { "emoji": "🌾", "text": "Week 12-16: Harvesting when grain is mature" }
    ]
  },
  "timestamp": ISODate("2025-01-05T11:00:00.000Z")
}
```

### 4. Developers Collection (`developers`)
```json
{
  "_id": ObjectId("..."),
  "email": "developer@example.com",
  "user_id": ObjectId("...")  // References users._id
}
```

### 5. User Feedback Collection (`user_feedback`)
```json
{
  "_id": ObjectId("..."),
  "name": "Farmer Name",
  "email": "farmer@example.com",
  "message": "Feature suggestion or bug report...",
  "user_id": "user_object_id",  // Optional, References users._id if authenticated
  "status": "new",  // "new", "in-progress", or "resolved"
  "timestamp": ISODate("2025-01-07T10:30:00.000Z"),
  "resolved_at": ISODate("2025-01-08T14:20:00.000Z")  // Only when status is "resolved"
}
```

### 6. Chat Sessions Collection (`chat_sessions`)
```json
{
  "_id": ObjectId("..."),
  "user_id": ObjectId("..."),  // References users._id
  "started_at": ISODate("2025-01-07T09:00:00.000Z"),
  "ended_at": ISODate("2025-01-07T09:45:00.000Z")
}
```

### Key Schema Features
- **Timezone-aware timestamps**: All dates stored in UTC using `datetime.now(timezone.utc)`
- **Flexible authentication**: Users can have Google-only, password-only, or dual authentication
- **Optional fields**: `password` and `firebase_uid` are optional based on auth method
- **Array tracking**: `auth_providers` tracks all authentication methods per user
- **Base64 images**: Profile pictures stored as data URIs for easy retrieval
- **Language tracking**: Each chat and report tracks the language used
- **Response metadata**: Chat history includes input type and response type for analytics
- **Feedback tracking**: Status and resolution timestamps for feedback management
- **Developer access**: Separate collection for admin panel authentication

## 🎯 Core Functionality Details

### 1. Language Detection System
- **Odia Unicode Detection**: Special handling for Odia (`\u0B00-\u0B7F`)
- **LangDetect Library**: Automatic detection for other languages
- **Fallback**: Defaults to English if detection fails
- **Same-Language Response**: AI forced to respond in detected language

### 2. Agriculture Validation
- **AI-Based Filtering**: Uses Gemini AI to validate agriculture-related queries
- **Localized Fallbacks**: Rejection messages in user's language
- **Domain Restriction**: Only agriculture/farming topics allowed

### 3. Voice Processing Pipeline
1. Upload audio file (any format)
2. Convert to WAV using pydub
3. Transcribe with Faster Whisper (offline)
4. Detect language from audio metadata
5. Validate agriculture domain with AI
6. Generate response in same language
7. Save to database with voice metadata

### 4. Report Generation Process
1. Receive crop name, region, language
2. Generate language-specific prompt
3. Request Gemini AI for comprehensive report
4. Parse response into 4 sections (16 points total)
5. Apply fallback data if parsing fails
6. Save report to database (authenticated users only)
7. Return structured JSON report

### 5. Trial vs Authenticated Users
| Feature | Trial Users | Authenticated Users |
|---------|-------------|---------------------|
| Text Chat | ✅ Free (10 messages) | ✅ Unlimited |
| Voice Input | ❌ Restricted | ✅ Available |
| Chat History | ❌ Not saved | ✅ Saved to DB |
| Report Generation | ✅ Available | ✅ Available |
| Report Saving | ❌ Not saved | ✅ Saved to DB |
| Profile Management | ❌ N/A | ✅ Update profile/password |

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# In mongosh:
show dbs
use agrigpt
show collections
```

### Test Database Connectivity
```bash
python test_db.py
```
This script will:
- Test MongoDB connection
- Show document counts for all collections
- Display recent entries
- Test insert/delete operations

### Gemini API Issues
- Verify API key in `.env` file
- Check API quota at Google AI Studio
- Ensure internet connection for Gemini requests

### Language Detection Issues
- For Odia: Ensure Unicode text input
- For other languages: Check langdetect installation
- Default fallback is English

### Voice Processing Issues
- Ensure audio file is in supported format (WAV, MP3, etc.)
- Check Faster Whisper model installation
- Verify audio file size (< 10MB recommended)

## 🚀 Deployment Notes

### Production Configuration Checklist

1. **Security Settings**
   ```env
   # Generate strong random secret
   JWT_SECRET_KEY=your-very-long-random-secret-key-here
   
   # Set Flask to production mode
   FLASK_ENV=production
   ```

2. **Application Settings**
   ```python
   # In app.py, change:
   app.run(debug=False, host='0.0.0.0', port=5000)
   ```

3. **Database Configuration**
   - Use MongoDB Atlas (cloud) for production
   - Enable authentication and IP whitelisting
   - Regular automated backups
   - Connection pooling for better performance

4. **CORS Configuration**
   ```python
   # Restrict to your frontend domain(s)
   CORS(app, origins=["https://your-frontend-domain.com"])
   ```

5. **HTTPS/SSL**
   - Always use HTTPS in production
   - Required for secure token transmission
   - Firebase requires HTTPS for production domains

6. **Firebase Configuration**
   - Secure `firebase-credentials.json` file
   - Never commit to version control
   - Use environment variables or secure file storage
   - Restrict service account permissions

### Recommended Production Stack

**Web Server**
- **Gunicorn** or **uWSGI** for WSGI application server
  ```bash
  pip install gunicorn
  gunicorn -w 4 -b 0.0.0.0:5000 app:app
  ```

**Reverse Proxy**
- **Nginx** for load balancing and SSL termination
  ```nginx
  server {
      listen 443 ssl;
      server_name api.yourdomain.com;
      
      location / {
          proxy_pass http://localhost:5000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```

**Database**
- **MongoDB Atlas** (managed cloud service)
- Or self-hosted MongoDB with replica sets

**SSL/TLS**
- **Let's Encrypt** for free SSL certificates
- Auto-renewal with certbot

**Monitoring & Logging**
- Application logging with Python `logging` module
- Error tracking with Sentry or similar
- Performance monitoring with New Relic or Datadog
- MongoDB monitoring with Atlas built-in tools

### Deployment Platforms

**Recommended Options:**
1. **Render.com** - Easy deployment with free tier
2. **Railway.app** - Simple deployment with good free tier
3. **Heroku** - Traditional PaaS (paid after free tier expires)
4. **DigitalOcean App Platform** - Managed deployment
5. **AWS Elastic Beanstalk** - Scalable AWS deployment
6. **Google Cloud Run** - Serverless container deployment

### Environment-Specific Configuration

Create separate `.env` files:
- `.env.development` - Local development settings
- `.env.staging` - Staging environment
- `.env.production` - Production settings

Load based on environment:
```python
from dotenv import load_dotenv
import os

env = os.getenv('FLASK_ENV', 'development')
load_dotenv(f'.env.{env}')
```

## 📝 Development Tips

### Adding New Languages

1. **Update Language Mapping**
   ```python
   # In chat.py and report.py
   LANGUAGE_MAP = {
       "english": "English",
       "hindi": "Hindi",
       "odia": "Odia",
       # Add new language here
       "nepali": "Nepali",
   }
   ```

2. **Add Fallback Messages**
   ```python
   # In chat.py
   FALLBACK_MESSAGES = {
       "English": "I can only answer agriculture-related questions.",
       "Hindi": "मैं केवल कृषि संबंधी प्रश्नों का उत्तर दे सकता हूं।",
       # Add new language fallback
       "Nepali": "म कृषि सम्बन्धी प्रश्नहरूको मात्र जवाफ दिन सक्छु।",
   }
   ```

3. **Test Language Detection**
   - Create test cases with sample text
   - Verify Unicode handling (especially for Odia)
   - Test AI response in the new language

4. **Update Report Prompts**
   - Add language-specific system prompts in `report.py`
   - Test report generation with new language
   - Verify emoji and formatting work correctly

### Debugging Report Generation

**Enable Debug Logging**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Check Console Output**
- Section detection patterns
- AI response preview (first 200 characters)
- Parsing success/failure messages
- Fallback warnings

**Common Issues**
- **Missing sections**: AI response format might have changed
- **Empty points**: Check section detection regex patterns
- **Wrong language**: Verify language parameter is passed correctly
- **Fallback triggered**: Review AI response format

### Testing Authentication

**Generate Test JWT Token**
```python
import jwt
from datetime import datetime, timedelta, timezone

payload = {
    "user_id": "test_user_123",
    "email": "test@example.com",
    "exp": datetime.now(timezone.utc) + timedelta(hours=24)
}

secret = "your-secret-key"
token = jwt.encode(payload, secret, algorithm="HS256")
print(f"Test Token: {token}")
```

**Verify Token in Postman**
```
Authorization: Bearer <generated_token>
```

**Test Firebase Token Verification**
```python
from firebase_admin import auth

# This should be done in your service
decoded_token = auth.verify_id_token(firebase_id_token)
print(f"Firebase UID: {decoded_token['uid']}")
print(f"Email: {decoded_token.get('email')}")
```

### Performance Optimization Tips

1. **Database Indexing**
   ```javascript
   // In MongoDB shell
   db.users.createIndex({ "email": 1 }, { unique: true })
   db.users.createIndex({ "firebase_uid": 1 })
   db.chat_history.createIndex({ "user_id": 1, "timestamp": -1 })
   db.farming_reports.createIndex({ "user_id": 1, "timestamp": -1 })
   ```

2. **Connection Pooling**
   ```python
   # In db_service.py
   client = MongoClient(
       mongo_uri,
       maxPoolSize=50,
       minPoolSize=10,
       serverSelectionTimeoutMS=5000
   )
   ```

3. **Caching Strategies**
   - Cache frequently accessed data (e.g., user profiles)
   - Use Redis for session storage
   - Cache AI responses for common queries

4. **Async Processing**
   - Consider using Celery for background tasks
   - Offload report generation to background workers
   - Queue voice transcription for large files

### Code Quality Tools

**Linting & Formatting**
```bash
# Install tools
pip install black flake8 pylint

# Format code
black .

# Check code quality
flake8 .
pylint **/*.py
```

**Type Checking**
```bash
pip install mypy
mypy .
```

**Security Scanning**
```bash
pip install bandit
bandit -r .
```

## 📚 Additional Resources

### Official Documentation
- [Google Gemini API Documentation](https://ai.google.dev/docs) - Gemini AI integration guide
- [Flask Documentation](https://flask.palletsprojects.com/) - Web framework reference
- [MongoDB Python Driver (PyMongo)](https://pymongo.readthedocs.io/) - Database operations
- [Firebase Admin SDK for Python](https://firebase.google.com/docs/admin/setup) - Authentication setup
- [Faster Whisper GitHub](https://github.com/guillaumekln/faster-whisper) - Speech-to-text library
- [JWT.io](https://jwt.io/) - JWT token debugger and information
- [Python Dotenv](https://github.com/theskumar/python-dotenv) - Environment variables management

### Tutorials & Guides
- [Flask REST API Tutorial](https://flask.palletsprojects.com/en/latest/tutorial/)
- [MongoDB University](https://university.mongodb.com/) - Free MongoDB courses
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Building REST APIs with Flask](https://realpython.com/flask-connexion-rest-api/)

### Tools & Utilities
- [Postman](https://www.postman.com/) - API testing and development
- [MongoDB Compass](https://www.mongodb.com/products/compass) - MongoDB GUI
- [Google AI Studio](https://makersuite.google.com/app/apikey) - Get Gemini API keys
- [Firebase Console](https://console.firebase.google.com/) - Firebase project management

### Community & Support
- [Stack Overflow](https://stackoverflow.com/questions/tagged/flask) - Flask questions
- [MongoDB Community Forums](https://www.mongodb.com/community/forums/) - Database help
- [Firebase Community](https://firebase.google.com/community) - Firebase discussions
- [Python Discord](https://discord.gg/python) - Python programming help

### Video Resources
- [Flask Mega-Tutorial by Miguel Grinberg](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world)
- [MongoDB University YouTube Channel](https://www.youtube.com/c/MongoDBofficial)
- [Firebase YouTube Channel](https://www.youtube.com/firebase)

## 🤝 Contributing

We welcome contributions to make AgriGPT better for Indian farmers!

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/subhambiswalrony/AgriGPT-Chat-Report_System.git
   cd AgriGPT-Chat-Report_System/backend
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow PEP 8 style guidelines
   - Add proper error handling
   - Include docstrings for functions
   - Write meaningful commit messages

4. **Test Your Changes**
   ```bash
   # Test database connection
   python test_db.py
   
   # Run the application
   python app.py
   ```

5. **Submit Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Include screenshots/examples if applicable

### Contribution Guidelines

**Code Style**
- Follow PEP 8 Python style guide
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

**Testing**
- Test all new features thoroughly
- Ensure backward compatibility
- Test with multiple languages
- Verify database operations

**Documentation**
- Update README.md if needed
- Add docstrings to new functions
- Comment non-obvious code
- Update API documentation

**What to Contribute**
- 🐛 Bug fixes
- ✨ New features (language support, AI improvements)
- 📝 Documentation improvements
- 🎨 Code quality improvements
- 🔒 Security enhancements
- ⚡ Performance optimizations

## 👥 Team

**AgriGPT Development Team**
- **Subham Biswal** - Full Stack Developer
- **Vivekananda Champati** - Backend Developer
- **Tusar Kanta Das** - Frontend Developer
- **Swabhiman Mohanty** - AI/ML Integration

## 📄 License

This project is developed as part of a Major Project for educational purposes at **[Your College/University Name]**.

### Usage Terms
- ✅ Free to use for educational purposes
- ✅ Free for non-commercial agricultural support
- ❌ Commercial use requires permission
- ❌ Redistribution without attribution not allowed

### Third-Party Licenses
This project uses several open-source libraries. Please see their respective licenses:
- Flask (BSD-3-Clause License)
- MongoDB (SSPL)
- Firebase (Google Terms of Service)
- Google Gemini (Google Cloud Terms)

## 👥 Support & Contact

### Getting Help

**For Technical Issues:**
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [API Documentation](#-api-endpoints)
3. Test with `test_db.py` script
4. Verify environment variables in `.env`

**For Questions or Support:**
- 📧 **Email**: biswalsubhamrony@gmail.com
- 🐛 **GitHub Issues**: [Create an issue](https://github.com/subhambiswalrony/AgriGPT-Chat-Report_System/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/subhambiswalrony/AgriGPT-Chat-Report_System/discussions)

**Bug Reports:**
When reporting bugs, please include:
- Python version
- Operating system
- Error messages and stack traces
- Steps to reproduce
- Expected vs actual behavior

**Feature Requests:**
We welcome suggestions! Please include:
- Clear description of the feature
- Use case and benefits
- Any relevant examples or mockups

## 🙏 Acknowledgments

Special thanks to:
- **Google** for Gemini AI API and Firebase services
- **MongoDB** for excellent database technology
- **OpenAI** for Whisper speech recognition model
- **Indian Farmers** for inspiration and feedback
- **Open Source Community** for amazing tools and libraries

---

<div align="center">

**Built with ❤️ for Indian Farmers** 🌾

**Last Updated**: February 2026 | **Version**: 2.0

[⬆ Back to Top](#-agrigpt---agricultural-expert-chatbot-backend)

</div>