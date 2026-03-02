from flask import Blueprint, request, jsonify
from routes.auth_routes import verify_token, admin_required
from services.db_service import save_feedback, get_all_feedbacks

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.route("/api/feedback", methods=["POST"])
def submit_feedback():
    """Submit user feedback â€” accessible to all users (auth optional)."""
    try:
        data    = request.json
        name    = data.get("name")
        email   = data.get("email", "")
        message = data.get("message")

        if not name or not message:
            return jsonify({"error": "Name and message are required"}), 400

        # Attach user_id if the request carries a valid JWT
        user_id = None
        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            user_data = verify_token(token.split(" ")[1])
            if user_data:
                user_id = user_data["user_id"]

        feedback_id = save_feedback(name, email, message, user_id)
        return jsonify({
            "success":     True,
            "message":     "Feedback submitted successfully",
            "feedback_id": str(feedback_id),
        }), 201

    except Exception as e:
        print(f"âŒ Error in submit_feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/admin/feedbacks", methods=["GET"])
@admin_required
def get_feedbacks():
    """Return all feedbacks; auto-delete resolved entries older than 7 days."""
    try:
        from datetime import datetime, timedelta
        from services.db_service import feedback_collection

        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        deleted = feedback_collection.delete_many({
            "status":      "resolved",
            "resolved_at": {"$lt": seven_days_ago},
        })
        if deleted.deleted_count:
            print(f"ðŸ—‘ï¸ Auto-deleted {deleted.deleted_count} old resolved feedbacks")

        feedbacks = get_all_feedbacks()
        return jsonify({
            "success":   True,
            "feedbacks": feedbacks,
            "count":     len(feedbacks),
        }), 200

    except Exception as e:
        print(f"âŒ Error in get_feedbacks: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/admin/feedback/<feedback_id>", methods=["DELETE"])
@admin_required
def delete_feedback(feedback_id):
    """Delete a specific feedback entry."""
    try:
        from services.db_service import feedback_collection
        from bson import ObjectId

        result = feedback_collection.delete_one({"_id": ObjectId(feedback_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Feedback not found"}), 404

        print(f"âœ… Feedback deleted: {feedback_id}")
        return jsonify({"success": True, "message": "Feedback deleted successfully"}), 200

    except Exception as e:
        print(f"âŒ Error in delete_feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/admin/feedback/<feedback_id>/status", methods=["PUT"])
@admin_required
def update_feedback_status(feedback_id):
    """Update feedback status (new â†’ in-progress â†’ resolved)."""
    try:
        from services.db_service import feedback_collection
        from bson import ObjectId
        from datetime import datetime

        new_status = (request.json or {}).get("status", "resolved")
        valid_statuses = ["new", "in-progress", "resolved"]
        if new_status not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {valid_statuses}"}), 400

        update_data = {"status": new_status, "updated_at": datetime.utcnow()}
        if new_status == "resolved":
            update_data["resolved_at"] = datetime.utcnow()

        result = feedback_collection.update_one(
            {"_id": ObjectId(feedback_id)},
            {"$set": update_data},
        )
        if result.matched_count == 0:
            return jsonify({"error": "Feedback not found"}), 404

        print(f"âœ… Feedback status updated: {feedback_id} -> {new_status}")
        return jsonify({
            "success": True,
            "message": "Feedback status updated successfully",
            "status":  new_status,
        }), 200

    except Exception as e:
        print(f"âŒ Error in update_feedback_status: {str(e)}")
        return jsonify({"error": str(e)}), 500

