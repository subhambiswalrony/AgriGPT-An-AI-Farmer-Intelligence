from flask import Flask, request, jsonify
from flask_cors import CORS

# Core feature handlers
from chat.chat_typing import handle_chat
from chat.voice import handle_voice
from report_generator.report import generate_farming_report

# Node.js weather server lifecycle
from node_server import start_weather_server

# Services
from services.db_service import (
    get_chat_history, 
    get_chat_sessions, 
    get_chat_by_id,
    delete_chat_session
)
from services.firebase_service import initialize_firebase
from services.email_service import mail

# Auth
from routes.auth_routes import auth_bp, token_required, verify_token
from routes.otp_routes import otp_bp
from routes.feedback_routes import feedback_bp
from routes.analytics_routes import analytics_bp
from routes.weather_routes import weather_bp

# Initialize Firebase Admin SDK
initialize_firebase()

# Start the Node.js weather & soil analysis server
start_weather_server()

app = Flask(__name__)
CORS(app, origins="*")

# -------------------- FLASK-MAIL CONFIG --------------------
import os
app.config["MAIL_SERVER"]   = "smtp.gmail.com"
app.config["MAIL_PORT"]     = 587
app.config["MAIL_USE_TLS"]  = True
app.config["MAIL_USERNAME"] = os.getenv("EMAIL_ID")
app.config["MAIL_PASSWORD"] = os.getenv("EMAIL_APP_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = ("AgriGPT", os.getenv("EMAIL_ID"))
mail.init_app(app)

# Register authentication blueprint
app.register_blueprint(auth_bp)
app.register_blueprint(otp_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(weather_bp)   # weather & soil proxy → Node server

# -------------------- HEALTH CHECK --------------------
@app.route("/")
def health():
    return {"status": "AgriGPT Backend Running 🌾"}

# -------------------- CHAT API --------------------
@app.route("/api/chat", methods=["POST"])
def chat_api():
    try:
        token = request.headers.get("Authorization")
        user_id = "trial_user"  # default for unauthenticated users

        if token and token.startswith("Bearer "):
            token_str = token.split(" ")[1]
            user_data = verify_token(token_str)
            if user_data:
                user_id = user_data["user_id"]

        data = request.json
        message = data.get("message")
        chat_id = data.get("chat_id")  # Optional: for continuing existing chat

        if not message:
            return jsonify({"error": "Message is required"}), 400

        result = handle_chat(user_id, message, chat_id)
        return jsonify(result)

    except Exception as e:
        print(f"❌ Error in chat_api: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# -------------------- CHAT SESSIONS API --------------------
@app.route("/api/chats", methods=["GET"])
@token_required
def get_chats():
    """Get all chat sessions for authenticated user"""
    try:
        user_id = request.current_user["user_id"]
        sessions = get_chat_sessions(user_id)
        return jsonify(sessions)

    except Exception as e:
        print(f"❌ Error in get_chats: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/chats/<chat_id>", methods=["GET"])
@token_required
def get_chat(chat_id):
    """Get full chat history for a specific chat session"""
    try:
        user_id = request.current_user["user_id"]
        chat_data = get_chat_by_id(chat_id)
        
        if not chat_data:
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify user owns this chat
        if chat_data["session"]["user_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        return jsonify(chat_data)

    except Exception as e:
        print(f"❌ Error in get_chat: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/chats/<chat_id>", methods=["DELETE"])
@token_required
def delete_chat(chat_id):
    """Delete a chat session"""
    try:
        user_id = request.current_user["user_id"]
        success = delete_chat_session(chat_id, user_id)
        
        if success:
            return jsonify({"message": "Chat deleted successfully"})
        else:
            return jsonify({"error": "Chat not found"}), 404

    except Exception as e:
        print(f"❌ Error in delete_chat: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# -------------------- VOICE API --------------------
@app.route("/api/voice", methods=["POST"])
@token_required
def voice_api():
    try:
        user_id = request.current_user["user_id"]
        audio   = request.files.get("audio")
        chat_id = request.form.get("chat_id")  # optional: continue existing session

        if not audio:
            return jsonify({"error": "Audio file is required"}), 400

        result = handle_voice(audio, user_id, chat_id=chat_id or None)
        return jsonify(result)

    except Exception as e:
        print(f"❌ Error in voice_api: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# -------------------- CHAT HISTORY --------------------
@app.route("/api/history", methods=["GET"])
@token_required
def history():
    try:
        user_id = request.current_user["user_id"]
        history = get_chat_history(user_id)
        return jsonify(history)

    except Exception as e:
        print(f"❌ Error in history_api: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# -------------------- REPORT GENERATION --------------------
@app.route("/api/report", methods=["POST"])
def report_api():
    try:
        token = request.headers.get("Authorization")
        user_id = "trial_user"  # default access

        if token and token.startswith("Bearer "):
            token_str = token.split(" ")[1]
            user_data = verify_token(token_str)
            if user_data:
                user_id = user_data["user_id"]

        data = request.json

        # Only 5 user-provided inputs – env & crop data are auto-fetched in report.py
        crop_name    = data.get("cropName", "").strip()
        district     = data.get("district", "").strip()
        state        = data.get("state", "").strip()
        farming_type = data.get("farmingType", "General").strip()
        language     = data.get("language", "English").strip()

        if not crop_name or not district or not state:
            return jsonify({"error": "Crop name, district, and state are required"}), 400

        report = generate_farming_report(
            user_id=user_id,
            crop_name=crop_name,
            district=district,
            state=state,
            farming_type=farming_type,
            language=language
        )

        if "error" in report:
            return jsonify(report), 500

        return jsonify(report)

    except Exception as e:
        print(f"❌ Error in report_api: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# -------------------- REPORT HISTORY --------------------
@app.route("/api/reports", methods=["GET"])
@token_required
def report_history():
    try:
        user_id = request.current_user["user_id"]
        from services.db_service import get_user_reports
        reports = get_user_reports(user_id)
        return jsonify(reports)

    except Exception as e:
        print(f"❌ Error in report_history: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# -------------------- DELETE SINGLE REPORT --------------------
@app.route("/api/reports/<report_id>", methods=["DELETE"])
@token_required
def delete_report_api(report_id):
    try:
        user_id = request.current_user["user_id"]
        from services.db_service import delete_report
        deleted = delete_report(report_id, user_id)
        if deleted:
            return jsonify({"message": "Report deleted"}), 200
        return jsonify({"error": "Report not found or not authorised"}), 404
    except Exception as e:
        print(f"❌ Error in delete_report_api: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# -------------------- DISEASE PREDICTION PROXY --------------------
@app.route("/api/predict", methods=["POST"])
def predict_proxy():
    import requests as req
    import io
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file       = request.files['image']
        file_bytes = file.read()                     # read fully before stream closes
        filename   = file.filename or 'image.jpg'
        mimetype   = file.mimetype or 'image/jpeg'

        # Omit explicit mimetype — let requests auto-set Content-Type so the
        # multipart boundary is constructed identically to how Postman does it
        files = {'image': (filename, io.BytesIO(file_bytes))}

        response = req.post(
            'https://agri-gpt-disease-prediction.onrender.com/predict',
            files=files,
            timeout=60
        )

        print(f"🌿 Predict proxy status: {response.status_code}")
        print(f"🌿 Predict proxy body:   {response.text[:300]}")

        if not response.ok:
            return jsonify({"error": f"Prediction service error: {response.text}"}), response.status_code

        raw = response.json()

        # Normalise: the prediction service returns {"top": "<label>", "confidence": 0.92}
        # Map to the shape the frontend expects: {"disease": "<label>", "confidence": 92}
        disease    = raw.get('top') or raw.get('disease') or 'Unknown'
        confidence = raw.get('confidence', 0)

        # Persist the prediction — registered users only (trial users are excluded)
        try:
            from services.db_service import save_disease_prediction
            token = request.headers.get("Authorization", "")
            uid = None
            if token.startswith("Bearer "):
                payload = verify_token(token.split(" ")[1])
                if payload:
                    uid = payload.get("user_id")
            if uid:   # only save for authenticated / registered users
                save_disease_prediction(
                    disease=disease.replace("_", " "),
                    confidence=round(confidence * 100, 1),
                    user_id=uid,
                    image_name=filename,
                )
        except Exception:
            pass  # never block a prediction result over analytics

        return jsonify({
            "disease":    disease,
            "confidence": round(confidence * 100, 1)   # 0.9252 → 92.5
        }), 200

    except req.exceptions.Timeout:
        return jsonify({"error": "Prediction service timed out. Please try again."}), 504
    except req.exceptions.ConnectionError:
        return jsonify({"error": "Could not reach prediction service."}), 502
    except Exception as e:
        print(f"❌ Error in predict_proxy: {str(e)}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# -------------------- RUN SERVER --------------------
if __name__ == "__main__":
    # app.run(
    #     debug=True,
    #     use_reloader=False
    # )
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
