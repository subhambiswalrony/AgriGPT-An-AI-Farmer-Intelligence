from flask import Blueprint, request, jsonify
from routes.auth_routes import verify_token, admin_required, token_required
from services.db_service import save_feedback, get_all_feedbacks, developers_collection, user_collection, chat_sessions_collection, report_collection

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.route("/api/feedback", methods=["POST"])
def submit_feedback():
    """Submit user feedback - accessible to all users"""
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email", "")
        message = data.get("message")

        # Validate required fields
        if not name or not message:
            return jsonify({"error": "Name and message are required"}), 400

        # Optional: Get user_id if authenticated
        user_id = None
        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token_str = token.split(" ")[1]
            user_data = verify_token(token_str)
            if user_data:
                user_id = user_data["user_id"]

        # Save feedback
        feedback_id = save_feedback(name, email, message, user_id)
        
        return jsonify({
            "success": True,
            "message": "Feedback submitted successfully",
            "feedback_id": str(feedback_id)
        }), 201

    except Exception as e:
        print(f"❌ Error in submit_feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/admin/feedbacks", methods=["GET"])
@admin_required
def get_feedbacks():
    """Get all feedbacks - admin only"""
    try:
        from datetime import datetime, timedelta
        
        # Auto-delete resolved feedbacks older than 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        from services.db_service import feedback_collection
        
        delete_result = feedback_collection.delete_many({
            "status": "resolved",
            "resolved_at": {"$lt": seven_days_ago}
        })
        
        if delete_result.deleted_count > 0:
            print(f"🗑️ Auto-deleted {delete_result.deleted_count} old resolved feedbacks")
        
        feedbacks = get_all_feedbacks()
        return jsonify({
            "success": True,
            "feedbacks": feedbacks,
            "count": len(feedbacks)
        }), 200

    except Exception as e:
        print(f"❌ Error in get_feedbacks: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/check-developer", methods=["GET"])
@token_required
def check_developer():
    """Check if current user is a developer"""
    try:
        # Get user_id from the token payload set by token_required decorator
        user_id = request.current_user.get("user_id")
        print(f"🔍 Checking developer access for user_id: {user_id}")
        
        # Check if user is in developers collection
        developer = developers_collection.find_one({"user_id": user_id})
        print(f"✅ Developer found: {developer is not None}")
        
        if developer:
            print(f"👨‍💻 Developer info: {developer.get('email')} - {developer.get('name')}")
        
        return jsonify({
            "is_developer": developer is not None,
            "developer_info": {
                "email": developer.get("email"),
                "name": developer.get("name"),
                "role": developer.get("role")
            } if developer else None
        }), 200

    except Exception as e:
        print(f"❌ Error in check_developer: {str(e)}")
        return jsonify({"error": str(e), "is_developer": False}), 500
        print(f"❌ Error in check_developer: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/admin/statistics", methods=["GET"])
