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

    @socketio.on("disconnect")
    def on_disconnect():
        sid = request.sid
        ACTIVE_USERS.discard(sid)

        # Remove stars owned by this user
        for star_id, owner_sid in list(STAR_OWNERS.items()):
            if owner_sid == sid:
                del STAR_OWNERS[star_id]
                emit("star_offline", {"star_id": star_id}, broadcast=True)

        # Cleanup pending requests
        for rid, req in list(PENDING_REQUESTS.items()):
            if req["requester_sid"] == sid or req["owner_sid"] == sid:
                del PENDING_REQUESTS[rid]

        # Leave threads
        for thread_id, users in list(ACTIVE_THREADS.items()):
            if sid in users:
                users.remove(sid)
                leave_room(thread_id, sid=sid)
            if not users:
                del ACTIVE_THREADS[thread_id]

    # -----------------------------
    # Register star ownership
    # -----------------------------
    @socketio.on("register_star")
    def register_star(data):
        star_id = data.get("star_id")
        if not star_id:
            return

        STAR_OWNERS[star_id] = request.sid

    # -----------------------------
    # Request thread - UPDATED
    # -----------------------------
    @socketio.on("request_thread")
    def request_thread(data):
        target_star_id = data.get("star_id")           # Star they want to connect to
        requester_star_id = data.get("requester_star_id")  # Their own star ID

        if not target_star_id or target_star_id not in STAR_OWNERS:
            emit("thread_unavailable")
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
            
            emit(
                "thread_request",
                {
                    "request_id": request_id,
                    "requester_star": requester_star.data,  # Send full star object
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
            emit("thread_declined", to=requester_sid)
            return

        thread_id = str(uuid.uuid4())
        ACTIVE_THREADS[thread_id] = {owner_sid, requester_sid}

        join_room(thread_id, sid=owner_sid)
        join_room(thread_id, sid=requester_sid)

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

    # -----------------------------
    # Drawing relay
    # -----------------------------
    @socketio.on("draw")
    def draw(data):
        thread_id = data.get("thread_id")
        if thread_id in ACTIVE_THREADS:
            emit("draw", data, room=thread_id, include_self=False)

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

        if thread_id in ACTIVE_THREADS:
            ACTIVE_THREADS[thread_id].discard(sid)
            leave_room(thread_id, sid=sid)

            if not ACTIVE_THREADS[thread_id]:
                del ACTIVE_THREADS[thread_id]