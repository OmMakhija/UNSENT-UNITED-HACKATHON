import eventlet
eventlet.monkey_patch()

import uuid
import random
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from sentiment import detect_emotion
from supabase_client import supabase
from sockets import register_socket_handlers
from thread_matcher import assign_thread

# ------------------------
# App setup
# ------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    ping_timeout=60,
    ping_interval=25
)

# Register socket event handlers
register_socket_handlers(socketio)

print("=" * 60)
print("🚀 UNSENT Backend Server")
print("=" * 60)
print("✅ Socket handlers registered")
print("=" * 60)

# ------------------------
# Health check
# ------------------------
@app.route("/")
def health():
    return "UNSENT backend alive"

# ------------------------
# Submit unsent message (SINGLE SOURCE OF TRUTH)
# ------------------------
@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json(force=True, silent=True) or {}

    text = data.get("text", "").strip()[:400]
    if not text:
        return jsonify({"error": "Missing text"}), 400

    emotion, score = detect_emotion(text)
    thread_id = assign_thread(text, emotion)

    message_id = str(uuid.uuid4())

    supabase.table("unsent_messages").insert({
        "id": message_id,
        "text": text,
        "emotion": emotion,
        "emotion_score": score,
        "language": "unknown",
        "resonance_count": 0,
        "lat": random.uniform(-60, 60),
        "lng": random.uniform(-180, 180),
        "thread_id": thread_id,
    }).execute()

    supabase.table("thread_messages").insert({
        "id": str(uuid.uuid4()),
        "thread_id": thread_id,
        "message_id": message_id,
    }).execute()

    return jsonify({
        "success": True,
        "id": message_id,
        "thread_id": thread_id,
    })


# ------------------------
# Fetch stars (ALL stars — filtering happens client-side)
# ------------------------
@app.route("/stars", methods=["GET"])
def get_stars():
    try:
        res = (
            supabase
            .table("unsent_messages")
            .select("*")
            .execute()
        )
        return jsonify(res.data)
    except Exception as e:
        print("❌ /stars error:", e)
        return jsonify({"error": str(e)}), 500


# ------------------------
# Get thread for a star
# ------------------------
@app.route("/thread/<star_id>", methods=["GET"])
def get_thread(star_id):
    res = (
        supabase
        .table("unsent_messages")
        .select("thread_id")
        .eq("id", star_id)
        .single()
        .execute()
    )

    return jsonify({"thread_id": res.data["thread_id"]})

# ------------------------
# Cleanup old stars
# ------------------------
@app.route("/cleanup", methods=["POST"])
def cleanup_old_stars():
    cutoff = datetime.utcnow() - timedelta(hours=24)

    supabase.table("unsent_messages") \
        .delete() \
        .lt("created_at", cutoff.isoformat()) \
        .execute()

    return jsonify({"ok": True})

# ------------------------
# Run server
# ------------------------
if __name__ == "__main__":
    print("🌟 Starting server on http://localhost:5001")
    print("=" * 60)
    socketio.run(
        app,
        host="0.0.0.0",
        port=5001,  # Changed from 5000 to 5001
        debug=True,  # Changed from False to True for development
        use_reloader=False  # Prevent double initialization with eventlet
    )