@admin_required
def get_admin_statistics():
    """Get comprehensive statistics for admin dashboard"""
    try:
        from datetime import datetime, timedelta, timezone

        # Accept ?days= query param (7 / 14 / 30 / 365), default 7
        try:
            days_range = int(request.args.get("days", 7))
            if days_range not in (7, 14, 30, 365):
                days_range = 7
        except (ValueError, TypeError):
            days_range = 7

        # Total counts
        total_users       = user_collection.count_documents({})
        total_developers  = developers_collection.count_documents({})
        total_chats       = chat_sessions_collection.count_documents({})
        total_reports     = report_collection.count_documents({})
        total_feedbacks   = len(get_all_feedbacks())

        # Most used feature
        feature_counts = {"chat": total_chats, "report": total_reports, "feedback": total_feedbacks}
        most_used = max(feature_counts.items(), key=lambda x: x[1]) if feature_counts else ("None", 0)

        # ── Timezone-safe window ─────────────────────────────────────────────
        now_naive  = datetime.utcnow()
        now_aware  = datetime.now(timezone.utc)
        window_ago_naive = now_naive - timedelta(days=days_range)
        window_ago_aware = now_aware - timedelta(days=days_range)

        recent_users   = user_collection.count_documents({"created_at": {"$gte": window_ago_naive}})
        recent_chats   = chat_sessions_collection.count_documents({"created_at": {"$gte": window_ago_aware}})
        recent_reports = report_collection.count_documents({"timestamp": {"$gte": window_ago_aware}})

        # ── Per-day breakdown (oldest → newest) ──────────────────────────────
        # For days=365 return 12 monthly buckets instead of 365 daily ones
        today_naive = now_naive.replace(hour=0, minute=0, second=0, microsecond=0)
        today_aware = now_aware.replace(hour=0, minute=0, second=0, microsecond=0)
        daily_activity = []

        if days_range == 365:
            import calendar as _cal
            for months_back in range(11, -1, -1):
                year  = now_naive.year
                month = now_naive.month - months_back
                while month <= 0:
                    month += 12
                    year  -= 1
                m_start_naive = datetime(year, month, 1)
                last_day = _cal.monthrange(year, month)[1]
                m_end_naive   = datetime(year, month, last_day, 23, 59, 59)
                m_start_aware = m_start_naive.replace(tzinfo=timezone.utc)
                m_end_aware   = m_end_naive.replace(tzinfo=timezone.utc)

                m_users   = user_collection.count_documents({"created_at": {"$gte": m_start_naive, "$lte": m_end_naive}})
                m_chats   = chat_sessions_collection.count_documents({"created_at": {"$gte": m_start_aware, "$lte": m_end_aware}})
                m_reports = report_collection.count_documents({"timestamp": {"$gte": m_start_aware, "$lte": m_end_aware}})

                daily_activity.append({
                    "month":         m_start_naive.strftime("%b %Y"),
                    "date":          m_start_naive.strftime("%b %Y"),
                    "new_users":     m_users,
                    "chat_sessions": m_chats,
                    "reports":       m_reports,
                })
        else:
            for days_back in range(days_range - 1, -1, -1):
                d_start_naive = today_naive - timedelta(days=days_back)
                d_end_naive   = d_start_naive + timedelta(days=1)
                d_start_aware = today_aware  - timedelta(days=days_back)
                d_end_aware   = d_start_aware + timedelta(days=1)

                d_users   = user_collection.count_documents({"created_at": {"$gte": d_start_naive, "$lt": d_end_naive}})
                d_chats   = chat_sessions_collection.count_documents({"created_at": {"$gte": d_start_aware, "$lt": d_end_aware}})
                d_reports = report_collection.count_documents({"timestamp":  {"$gte": d_start_aware, "$lt": d_end_aware}})

                daily_activity.append({
                    "date":          d_start_naive.strftime("%b %d"),
                    "new_users":     d_users,
                    "chat_sessions": d_chats,
                    "reports":       d_reports,
                })

        return jsonify({
            "success": True,
            "statistics": {
                "users": {
                    "total":          total_users,
                    "developers":     total_developers,
                    "regular_users":  total_users - total_developers,
                    "recent_signups": recent_users,
                },
                "feature_usage": {
                    "chat_sessions":      total_chats,
                    "reports_generated":  total_reports,
                    "feedbacks_received": total_feedbacks,
                    "most_used_feature":  {"name": most_used[0], "count": most_used[1]},
                    # "this week" counts for bar-chart toggle
                    "chat_sessions_period":    recent_chats,
                    "reports_period":          recent_reports,
                    "feedbacks_period":        0,   # not date-filtered yet
                    "users_period":            recent_users,
                },
                "recent_activity": {
                    "last_7_days": {
                        "new_users":     recent_users,
                        "chat_sessions": recent_chats,
                        "reports":       recent_reports,
                    },
                    "daily": daily_activity,
                },
                "days_range": days_range,
            },
        }), 200

    except Exception as e:
        print(f"❌ Error in get_admin_statistics: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/admin/feedback/<feedback_id>", methods=["DELETE"])
@admin_required
def delete_feedback(feedback_id):
    """Delete a specific feedback - admin only"""
    try:
        from services.db_service import feedback_collection
        from bson import ObjectId
        
        result = feedback_collection.delete_one({"_id": ObjectId(feedback_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Feedback not found"}), 404
        
        print(f"✅ Feedback deleted: {feedback_id}")
        return jsonify({
            "success": True,
            "message": "Feedback deleted successfully"
        }), 200

    except Exception as e:
        print(f"❌ Error in delete_feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/api/admin/feedback/<feedback_id>/status", methods=["PUT"])
@admin_required
def update_feedback_status(feedback_id):
    """Update feedback status (mark as resolved) - admin only"""
    try:
        from services.db_service import feedback_collection
        from bson import ObjectId
        from datetime import datetime
        
        data = request.json
        new_status = data.get("status", "resolved")
        
        # Validate status
        valid_statuses = ["new", "in-progress", "resolved"]
        if new_status not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {valid_statuses}"}), 400
        
        # Prepare update data
        update_data = {
            "status": new_status,
            "updated_at": datetime.utcnow()
        }
        
        # Add resolved_at timestamp when marking as resolved
        if new_status == "resolved":
            update_data["resolved_at"] = datetime.utcnow()
        
        result = feedback_collection.update_one(
            {"_id": ObjectId(feedback_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Feedback not found"}), 404
        
        print(f"✅ Feedback status updated: {feedback_id} -> {new_status}")
        return jsonify({
            "success": True,
            "message": "Feedback status updated successfully",
            "status": new_status
        }), 200

    except Exception as e:
        print(f"❌ Error in update_feedback_status: {str(e)}")
        return jsonify({"error": str(e)}), 500
