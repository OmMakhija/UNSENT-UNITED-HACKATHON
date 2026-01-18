import eventlet
eventlet.monkey_patch()

import os
import uuid
import random
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from sentiment import detect_emotion
from thread_matcher import assign_thread
from sockets import register_socket_handlers
from supabase_client import supabase

# ------------------------
# App setup
# ------------------------
app = Flask(__name__)

# Allow all origins (safe for hackathon / demo)
CORS(app, resources={r"/*": {"origins": "*"}})

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True,
)

register_socket_handlers(socketio)

print("=" * 60)
print("🚀 UNSENT Backend Server")
print("✅ Socket handlers registered")
print("=" * 60)

# ------------------------
# Health check
# ------------------------
@app.route("/", methods=["GET"])
def health():
    return "UNSENT backend alive", 200

# ------------------------
# Submit unsent message
# ------------------------
@app.route("/submit", methods=["POST"])
def submit():
    try:
        data = request.get_json(force=True, silent=True) or {}
        text = data.get("text", "").strip()[:400]

        if not text:
            return jsonify({"error": "Missing text"}), 400

        emotion, score = detect_emotion(text)
        thread_id = assign_thread(text, emotion)
        message_id = str(uuid.uuid4())

        # Insert unsent message
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

        # Link message to thread
        supabase.table("thread_messages").insert({
            "id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "message_id": message_id,
        }).execute()

        return jsonify({
            "success": True,
            "id": message_id,
            "thread_id": thread_id,
        }), 200

    except Exception as e:
        print("❌ /submit error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500

# ------------------------
# Fetch stars
# ------------------------
@app.route("/stars", methods=["GET"])
def get_stars():
    try:
        res = supabase.table("unsent_messages").select("*").execute()
        return jsonify(res.data), 200
    except Exception as e:
        print("❌ /stars error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500

# ------------------------
# Get thread for a star
# ------------------------
@app.route("/thread/<star_id>", methods=["GET"])
def get_thread(star_id):
    try:
        res = (
            supabase
            .table("unsent_messages")
            .select("thread_id")
            .eq("id", star_id)
            .single()
            .execute()
        )

        if not res.data:
            return jsonify({"error": "Star not found"}), 404

        return jsonify({"thread_id": res.data["thread_id"]}), 200

    except Exception as e:
        print("❌ /thread error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500

# ------------------------
# Cleanup old stars
# ------------------------
@app.route("/cleanup", methods=["POST"])
def cleanup_old_stars():
    try:
        cutoff = datetime.utcnow() - timedelta(hours=24)

        supabase.table("unsent_messages") \
            .delete() \
            .lt("created_at", cutoff.isoformat()) \
            .execute()

        return jsonify({"ok": True}), 200

    except Exception as e:
        print("❌ /cleanup error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500

# ------------------------
# Run server
# ------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))

    print(f"🌟 Starting server on port {port}")
    print("=" * 60)

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=False,
        use_reloader=False,
    )
