from flask import Blueprint, request, jsonify
from routes.auth_routes import verify_token, admin_required, token_required
from services.db_service import save_feedback, get_all_feedbacks, developers_collection, user_collection, chat_sessions_collection, report_collection, chat_collection

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
    """Get comprehensive insight-driven statistics for admin dashboard"""
    try:
        from datetime import datetime, timedelta, timezone
        from services.db_service import feedback_collection as fb_col, chat_collection

        # Accept ?days= query param (7 / 14 / 30 / 365), default 7
        try:
            days_range = int(request.args.get("days", 7))
            if days_range not in (7, 14, 30, 365):
                days_range = 7
        except (ValueError, TypeError):
            days_range = 7

        # ── Timezone helpers ─────────────────────────────────────────────────
        now_naive  = datetime.utcnow()
        now_aware  = datetime.now(timezone.utc)
        today_naive = now_naive.replace(hour=0, minute=0, second=0, microsecond=0)
        today_aware = now_aware.replace(hour=0, minute=0, second=0, microsecond=0)

        # ── Total counts ─────────────────────────────────────────────────────
        total_users      = user_collection.count_documents({})
        total_developers = developers_collection.count_documents({})
        total_chats      = chat_sessions_collection.count_documents({})
        total_reports    = report_collection.count_documents({})
        total_feedbacks  = fb_col.count_documents({})

        # ── Week-over-week comparison windows ────────────────────────────────
        w1_start_naive = now_naive - timedelta(days=7)
        w2_start_naive = now_naive - timedelta(days=14)
        w1_start_aware = now_aware - timedelta(days=7)
        w2_start_aware = now_aware - timedelta(days=14)

        users_this_week  = user_collection.count_documents({"created_at": {"$gte": w1_start_naive}})
        users_prev_week  = user_collection.count_documents({"created_at": {"$gte": w2_start_naive, "$lt": w1_start_naive}})
        chats_this_week  = chat_sessions_collection.count_documents({"created_at": {"$gte": w1_start_aware}})
        chats_prev_week  = chat_sessions_collection.count_documents({"created_at": {"$gte": w2_start_aware, "$lt": w1_start_aware}})
        reports_this_week = report_collection.count_documents({"timestamp": {"$gte": w1_start_aware}})
        reports_prev_week = report_collection.count_documents({"timestamp": {"$gte": w2_start_aware, "$lt": w1_start_aware}})

        # Period window (used for bar chart toggle and activity trend)
        window_ago_naive = now_naive - timedelta(days=days_range)
        window_ago_aware = now_aware - timedelta(days=days_range)
        recent_users   = user_collection.count_documents({"created_at": {"$gte": window_ago_naive}})
        recent_chats   = chat_sessions_collection.count_documents({"created_at": {"$gte": window_ago_aware}})
        recent_reports = report_collection.count_documents({"timestamp": {"$gte": window_ago_aware}})

        def pct_change(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 1)

        user_growth_pct   = pct_change(users_this_week, users_prev_week)
        chat_growth_pct   = pct_change(chats_this_week, chats_prev_week)
        report_growth_pct = pct_change(reports_this_week, reports_prev_week)

        # ── Most used feature ────────────────────────────────────────────────
        feature_counts = {"chat": total_chats, "report": total_reports, "feedback": total_feedbacks}
        most_used = max(feature_counts.items(), key=lambda x: x[1]) if feature_counts else ("None", 0)

        # ── Engagement metrics ───────────────────────────────────────────────
        # Voice chats - check individual message input_type
        voice_chats = chat_collection.count_documents({"input_type": "voice"})
        total_messages = chat_collection.count_documents({"role": "user"})
        voice_pct = round((voice_chats / max(total_messages, 1)) * 100, 1)
        avg_chats_per_user = round(total_chats / max(total_users, 1), 1)
        engagement_score = round((chats_this_week / max(total_users, 1)) * 100, 1)

        # Language distribution from chat messages
        lang_pipeline = [
            {"$match": {"role": "user", "language": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$language", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        lang_raw = list(chat_collection.aggregate(lang_pipeline))
        language_dist = [{"language": str(l.get("_id") or "English").capitalize(), "count": l["count"]} for l in lang_raw]
        if not language_dist:
            language_dist = [{"language": "English", "count": total_messages}]

        # ── Agriculture insights: crop & disease keyword scan ─────────────────
        CROPS = ["rice", "wheat", "maize", "corn", "cotton", "sugarcane",
                 "potato", "tomato", "onion", "soybean", "mango", "banana",
                 "groundnut", "paddy", "mustard", "sunflower", "barley"]
        DISEASES = ["blight", "rust", "wilt", "rot", "mildew", "mosaic",
                    "spot", "canker", "smut", "scab", "yellowing", "fungal",
                    "bacterial", "blast", "borer", "aphid", "leaf curl"]

        crop_counts    = {}
        disease_counts = {}

        # Sample up to 500 most recent user messages for performance
        recent_msgs = chat_collection.find(
            {"role": "user"},
            {"content": 1}
        ).sort("_id", -1).limit(500)

        for msg in recent_msgs:
            text = (msg.get("content") or "").lower()
            for crop in CROPS:
                if crop in text:
                    crop_counts[crop] = crop_counts.get(crop, 0) + 1
            for disease in DISEASES:
                if disease in text:
                    disease_counts[disease] = disease_counts.get(disease, 0) + 1

        top_crops    = [{"name": k.capitalize(), "count": v}
                        for k, v in sorted(crop_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
        top_diseases = [{"name": k.capitalize(), "count": v}
                        for k, v in sorted(disease_counts.items(), key=lambda x: x[1], reverse=True)[:4]]

        # Maxes for bar scaling
        crop_max    = top_crops[0]["count"]    if top_crops    else 1
        disease_max = top_diseases[0]["count"] if top_diseases else 1

        # ── Feedback analytics ───────────────────────────────────────────────
        resolved_fb  = fb_col.count_documents({"status": "resolved"})
        fb_resolution_rate = round((resolved_fb / max(total_feedbacks, 1)) * 100, 1)

        # ── Platform health composite score (0–100) ───────────────────────────
        # User Growth component (30%): +15 base, ±15 for week-over-week growth
        growth_component      = min(30.0, max(5.0, 15.0 + (user_growth_pct / 100.0) * 15.0))
        # Engagement (25%): active chats vs user base this week (1 chat/user/week = full score)
        engagement_component  = min(25.0, (chats_this_week / max(total_users, 1)) * 25.0)
        # AI success (20%): avg lifetime chats per user — 5+ sessions/user = full score
        # (was: inverse-voice which wrongly penalised voice feature usage)
        ai_success_component  = min(20.0, (avg_chats_per_user / 5.0) * 20.0)
        # Feedback resolution (15%): neutral 10pts when no feedback exists yet,
        # otherwise scales with resolution rate (was: 0pts for 0 feedbacks)
        feedback_component    = (10.0 if total_feedbacks == 0
                                 else min(15.0, fb_resolution_rate / 100.0 * 15.0))
        # Report activity (10%): compares this-week reports vs 10% of user base as target
        # (was: vs all-time total which made old platforms always score near 0)
        expected_weekly_reports = max(total_users // 10, 1)
        report_component      = min(10.0, (reports_this_week / expected_weekly_reports) * 10.0)

        health_score = round(
            growth_component + engagement_component +
            ai_success_component + feedback_component + report_component
        )
        health_score = max(0, min(100, health_score))

        health_color = (
            "green"  if health_score >= 80 else
            "yellow" if health_score >= 60 else
            "red"
        )

        # ── Alerts (data-driven) ─────────────────────────────────────────────
        alerts = []
        if user_growth_pct < -10:
            alerts.append({
                "type": "warning",
                "message": f"User signups dropped {abs(user_growth_pct):.1f}% vs last week",
                "icon": "trend-down"
            })
        if chat_growth_pct < -15:
            alerts.append({
                "type": "warning",
                "message": f"Chat engagement down {abs(chat_growth_pct):.1f}% this week",
                "icon": "trend-down"
            })
        if report_growth_pct > 50 and reports_this_week > 2:
            alerts.append({
                "type": "alert",
                "message": f"Spike in disease reports — {reports_this_week} this week (+{report_growth_pct:.0f}%)",
                "icon": "spike"
            })
        if voice_pct > 40:
            alerts.append({
                "type": "info",
                "message": f"High voice adoption: {voice_pct}% of queries use voice input",
                "icon": "mic"
            })
        if top_diseases:
            alerts.append({
                "type": "info",
                "message": f"'{top_diseases[0]['name']}' is the most recurring disease in user queries",
                "icon": "leaf"
            })
        if user_growth_pct > 20:
            alerts.append({
                "type": "success",
                "message": f"Strong growth — user signups up {user_growth_pct:.1f}% this week",
                "icon": "trend-up"
            })
        if not alerts:
            alerts.append({
                "type": "success",
                "message": "All systems healthy. No critical alerts this period.",
                "icon": "check"
            })

        # ── Auto-generated insight summary ───────────────────────────────────
        top_crop_name    = top_crops[0]["name"]    if top_crops    else "various crops"
        top_disease_name = top_diseases[0]["name"].lower() if top_diseases else "crop diseases"

        user_trend_str = (f"a {abs(user_growth_pct):.0f}% {'increase' if user_growth_pct >= 0 else 'drop'} in new signups"
                          if users_prev_week > 0 else f"{users_this_week} new signups")
        chat_trend_str = (f"chat sessions {'rose' if chat_growth_pct >= 0 else 'fell'} {abs(chat_growth_pct):.0f}%"
                          if chats_prev_week > 0 else f"{chats_this_week} chat sessions recorded")

        insight_summary = (
            f"AgriGPT saw {user_trend_str} this week. {chat_trend_str.capitalize()} compared to the previous period. "
            f"{top_crop_name} remains the most discussed crop, while '{top_disease_name}' leads disease-related queries. "
            f"Platform health stands at {health_score}/100 ({health_color}). Voice adoption: {voice_pct}%."
        )

        # ── Per-day breakdown ─────────────────────────────────────────────────
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
                last_day      = _cal.monthrange(year, month)[1]
                m_end_naive   = datetime(year, month, last_day, 23, 59, 59)
                m_start_aware = m_start_naive.replace(tzinfo=timezone.utc)
                m_end_aware   = m_end_naive.replace(tzinfo=timezone.utc)
                m_users   = user_collection.count_documents({"created_at": {"$gte": m_start_naive, "$lte": m_end_naive}})
                m_chats   = chat_sessions_collection.count_documents({"created_at": {"$gte": m_start_aware, "$lte": m_end_aware}})
                m_reports = report_collection.count_documents({"timestamp": {"$gte": m_start_aware, "$lte": m_end_aware}})
                daily_activity.append({
                    "month": m_start_naive.strftime("%b %Y"),
                    "date":  m_start_naive.strftime("%b %Y"),
                    "new_users": m_users, "chat_sessions": m_chats, "reports": m_reports,
                })
        else:
            for days_back in range(days_range - 1, -1, -1):
                d_start_naive = today_naive - timedelta(days=days_back)
                d_end_naive   = d_start_naive + timedelta(days=1)
                d_start_aware = today_aware   - timedelta(days=days_back)
                d_end_aware   = d_start_aware + timedelta(days=1)
                d_users   = user_collection.count_documents({"created_at": {"$gte": d_start_naive, "$lt": d_end_naive}})
                d_chats   = chat_sessions_collection.count_documents({"created_at": {"$gte": d_start_aware, "$lt": d_end_aware}})
                d_reports = report_collection.count_documents({"timestamp": {"$gte": d_start_aware, "$lt": d_end_aware}})
                daily_activity.append({
                    "date": d_start_naive.strftime("%b %d"),
                    "new_users": d_users, "chat_sessions": d_chats, "reports": d_reports,
                })

        return jsonify({
            "success": True,
            "statistics": {
                "users": {
                    "total":          total_users,
                    "developers":     total_developers,
                    "regular_users":  total_users - total_developers,
                    "recent_signups": users_this_week,
                    "prev_week":      users_prev_week,
                    "growth_pct":     user_growth_pct,
                },
                "feature_usage": {
                    "chat_sessions":        total_chats,
                    "reports_generated":    total_reports,
                    "feedbacks_received":   total_feedbacks,
                    "most_used_feature":    {"name": most_used[0], "count": most_used[1]},
                    "chat_sessions_period": recent_chats,
                    "reports_period":       recent_reports,
                    "feedbacks_period":     fb_col.count_documents({"created_at": {"$gte": window_ago_naive}}),
                    "users_period":         recent_users,
                    "chat_growth_pct":      chat_growth_pct,
                    "report_growth_pct":    report_growth_pct,
                    "chats_this_week":      chats_this_week,
                    "reports_this_week":    reports_this_week,
                    "chats_prev_week":      chats_prev_week,
                    "reports_prev_week":    reports_prev_week,
                },
                "engagement": {
                    "avg_chats_per_user": avg_chats_per_user,
                    "voice_chats":        voice_chats,
                    "voice_pct":          voice_pct,
                    "engagement_score":   engagement_score,
                    "language_dist":      language_dist,
                },
                "agriculture": {
                    "top_crops":    top_crops,
                    "top_diseases": top_diseases,
                    "crop_max":     crop_max,
                    "disease_max":  disease_max,
                },
                "feedback_analytics": {
                    "total":           total_feedbacks,
                    "resolved":        resolved_fb,
                    "resolution_rate": fb_resolution_rate,
                },
                "platform_health": {
                    "score":  health_score,
                    "color":  health_color,
                    "components": {
                        "user_growth":    round(growth_component,     1),
                        "engagement":     round(engagement_component, 1),
                        "ai_success":     round(ai_success_component, 1),
                        "feedback":       round(feedback_component,   1),
                        "report_activity":round(report_component,     1),
                    },
                },
                "alerts":          alerts,
                "insight_summary": insight_summary,
                "recent_activity": {
                    "last_7_days": {
                        "new_users":     users_this_week,
                        "chat_sessions": chats_this_week,
                        "reports":       reports_this_week,
                    },
                    "daily": daily_activity,
                },
                "days_range": days_range,
            },
        }), 200

    except Exception as e:
        print(f"❌ Error in get_admin_statistics: {str(e)}")
        import traceback; traceback.print_exc()
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
