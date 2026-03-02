from flask import Blueprint, request, jsonify
from routes.auth_routes import admin_required, token_required
from services.db_service import (
    developers_collection,
    user_collection,
    chat_collection,
    chat_sessions_collection,
    report_collection,
    feedback_collection,
    disease_predictions_collection,
    weather_searches_collection,
)

analytics_bp = Blueprint("analytics", __name__)


# Developer access check 

@analytics_bp.route("/api/check-developer", methods=["GET"])
@token_required
def check_developer():
    """Check if the current authenticated user has developer (admin) access."""
    try:
        user_id = request.current_user.get("user_id")
        print(f"ðŸ” Checking developer access for user_id: {user_id}")

        developer = developers_collection.find_one({"user_id": user_id})
        print(f"âœ… Developer found: {developer is not None}")

        if developer:
            print(f"ðŸ‘¨â€ðŸ’» Developer info: {developer.get('email')} - {developer.get('name')}")

        return jsonify({
            "is_developer": developer is not None,
            "developer_info": {
                "email": developer.get("email"),
                "name":  developer.get("name"),
                "role":  developer.get("role"),
            } if developer else None
        }), 200

    except Exception as e:
        print(f"âŒ Error in check_developer: {str(e)}")
        return jsonify({"error": str(e), "is_developer": False}), 500


# Admin statistics 

