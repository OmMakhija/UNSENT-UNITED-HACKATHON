from flask import request
from flask_socketio import join_room, leave_room, emit
import uuid

# -----------------------------
# Ephemeral presence
# -----------------------------

ACTIVE_USERS = set()                 # sid
STAR_OWNERS = {}                     # star_id -> sid
PENDING_REQUESTS = {}                # request_id -> dict
ACTIVE_THREADS = {}                  # thread_id -> set(sids)


def register_socket_handlers(socketio):

    # -----------------------------
    # Connect / Disconnect
    # -----------------------------
    @socketio.on("connect")
    def on_connect():
        ACTIVE_USERS.add(request.sid)
        emit("connected")
        print(f"✅ User connected: {request.sid}")
        print(f"📊 Active users: {len(ACTIVE_USERS)}")

    @socketio.on("disconnect")
    def on_disconnect():
        sid = request.sid
        ACTIVE_USERS.discard(sid)
        
        print(f"❌ User disconnected: {sid}")
        print(f"📊 Active users: {len(ACTIVE_USERS)}")

        # Collect all stars owned by this user
        disconnected_stars = []
        for star_id, owner_sid in list(STAR_OWNERS.items()):
            if owner_sid == sid:
                disconnected_stars.append(star_id)
                del STAR_OWNERS[star_id]
        
        # Broadcast to all clients that these stars are now offline
        if disconnected_stars:
            print(f"🌟 Removing {len(disconnected_stars)} stars from disconnected user")
            emit("stars_offline", {"star_ids": disconnected_stars}, broadcast=True)

        # Cleanup pending requests
        for rid, req in list(PENDING_REQUESTS.items()):
            if req["requester_sid"] == sid or req["owner_sid"] == sid:
                del PENDING_REQUESTS[rid]

        # Leave threads
        for thread_id, users in list(ACTIVE_THREADS.items()):
            if sid in users:
                users.discard(sid)
                leave_room(thread_id, sid=sid)
                print(f"👋 {sid} removed from thread {thread_id}")
            # DON'T delete the thread even if empty - allows reconnection

    # -----------------------------
    # Register star ownership - UPDATED
    # -----------------------------
    @socketio.on("register_star")
    def register_star(data):
        star_id = data.get("star_id")
        if not star_id:
            print("❌ register_star: Missing star_id")
            return

        STAR_OWNERS[star_id] = request.sid
        print(f"⭐ Star registered: {star_id[:12]}... -> {request.sid}")
        print(f"📊 Total active stars: {len(STAR_OWNERS)}")
        
        # Get updated list of all active stars
        active_star_ids = list(STAR_OWNERS.keys())
        
        # Broadcast updated list to ALL connected clients
        emit("active_stars", {"star_ids": active_star_ids}, broadcast=True)
        print(f"📢 Broadcasted active stars to ALL clients: {len(active_star_ids)} stars")

    # -----------------------------
    # Get active stars - NEW
    # -----------------------------
    @socketio.on("get_active_stars")
    def get_active_stars():
        """Send list of currently active star IDs to requesting client"""
        active_star_ids = list(STAR_OWNERS.keys())
        emit("active_stars", {"star_ids": active_star_ids})
        print(f"📋 Sent active stars to {request.sid}: {len(active_star_ids)} stars")

    # -----------------------------
    # Request thread - UPDATED
    # -----------------------------
    @socketio.on("request_thread")
    def request_thread(data):
        target_star_id = data.get("star_id")           # Star they want to connect to
        requester_star_id = data.get("requester_star_id")  # Their own star ID

        if not target_star_id or target_star_id not in STAR_OWNERS:
            emit("thread_unavailable")
            print(f"❌ Thread request failed: Star {target_star_id[:12] if target_star_id else 'None'}... not available")
            return

        if not requester_star_id:
            emit("thread_request_error", {"message": "Missing requester star ID"})
            return

        owner_sid = STAR_OWNERS[target_star_id]
        requester_sid = request.sid

        if owner_sid == requester_sid:
            return  # cannot connect to self

        request_id = str(uuid.uuid4())

        PENDING_REQUESTS[request_id] = {
            "owner_sid": owner_sid,
            "requester_sid": requester_sid,
            "requester_star_id": requester_star_id,
            "target_star_id": target_star_id,
        }

        # Fetch the requester's star data from database
        from supabase_client import supabase
        try:
            requester_star = supabase.table("unsent_messages") \
                .select("*") \
                .eq("id", requester_star_id) \
                .single() \
                .execute()
            
            print(f"📤 Thread request: {requester_sid} -> {owner_sid}")
            
            emit(
                "thread_request",
                {
                    "request_id": request_id,
                    "requester_star": requester_star.data,
                },
                to=owner_sid
            )
        except Exception as e:
            print(f"❌ Error fetching requester star: {e}")
            emit("thread_request_error", {"message": "Could not load star data"}, to=requester_sid)

    # -----------------------------
    # Respond to request
    # -----------------------------
    @socketio.on("respond_thread")
    def respond_thread(data):
        request_id = data.get("request_id")
        accepted = data.get("accepted")

        if request_id not in PENDING_REQUESTS:
            return

        req = PENDING_REQUESTS.pop(request_id)

        owner_sid = req["owner_sid"]
        requester_sid = req["requester_sid"]

        if not accepted:
            print(f"❌ Thread declined: {request_id}")
            emit("thread_declined", to=requester_sid)
            return

        thread_id = str(uuid.uuid4())
        ACTIVE_THREADS[thread_id] = {owner_sid, requester_sid}

        join_room(thread_id, sid=owner_sid)
        join_room(thread_id, sid=requester_sid)

        print(f"✅ Thread created: {thread_id}")
        print(f"📊 Added to ACTIVE_THREADS: {ACTIVE_THREADS[thread_id]}")
        print(f"📊 Total active threads: {len(ACTIVE_THREADS)}")

        emit("thread_accepted", {"thread_id": thread_id}, to=owner_sid)
        emit("thread_accepted", {"thread_id": thread_id}, to=requester_sid)

    # -----------------------------
    # Join thread
    # -----------------------------
    @socketio.on("join_thread")
    def join_thread_evt(data):
        thread_id = data.get("thread_id")
        if thread_id:
            join_room(thread_id)
            print(f"👥 {request.sid} joined thread room: {thread_id}")
            print(f"📊 Thread {thread_id} now has users: {ACTIVE_THREADS.get(thread_id, 'not in ACTIVE_THREADS')}")

    # -----------------------------
    # Drawing relay
    # -----------------------------
    @socketio.on("draw")
    def draw(data):
        thread_id = data.get("thread_id")
        print(f"🎨 DRAW EVENT RECEIVED from {request.sid}")
        print(f"   Thread ID: {thread_id}")
        print(f"   Thread in ACTIVE_THREADS? {thread_id in ACTIVE_THREADS}")
        print(f"   Drawing data: fromX={data.get('fromX')}, fromY={data.get('fromY')}")
        
        if thread_id in ACTIVE_THREADS:
            print(f"✅ Relaying draw to thread room: {thread_id}")
            emit("draw", data, room=thread_id, include_self=False)
            print(f"✅ Draw event relayed")
        else:
            print(f"❌ Thread {thread_id} NOT in ACTIVE_THREADS!")
            print(f"   Active threads: {list(ACTIVE_THREADS.keys())}")

    # -----------------------------
    # Chat relay
    # -----------------------------
    @socketio.on("message")
    def message(data):
        thread_id = data.get("thread_id")
        if thread_id in ACTIVE_THREADS:
            emit("message", data, room=thread_id)

    # -----------------------------
    # Leave thread
    # -----------------------------
    @socketio.on("leave_thread")
    def leave_thread_evt(data):
        thread_id = data.get("thread_id")
        sid = request.sid

        if thread_id:
            leave_room(thread_id, sid=sid)
            print(f"👋 {sid} left thread room: {thread_id}")
            # DON'T remove from ACTIVE_THREADS here - only on disconnect
            # This allows reconnection if component remounts