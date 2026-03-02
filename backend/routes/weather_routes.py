"""
weather_routes.py
─────────────────
Thin proxy blueprint: forwards all weather & soil API calls from the
Python/Flask backend (port 5000) to the Node.js server (port 3020).

Frontend only needs to know about one backend – http://localhost:5000.
"""

import os
import requests
from flask import Blueprint, request, Response, stream_with_context

weather_bp = Blueprint("weather", __name__)

# Node server base URL — reads WEATHER_PORT from .env (default 3020)
_NODE_BASE = f"http://127.0.0.1:{os.getenv('WEATHER_PORT', '3020')}"

# ── Proxy helper ──────────────────────────────────────────────────────────────

def _proxy(path: str) -> Response:
    """Forward a request to the Node server and stream the response back."""
    url = f"{_NODE_BASE}{path}"

    # Forward query-string, body, and relevant headers
    resp = requests.request(
        method  = request.method,
        url     = url,
        params  = request.args,
        json    = request.get_json(silent=True),
        data    = request.get_data() if not request.is_json else None,
        headers = {
            "Content-Type": request.content_type or "application/json",
        },
        timeout = 120,
    )

    # Strip hop-by-hop headers that Flask/requests shouldn't forward
    excluded = {"transfer-encoding", "connection", "keep-alive"}
    headers  = {k: v for k, v in resp.headers.items()
                if k.lower() not in excluded}

    return Response(
        stream_with_context(resp.iter_content(chunk_size=4096)),
        status   = resp.status_code,
        headers  = headers,
        mimetype = resp.headers.get("Content-Type", "application/json"),
    )


def _get_uid():
    """Extract user_id from JWT if present, else return None."""
    try:
        from utils.config import JWT_SECRET_KEY
        import jwt as _jwt
        token = request.headers.get("Authorization", "")
        if token.startswith("Bearer "):
            payload = _jwt.decode(token.split(" ")[1], JWT_SECRET_KEY, algorithms=["HS256"])
            return payload.get("user_id")
    except Exception:
        pass
    return None


# ── Routes ────────────────────────────────────────────────────────────────────

@weather_bp.route("/api/agriculture-data", methods=["GET"])
def agriculture_data():
    """Main weather + soil search. Saves input city + full output for all users."""
    city = request.args.get("city") or "Unknown"
    uid  = _get_uid()

    # Forward to Node server (non-streaming so we can capture the body)
    url  = f"{_NODE_BASE}/api/agriculture-data"
    resp = requests.request(
        method  = "GET",
        url     = url,
        params  = request.args,
        headers = {"Content-Type": request.content_type or "application/json"},
        timeout = 120,
    )

    # Exclude hop-by-hop headers
    excluded = {"transfer-encoding", "connection", "keep-alive"}
    headers  = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}

    # Persist input (city) + full output JSON for admin analytics
    try:
        from services.db_service import save_weather_search
        weather_output = resp.json() if resp.ok else {}
        save_weather_search(city=city, user_id=uid, weather_output=weather_output)
    except Exception:
        pass

    return Response(
        resp.content,
        status   = resp.status_code,
        headers  = headers,
        mimetype = resp.headers.get("Content-Type", "application/json"),
    )


@weather_bp.route("/api/hourly-weather", methods=["GET"])
def hourly_weather():
    return _proxy("/api/hourly-weather")


@weather_bp.route("/api/expert-recommendation", methods=["POST"])
def expert_recommendation():
    return _proxy("/api/expert-recommendation")


@weather_bp.route("/api/current-weather", methods=["GET"])
def current_weather():
    return _proxy("/api/current-weather")