@analytics_bp.route("/api/admin/statistics", methods=["GET"])
@admin_required
def get_admin_statistics():
    """
    Comprehensive insight-driven statistics for the admin dashboard.
    Scans all 9 AgriGPT MongoDB collections.

    Query params
    ------------
    days : int  (7 | 14 | 30 | 365)  â€”  activity window, default 7
    """
    try:
        from datetime import datetime, timedelta, timezone
        import calendar as _cal

        # Accept ?days= query param 
        
        try:
            days_range = int(request.args.get("days", 7))
            if days_range not in (7, 14, 30, 365):
                days_range = 7
        except (ValueError, TypeError):
            days_range = 7

        # Timezone helpers
        
        now_naive   = datetime.utcnow()
        now_aware   = datetime.now(timezone.utc)
        today_naive = now_naive.replace(hour=0, minute=0, second=0, microsecond=0)
        today_aware = now_aware.replace(hour=0, minute=0, second=0, microsecond=0)

        # Week-over-week windows
        w1_start_naive = now_naive - timedelta(days=7)
        w2_start_naive = now_naive - timedelta(days=14)
        w1_start_aware = now_aware - timedelta(days=7)
        w2_start_aware = now_aware - timedelta(days=14)

        # Selected period window
        window_ago_naive = now_naive - timedelta(days=days_range)
        window_ago_aware = now_aware - timedelta(days=days_range)

        def pct_change(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 1)

        # 1. USERS  (db.users)
        
        total_users      = user_collection.count_documents({})
        total_developers = developers_collection.count_documents({})
        users_this_week  = user_collection.count_documents({"created_at": {"$gte": w1_start_naive}})
        users_prev_week  = user_collection.count_documents({"created_at": {"$gte": w2_start_naive, "$lt": w1_start_naive}})
        recent_users     = user_collection.count_documents({"created_at": {"$gte": window_ago_naive}})
        user_growth_pct  = pct_change(users_this_week, users_prev_week)

        # Active users: had at least one chat session in the last 7 days
        active_user_ids    = chat_sessions_collection.distinct("user_id", {"created_at": {"$gte": w1_start_aware}})
        active_users_count = len(active_user_ids)
        inactive_users     = max(0, total_users - active_users_count)

        # Returning users: users with more than 1 chat session (all-time)
        returning_pipeline = [
            {"$group": {"_id": "$user_id", "session_count": {"$sum": 1}}},
            {"$match": {"session_count": {"$gt": 1}}},
            {"$count": "returning"},
        ]
        returning_result = list(chat_sessions_collection.aggregate(returning_pipeline))
        returning_users  = returning_result[0]["returning"] if returning_result else 0

        # 2. CHAT SESSIONS  (db.chat_sessions)
        
        total_chats     = chat_sessions_collection.count_documents({})
        chats_this_week = chat_sessions_collection.count_documents({"created_at": {"$gte": w1_start_aware}})
        chats_prev_week = chat_sessions_collection.count_documents({"created_at": {"$gte": w2_start_aware, "$lt": w1_start_aware}})
        recent_chats    = chat_sessions_collection.count_documents({"created_at": {"$gte": window_ago_aware}})
        chat_growth_pct = pct_change(chats_this_week, chats_prev_week)

        # Language distribution of chat sessions
        session_lang_pipeline = [
            {"$match": {"language": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$language", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6},
        ]
        session_lang_dist = [
            {"language": str(r.get("_id") or "English").capitalize(), "count": r["count"]}
            for r in chat_sessions_collection.aggregate(session_lang_pipeline)
        ]

        # 3. CHAT MESSAGES  (db.chat_history)
        
        total_messages   = chat_collection.count_documents({"role": "user"})
        total_responses  = chat_collection.count_documents({"role": "assistant"})
        voice_chats      = chat_collection.count_documents({"input_type": "voice"})
        voice_pct        = round((voice_chats / max(total_messages, 1)) * 100, 1)
        avg_chats_per_user       = round(total_chats / max(total_users, 1), 1)
        avg_messages_per_session = round(total_messages / max(total_chats, 1), 1)
        engagement_score = round((chats_this_week / max(total_users, 1)) * 100, 1)

        # Message language distribution
        lang_pipeline = [
            {"$match": {"role": "user", "language": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$language", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6},
        ]
        lang_raw = list(chat_collection.aggregate(lang_pipeline))
        language_dist = [
            {"language": str(l.get("_id") or "English").capitalize(), "count": l["count"]}
            for l in lang_raw
        ]
        if not language_dist:
            language_dist = [{"language": "English", "count": total_messages}]

        # Response type distribution (text / table / image / mixed etc.)
        response_type_pipeline = [
            {"$match": {"role": "assistant", "response_type": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$response_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 8},
        ]
        response_types = [
            {"type": r["_id"] or "text", "count": r["count"]}
            for r in chat_collection.aggregate(response_type_pipeline)
        ]

        # Agriculture keyword scan â€“ sample 500 most recent user messages
        CROPS = [
            "rice", "wheat", "maize", "corn", "cotton", "sugarcane",
            "potato", "tomato", "onion", "soybean", "mango", "banana",
            "groundnut", "paddy", "mustard", "sunflower", "barley",
            "chickpea", "lentil", "jute", "tea", "coffee", "pepper",
        ]
        DISEASES = [
            "blight", "rust", "wilt", "rot", "mildew", "mosaic",
            "spot", "canker", "smut", "scab", "yellowing", "fungal",
            "bacterial", "blast", "borer", "aphid", "leaf curl",
            "powdery", "downy", "anthracnose", "damping",
        ]

        crop_counts, disease_counts = {}, {}
        recent_msgs = chat_collection.find(
            {"role": "user"}, {"content": 1}
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
                        for k, v in sorted(crop_counts.items(),    key=lambda x: x[1], reverse=True)[:6]]
        top_diseases = [{"name": k.capitalize(), "count": v}
                        for k, v in sorted(disease_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

        crop_max    = top_crops[0]["count"]    if top_crops    else 1
        disease_max = top_diseases[0]["count"] if top_diseases else 1

        # 4. FARMING REPORTS  (db.farming_reports)
        
        total_reports     = report_collection.count_documents({})
        reports_this_week = report_collection.count_documents({"timestamp": {"$gte": w1_start_aware}})
        reports_prev_week = report_collection.count_documents({"timestamp": {"$gte": w2_start_aware, "$lt": w1_start_aware}})
        recent_reports    = report_collection.count_documents({"timestamp": {"$gte": window_ago_aware}})
        report_growth_pct = pct_change(reports_this_week, reports_prev_week)

        # Top crops by report count
        top_report_crops_pipeline = [
            {"$match": {"crop_name": {"$exists": True, "$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$crop_name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6},
        ]
        top_report_crops = [
            {"name": r["_id"] or "Unknown", "count": r["count"]}
            for r in report_collection.aggregate(top_report_crops_pipeline)
        ]

        # Top regions by report count
        top_regions_pipeline = [
            {"$match": {"region": {"$exists": True, "$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$region", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6},
        ]
        top_regions = [
            {"name": r["_id"] or "Unknown", "count": r["count"]}
            for r in report_collection.aggregate(top_regions_pipeline)
        ]

        # Language distribution of reports
        report_lang_pipeline = [
            {"$match": {"language": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$language", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5},
        ]
        report_lang_dist = [
            {"language": str(r["_id"] or "English").capitalize(), "count": r["count"]}
            for r in report_collection.aggregate(report_lang_pipeline)
        ]

        # 5. FEEDBACK  (db.user_feedback)
        
        total_feedbacks     = feedback_collection.count_documents({})
        resolved_fb         = feedback_collection.count_documents({"status": "resolved"})
        inprogress_fb       = feedback_collection.count_documents({"status": "in-progress"})
        new_fb              = feedback_collection.count_documents({"status": "new"})
        fb_resolution_rate  = round((resolved_fb / max(total_feedbacks, 1)) * 100, 1)
        feedbacks_this_week = feedback_collection.count_documents({"timestamp": {"$gte": w1_start_aware}})
        feedbacks_prev_week = feedback_collection.count_documents({"timestamp": {"$gte": w2_start_aware, "$lt": w1_start_aware}})
        feedback_growth_pct = pct_change(feedbacks_this_week, feedbacks_prev_week)

        # 6. DISEASE PREDICTIONS  (db.disease_predictions)
        
        total_predictions     = disease_predictions_collection.count_documents({})
        predictions_this_week = disease_predictions_collection.count_documents({"timestamp": {"$gte": w1_start_aware}})
        predictions_prev_week = disease_predictions_collection.count_documents({"timestamp": {"$gte": w2_start_aware, "$lt": w1_start_aware}})
        predictions_period    = disease_predictions_collection.count_documents({"timestamp": {"$gte": window_ago_aware}})
        prediction_growth_pct = pct_change(predictions_this_week, predictions_prev_week)

        # Average confidence (this week)
        conf_pipeline = [
            {"$match": {"timestamp": {"$gte": w1_start_aware}}},
            {"$group": {"_id": None, "avg_conf": {"$avg": "$confidence"}}},
        ]
        conf_raw       = list(disease_predictions_collection.aggregate(conf_pipeline))
        avg_confidence = round(conf_raw[0]["avg_conf"], 1) if conf_raw else 0.0

        # All-time top predicted diseases
        top_pred_pipeline = [
            {"$group": {"_id": "$disease", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6},
        ]
        top_predictions = [
            {"name": r["_id"] or "Unknown", "count": r["count"]}
            for r in disease_predictions_collection.aggregate(top_pred_pipeline)
        ]

        # Confidence distribution: low (<60%), medium (60â€“80%), high (>80%)
        conf_dist_pipeline = [
            {"$group": {
                "_id": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lt": ["$confidence", 60]}, "then": "low"},
                            {"case": {"$lt": ["$confidence", 80]}, "then": "medium"},
                        ],
                        "default": "high"
                    }
                },
                "count": {"$sum": 1}
            }},
        ]
        conf_dist_raw = {r["_id"]: r["count"] for r in disease_predictions_collection.aggregate(conf_dist_pipeline)}
        confidence_distribution = {
            "low":    conf_dist_raw.get("low", 0),
            "medium": conf_dist_raw.get("medium", 0),
            "high":   conf_dist_raw.get("high", 0),
        }

        # Top users by prediction count (count only â€“ no PII)
        top_users_pred_pipeline = [
            {"$match": {"user_id": {"$ne": None}}},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5},
        ]
        prediction_power_users = [
            {"prediction_count": r["count"]}
            for r in disease_predictions_collection.aggregate(top_users_pred_pipeline)
        ]

        # 7. WEATHER SEARCHES  (db.weather_searches)
        
        total_weather_searches      = weather_searches_collection.count_documents({})
        weather_searches_this_week  = weather_searches_collection.count_documents({"timestamp": {"$gte": w1_start_aware}})
        weather_searches_prev_week  = weather_searches_collection.count_documents({"timestamp": {"$gte": w2_start_aware, "$lt": w1_start_aware}})
        weather_searches_period     = weather_searches_collection.count_documents({"timestamp": {"$gte": window_ago_aware}})
        weather_growth_pct          = pct_change(weather_searches_this_week, weather_searches_prev_week)

        # Trial vs registered user breakdown
        weather_by_trial      = weather_searches_collection.count_documents({"user_type": "trial"})
        weather_by_registered = weather_searches_collection.count_documents({"user_type": "registered"})
        weather_unknown       = total_weather_searches - weather_by_trial - weather_by_registered

        # Unique cities ever searched
        unique_cities     = weather_searches_collection.distinct("input.city")
        unique_city_count = len([c for c in unique_cities if c])

        # Top searched locations (all-time)
        location_pipeline = [
            {"$match": {"input.city": {"$exists": True, "$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$input.city", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 8},
        ]
        top_locations = [
            {"location": r["_id"] or "Unknown", "count": r["count"]}
            for r in weather_searches_collection.aggregate(location_pipeline)
        ]

        # 8. CROSS-COLLECTION AGGREGATES
        
        feature_counts = {
            "chat":       total_chats,
            "report":     total_reports,
            "feedback":   total_feedbacks,
            "prediction": total_predictions,
            "weather":    total_weather_searches,
        }
        most_used = max(feature_counts.items(), key=lambda x: x[1]) if feature_counts else ("None", 0)

        # Platform health composite score (0â€“100) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        growth_component     = min(20.0, max(4.0, 10.0 + (user_growth_pct / 100.0) * 10.0))
        engagement_component = min(20.0, (chats_this_week / max(total_users, 1)) * 20.0)
        ai_success_component = min(15.0, (avg_chats_per_user / 5.0) * 15.0)
        feedback_component   = (10.0 if total_feedbacks == 0
                                else min(15.0, fb_resolution_rate / 100.0 * 15.0))
        report_component     = min(10.0, (reports_this_week / max(total_users // 10, 1)) * 10.0)
        prediction_component = min(10.0, (predictions_this_week / max(total_users // 20, 1)) * 10.0)
        weather_component    = min(10.0, (weather_searches_this_week / max(total_users // 10, 1)) * 10.0)

        health_score = round(
            growth_component + engagement_component + ai_success_component +
            feedback_component + report_component + prediction_component + weather_component
        )
        health_score = max(0, min(100, health_score))
        health_color = "green" if health_score >= 80 else "yellow" if health_score >= 60 else "red"

        # Data-driven alerts 
        
        alerts = []
        if user_growth_pct < -10:
            alerts.append({"type": "warning",
                            "message": f"User signups dropped {abs(user_growth_pct):.1f}% vs last week",
                            "icon": "trend-down"})
        if chat_growth_pct < -15:
            alerts.append({"type": "warning",
                            "message": f"Chat engagement down {abs(chat_growth_pct):.1f}% this week",
                            "icon": "trend-down"})
        if report_growth_pct > 50 and reports_this_week > 2:
            alerts.append({"type": "alert",
                            "message": f"Spike in disease reports â€” {reports_this_week} this week (+{report_growth_pct:.0f}%)",
                            "icon": "spike"})
        if voice_pct > 40:
            alerts.append({"type": "info",
                            "message": f"High voice adoption: {voice_pct}% of queries use voice input",
                            "icon": "mic"})
        if top_diseases:
            alerts.append({"type": "info",
                            "message": f"'{top_diseases[0]['name']}' is the most recurring disease in chat queries",
                            "icon": "leaf"})
        if user_growth_pct > 20:
            alerts.append({"type": "success",
                            "message": f"Strong growth â€” user signups up {user_growth_pct:.1f}% this week",
                            "icon": "trend-up"})
        if avg_confidence > 0 and avg_confidence < 70:
            alerts.append({"type": "warning",
                            "message": f"Disease scan confidence is low this week: avg {avg_confidence:.1f}%",
                            "icon": "alert"})
        if total_users > 0 and (inactive_users / total_users) > 0.70:
            alerts.append({"type": "warning",
                            "message": f"{inactive_users} users inactive this week ({round(inactive_users / total_users * 100)}% of all users)",
                            "icon": "trend-down"})
        if feedback_growth_pct > 100 and feedbacks_this_week > 3:
            alerts.append({"type": "alert",
                            "message": f"Feedback volume doubled this week (+{feedbacks_this_week} new entries)",
                            "icon": "spike"})
        if top_report_crops and top_regions:
            alerts.append({"type": "info",
                            "message": f"Most reported crop: {top_report_crops[0]['name']}; Top region: {top_regions[0]['name']}",
                            "icon": "leaf"})
        if not alerts:
            alerts.append({"type": "success",
                            "message": "All systems healthy. No critical alerts this period.",
                            "icon": "check"})

        # Auto-generated insight summary 
        top_crop_name    = top_crops[0]["name"]             if top_crops    else "various crops"
        top_disease_name = top_diseases[0]["name"].lower()  if top_diseases else "crop diseases"
        top_region_name  = top_regions[0]["name"]           if top_regions  else "multiple regions"

        user_trend_str = (f"a {abs(user_growth_pct):.0f}% {'increase' if user_growth_pct >= 0 else 'drop'} in new signups"
                          if users_prev_week > 0 else f"{users_this_week} new signups")
        chat_trend_str = (f"chat sessions {'rose' if chat_growth_pct >= 0 else 'fell'} {abs(chat_growth_pct):.0f}%"
                          if chats_prev_week > 0 else f"{chats_this_week} chat sessions recorded")

        insight_summary = (
            f"AgriGPT saw {user_trend_str} this week ({active_users_count} active, {returning_users} returning). "
            f"{chat_trend_str.capitalize()} vs the previous period; avg {avg_messages_per_session} messages per session. "
            f"'{top_crop_name}' dominates chat queries while '{top_disease_name}' is the top disease concern. "
            f"Reports most active in {top_region_name}. "
            f"Scan confidence avg: {avg_confidence:.1f}%. Platform health: {health_score}/100 ({health_color}). Voice: {voice_pct}%."
        )

        # Per-day / per-month activity breakdown 
        daily_activity = []
        if days_range == 365:
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
                daily_activity.append({
                    "month":            m_start_naive.strftime("%b %Y"),
                    "date":             m_start_naive.strftime("%b %Y"),
                    "new_users":        user_collection.count_documents({"created_at": {"$gte": m_start_naive, "$lte": m_end_naive}}),
                    "chat_sessions":    chat_sessions_collection.count_documents({"created_at": {"$gte": m_start_aware, "$lte": m_end_aware}}),
                    "reports":          report_collection.count_documents({"timestamp": {"$gte": m_start_aware, "$lte": m_end_aware}}),
                    "predictions":      disease_predictions_collection.count_documents({"timestamp": {"$gte": m_start_aware, "$lte": m_end_aware}}),
                    "weather_searches": weather_searches_collection.count_documents({"timestamp": {"$gte": m_start_aware, "$lte": m_end_aware}}),
                    "feedbacks":        feedback_collection.count_documents({"timestamp": {"$gte": m_start_aware, "$lte": m_end_aware}}),
                })
        else:
            for days_back in range(days_range - 1, -1, -1):
                d_start_naive = today_naive - timedelta(days=days_back)
                d_end_naive   = d_start_naive + timedelta(days=1)
                d_start_aware = today_aware   - timedelta(days=days_back)
                d_end_aware   = d_start_aware + timedelta(days=1)
                daily_activity.append({
                    "date":             d_start_naive.strftime("%b %d"),
                    "new_users":        user_collection.count_documents({"created_at": {"$gte": d_start_naive, "$lt": d_end_naive}}),
                    "chat_sessions":    chat_sessions_collection.count_documents({"created_at": {"$gte": d_start_aware, "$lt": d_end_aware}}),
                    "reports":          report_collection.count_documents({"timestamp": {"$gte": d_start_aware, "$lt": d_end_aware}}),
                    "predictions":      disease_predictions_collection.count_documents({"timestamp": {"$gte": d_start_aware, "$lt": d_end_aware}}),
                    "weather_searches": weather_searches_collection.count_documents({"timestamp": {"$gte": d_start_aware, "$lt": d_end_aware}}),
                    "feedbacks":        feedback_collection.count_documents({"timestamp": {"$gte": d_start_aware, "$lt": d_end_aware}}),
                })

        # RESPONSE
        
        return jsonify({
            "success": True,
            "statistics": {

                # 1. Users 
                
                "users": {
                    "total":            total_users,
                    "developers":       total_developers,
                    "regular_users":    total_users - total_developers,
                    "recent_signups":   users_this_week,
                    "prev_week":        users_prev_week,
                    "growth_pct":       user_growth_pct,
                    "active_this_week": active_users_count,
                    "inactive":         inactive_users,
                    "returning":        returning_users,
                },

                # 2. Feature usage 
                "feature_usage": {
                    "chat_sessions":        total_chats,
                    "reports_generated":    total_reports,
                    "feedbacks_received":   total_feedbacks,
                    "disease_scans":        total_predictions,
                    "weather_lookups":      total_weather_searches,
                    "most_used_feature":    {"name": most_used[0], "count": most_used[1]},
                    "chat_sessions_period": recent_chats,
                    "reports_period":       recent_reports,
                    "feedbacks_period":     feedback_collection.count_documents({"timestamp": {"$gte": window_ago_aware}}),
                    "predictions_period":   predictions_period,
                    "weather_period":       weather_searches_period,
                    "users_period":         recent_users,
                    "chat_growth_pct":      chat_growth_pct,
                    "report_growth_pct":    report_growth_pct,
                    "chats_this_week":      chats_this_week,
                    "reports_this_week":    reports_this_week,
                    "chats_prev_week":      chats_prev_week,
                    "reports_prev_week":    reports_prev_week,
                },

                # 3. Chat engagement 
                
                "engagement": {
                    "total_messages":           total_messages,
                    "total_ai_responses":       total_responses,
                    "avg_chats_per_user":       avg_chats_per_user,
                    "avg_messages_per_session": avg_messages_per_session,
                    "voice_chats":              voice_chats,
                    "voice_pct":                voice_pct,
                    "engagement_score":         engagement_score,
                    "language_dist":            language_dist,
                    "session_language_dist":    session_lang_dist,
                    "response_type_dist":       response_types,
                },

                # 4. Agriculture (chat keyword scan) 
                "agriculture": {
                    "top_crops":    top_crops,
                    "top_diseases": top_diseases,
                    "crop_max":     crop_max,
                    "disease_max":  disease_max,
                },

                # 5. Reports 
                "report_analytics": {
                    "total":         total_reports,
                    "this_week":     reports_this_week,
                    "prev_week":     reports_prev_week,
                    "growth_pct":    report_growth_pct,
                    "top_crops":     top_report_crops,
                    "top_regions":   top_regions,
                    "language_dist": report_lang_dist,
                },

                # Feedback 
                "feedback_analytics": {
                    "total":           total_feedbacks,
                    "new":             new_fb,
                    "in_progress":     inprogress_fb,
                    "resolved":        resolved_fb,
                    "resolution_rate": fb_resolution_rate,
                    "this_week":       feedbacks_this_week,
                    "prev_week":       feedbacks_prev_week,
                    "growth_pct":      feedback_growth_pct,
                },

                # 7. Disease predictions 
                "upload_analytics": {
                    "total_predictions":       total_predictions,
                    "predictions_this_week":   predictions_this_week,
                    "predictions_prev_week":   predictions_prev_week,
                    "predictions_period":      predictions_period,
                    "prediction_growth_pct":   prediction_growth_pct,
                    "avg_confidence":          avg_confidence,
                    "top_predictions":         top_predictions,
                    "confidence_distribution": confidence_distribution,
                    "power_users":             prediction_power_users,
                },

                # 8. Weather 
                "weather_analytics": {
                    "total_searches":     total_weather_searches,
                    "searches_this_week": weather_searches_this_week,
                    "searches_prev_week": weather_searches_prev_week,
                    "searches_period":    weather_searches_period,
                    "weather_growth_pct": weather_growth_pct,
                    "top_locations":      top_locations,
                    "unique_cities":      unique_city_count,
                    "by_user_type": {
                        "trial":      weather_by_trial,
                        "registered": weather_by_registered,
                        "unknown":    weather_unknown,
                    },
                },
                # Platform health 
                "platform_health": {
                    "score": health_score,
                    "color": health_color,
                    "components": {
                        "user_growth":          round(growth_component,      1),
                        "engagement":           round(engagement_component,  1),
                        "ai_success":           round(ai_success_component,  1),
                        "feedback":             round(feedback_component,    1),
                        "report_activity":      round(report_component,      1),
                        "prediction_activity":  round(prediction_component,  1),
                        "weather_activity":     round(weather_component,     1),
                    },
                },

                # â”€â”€ Alerts & summary 
                "alerts":          alerts,
                "insight_summary": insight_summary,

                # Time-series chart data
                "recent_activity": {
                    "last_7_days": {
                        "new_users":        users_this_week,
                        "chat_sessions":    chats_this_week,
                        "reports":          reports_this_week,
                        "predictions":      predictions_this_week,
                        "weather_searches": weather_searches_this_week,
                        "feedbacks":        feedbacks_this_week,
                    },
                    "daily": daily_activity,
                },

                "days_range": days_range,
            },
        }), 200

    except Exception as e:
        print(f"âŒ Error in get_admin_statistics: {str(e)}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500
