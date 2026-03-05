from pymongo import MongoClient
from datetime import datetime, timezone
from bson import ObjectId
from utils.config import MONGO_URI, MONGO_DB

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]

chat_collection = db.chat_history
chat_sessions_collection = db.chat_sessions
user_collection = db.users
report_collection = db.farming_reports
feedback_collection = db.user_feedback
developers_collection = db.developers
disease_predictions_collection = db.disease_predictions
weather_searches_collection = db.weather_searches


def save_chat(user_id, question, answer, response_type, language, input_type="text", chat_id=None):
    """Save individual chat message with chat_id reference"""
    try:
        result = chat_collection.insert_one({
            "chat_id": chat_id,
            "user_id": user_id,
            "role": "user",
            "content": question,
            "input_type": input_type,
            "response_type": response_type,
            "language": language,
            "timestamp": datetime.now(timezone.utc)
        })
        
        # Save assistant response
        chat_collection.insert_one({
            "chat_id": chat_id,
            "user_id": user_id,
            "role": "assistant",
            "content": answer,
            "input_type": input_type,
            "response_type": response_type,
            "language": language,
            "timestamp": datetime.now(timezone.utc)
        })
        
        print(f"✓ Chat saved for user: {user_id}, chat_id: {chat_id}, ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"✗ Error saving chat: {str(e)}")
        raise


def get_chat_history(user_id):
    """Legacy function for backward compatibility - returns all messages without chat_id grouping"""
    try:
        messages = list(
            chat_collection.find(
                {"user_id": user_id},
                {"_id": 0}
            ).sort("timestamp", -1)
        )
        
        # Convert to old format for backward compatibility
        result = []
        i = 0
        while i < len(messages):
            if i + 1 < len(messages) and messages[i]["role"] == "assistant" and messages[i+1]["role"] == "user":
                result.append({
                    "question": messages[i+1]["content"],
                    "answer": messages[i]["content"],
                    "response_type": messages[i]["response_type"],
                    "language": messages[i]["language"],
                    "timestamp": messages[i]["timestamp"]
                })
                i += 2
            else:
                i += 1
        
        return result
    except Exception as e:
        print(f"✗ Error getting chat history: {str(e)}")
        return []


def save_report(user_id, crop_name, region, report_data, language):
    """Save farming report to database"""
    try:
        result = report_collection.insert_one({
            "user_id": user_id,
            "crop_name": crop_name,
            "region": region,
            "report_data": report_data,
            "language": language,
            "timestamp": datetime.now(timezone.utc)
        })
        print(f"✓ Report saved for user: {user_id}, Crop: {crop_name}, Region: {region}, ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"✗ Error saving report: {str(e)}")
        raise


def get_user_reports(user_id):
    """Get all reports for a user"""
    docs = list(
        report_collection.find(
            {"user_id": user_id}
        ).sort("timestamp", -1)
    )
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs


def delete_report(report_id: str, user_id: str) -> bool:
    """Delete a single report by its id, scoped to the owning user"""
    from bson import ObjectId
    try:
        result = report_collection.delete_one(
            {"_id": ObjectId(report_id), "user_id": user_id}
        )
        return result.deleted_count == 1
    except Exception as e:
        print(f"✗ Error deleting report {report_id}: {str(e)}")
        return False


# ==================== CHAT SESSION MANAGEMENT ====================

def create_chat_session(user_id, title, language):
    """Create a new chat session"""
    try:
        result = chat_sessions_collection.insert_one({
            "user_id": user_id,
            "title": title,
            "language": language,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        print(f"✓ Chat session created for user: {user_id}, ID: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        print(f"✗ Error creating chat session: {str(e)}")
        raise


def get_chat_sessions(user_id):
    """Get all chat sessions for a user (sorted by updated_at DESC)"""
    try:
        sessions = list(
            chat_sessions_collection.find(
                {"user_id": user_id}
            ).sort("updated_at", -1)
        )
        
        # Convert ObjectId to string for JSON serialization
        for session in sessions:
            session["_id"] = str(session["_id"])
        
        return sessions
    except Exception as e:
        print(f"✗ Error getting chat sessions: {str(e)}")
        return []


def get_chat_by_id(chat_id):
    """Get full chat history for a specific chat session"""
    try:
        # Get session metadata
        session = chat_sessions_collection.find_one({"_id": ObjectId(chat_id)})
        if not session:
            return None
        
        # Get all messages for this chat
        messages = list(
            chat_collection.find(
                {"chat_id": chat_id}
            ).sort("timestamp", 1)
        )
        
        # Remove MongoDB _id from messages
        for msg in messages:
            msg.pop("_id", None)
        
        # Convert ObjectId to string
        session["_id"] = str(session["_id"])
        
        return {
            "session": session,
            "messages": messages
        }
    except Exception as e:
        print(f"✗ Error getting chat by ID: {str(e)}")
        return None


def get_recent_chat_messages(chat_id, limit=10):
    """
    Get recent N messages from a chat session for context.
    
    Args:
        chat_id: The chat session ID
        limit: Maximum number of messages to retrieve (default 10 = 5 pairs)
               Should be even number for balanced user/assistant pairs
    
    Returns:
        List of message dicts with role and message fields, ordered chronologically
    """
    try:
        # Fetch recent messages in reverse chronological order, then reverse
        messages = list(
            chat_collection.find(
                {"chat_id": chat_id}
            ).sort("timestamp", -1).limit(limit)
        )
        
        # Reverse to get chronological order (oldest to newest)
        messages.reverse()
        
        # Convert to simple format for LLM
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "role": msg["role"],
                "message": msg["content"]  # Database uses 'content' field
            })
        
        return formatted_messages
    except Exception as e:
        print(f"✗ Error getting recent chat messages: {str(e)}")
        return []


def update_chat_session(chat_id):
    """Update the updated_at timestamp of a chat session"""
    try:
        chat_sessions_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        print(f"✓ Chat session updated: {chat_id}")
    except Exception as e:
        print(f"✗ Error updating chat session: {str(e)}")
        raise


def delete_chat_session(chat_id, user_id):
    """Delete a chat session and all its messages"""
    try:
        # Delete all messages in this chat
        chat_collection.delete_many({
            "chat_id": chat_id,
            "user_id": user_id
        })
        
        # Delete the session
        result = chat_sessions_collection.delete_one({
            "_id": ObjectId(chat_id),
            "user_id": user_id
        })
        
        print(f"✓ Chat session deleted: {chat_id}")
        return result.deleted_count > 0
    except Exception as e:
        print(f"✗ Error deleting chat session: {str(e)}")
        raise


def generate_chat_title(message, language):
    """Generate a title from the first message (max 40 chars)"""
    # Remove extra whitespace
    title = " ".join(message.split())
    
    # Truncate to 40 characters
    if len(title) > 40:
        title = title[:37] + "..."
    
    return title if title else f"New Chat ({language})"


# ==================== FEEDBACK MANAGEMENT ====================

def save_feedback(name, email, message, user_id=None):
    """Save user feedback to database"""
    try:
        result = feedback_collection.insert_one({
            "name": name,
            "email": email,
            "message": message,
            "user_id": user_id,
            "status": "new",  # new, in-progress, resolved
            "timestamp": datetime.now(timezone.utc)
        })
        print(f"✓ Feedback saved from: {name}, ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"✗ Error saving feedback: {str(e)}")
        raise


def get_all_feedbacks():
    """Get all feedbacks sorted by timestamp (newest first)"""
    try:
        feedbacks = list(
            feedback_collection.find({}).sort("timestamp", -1)
        )
        
        # Convert ObjectId to string for JSON serialization
        for feedback in feedbacks:
            feedback["_id"] = str(feedback["_id"])
            # Convert timestamp to ISO format string
            if "timestamp" in feedback:
                feedback["timestamp"] = feedback["timestamp"].isoformat()
        
        return feedbacks
    except Exception as e:
        print(f"✗ Error getting feedbacks: {str(e)}")
        return []


# ==================== DISEASE PREDICTION TRACKING ====================

def save_disease_prediction(disease: str, confidence: float, user_id: str, image_name: str = None):
    """
    Persist a plant-disease prediction result.
    Only called for authenticated (registered) users — trial users are excluded.
    """
    try:
        doc = {
            "user_id":   user_id,
            "disease":   disease,
            "confidence": confidence,          # already in % (e.g. 92.5)
            "timestamp": datetime.now(timezone.utc),
        }
        if image_name:
            doc["image_name"] = image_name     # original filename uploaded
        result = disease_predictions_collection.insert_one(doc)
        print(f"✓ Disease prediction saved: {disease} ({confidence}%) | user: {user_id} | file: {image_name} | ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"✗ Error saving disease prediction: {str(e)}")


# ==================== WEATHER SEARCH TRACKING ====================

def save_weather_search(city: str, user_id: str = None, weather_output: dict = None):
    """
    Persist a weather + soil lookup, including the full API output.
    Called for both trial users (user_id=None) and registered users.
    """
    try:
        doc = {
            "input":        {"city": city},
            "user_id":      user_id,
            "user_type":    "registered" if user_id else "trial",
            "weather_output": weather_output or {},
            "timestamp":    datetime.now(timezone.utc),
        }
        result = weather_searches_collection.insert_one(doc)
        print(f"✓ Weather search saved: city='{city}' | user={user_id or 'trial'} | ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"✗ Error saving weather search: {str(e)}")

