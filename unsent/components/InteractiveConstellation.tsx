"use client";

import { useState, useEffect, useRef } from "react";
import { Message, EMOTION_COLORS, EMOTION_GLOWS } from "@/data/messages";
import { Globe, PenTool, BarChart3, Palette, X } from "lucide-react";
import styles from "./InteractiveConstellation.module.css";

import ComposeModal from "./ComposeModal";
import KnotSession from "./knot/KnotSession";
import ThreadRequestModal from "./ThreadRequestModal";

import { fetchStars, submitUnsent } from "@/lib/api";
import { socket } from "@/lib/socket";
import { getClientId } from "@/lib/clientId";

/* ---------- TYPES ---------- */
type StarMessage = Message & {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
};

/* ---------- GEO → CANVAS ---------- */
function latLngToXY(lat: number, lng: number) {
  return {
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  };
}

export default function InteractiveConstellation() {
  const [allStars, setAllStars] = useState<StarMessage[]>([]);
  const [activeStar, setActiveStar] = useState<StarMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Client ID (unique per tab)
  const clientId = useRef(getClientId());

  // Stars created by THIS tab
  const myStarIds = useRef<Set<string>>(new Set());
  
  // Track user's current star for connect requests
  const [myCurrentStarId, setMyCurrentStarId] = useState<string | null>(null);

  // 🆕 Track which stars are from active (online) users
  const [activeStarIds, setActiveStarIds] = useState<Set<string>>(new Set());
  
  // Track if we've registered our stored star
  const hasRegisteredStars = useRef(false);

  // 🆕 Track user role in thread (who initiated connection)
  const [userRole, setUserRole] = useState<"requester" | "receiver" | null>(null);

  // Incoming request popup
  const [incomingRequest, setIncomingRequest] = useState<{
    request_id: string;
    requester_star: StarMessage | null;
  } | null>(null);

  /* ---------- SOCKET CONNECT ---------- */
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("✅ Socket connected");
      // Request list of active stars
      socket.emit("get_active_stars");
    };

    socket.on("connect", handleConnect);

    // If already connected, request now
    if (socket.connected) {
      socket.emit("get_active_stars");
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  /* ---------- LOAD STARS ---------- */
  useEffect(() => {
    const load = async () => {
      const data = await fetchStars();

      const mapped = data.map((s: any) => ({
        ...s,
        ...latLngToXY(s.lat, s.lng),
      }));

      setAllStars(mapped);
      
      // Auto-register stored star if exists
      if (!hasRegisteredStars.current && socket.connected) {
        const storageKey = `myCurrentStarId_${clientId.current}`;
        const storedStarId = sessionStorage.getItem(storageKey);
        
        if (storedStarId) {
          console.log("🔄 Auto-registering stored star:", storedStarId.slice(0, 12));
          myStarIds.current.add(storedStarId);
          setMyCurrentStarId(storedStarId);
          socket.emit("register_star", { star_id: storedStarId });
          hasRegisteredStars.current = true;
        }
      }
    };

    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, []);

  /* ---------- SOCKET EVENTS ---------- */
  useEffect(() => {
    // 🆕 Handle active stars list
    const handleActiveStars = (data: { star_ids: string[] }) => {
      console.log("📋 Received active stars:", data.star_ids.length);
      setActiveStarIds(new Set(data.star_ids));
    };

    // 🆕 Handle star coming online
    const handleStarOnline = (data: { star_id: string }) => {
      console.log("⭐ Star came online:", data.star_id.slice(0, 12));
      setActiveStarIds(prev => new Set([...prev, data.star_id]));
    };

    // 🆕 Handle stars going offline
    const handleStarsOffline = (data: { star_ids: string[] }) => {
      console.log("💫 Stars went offline:", data.star_ids.length);
      setActiveStarIds(prev => {
        const newSet = new Set(prev);
        data.star_ids.forEach(id => newSet.delete(id));
        return newSet;
      });
      
      // Close star detail if it went offline
      if (activeStar && data.star_ids.includes(activeStar.id)) {
        setActiveStar(null);
      }
    };

    const handleThreadRequest = (data: any) => {
      console.log("🔔 Received thread_request:", data);
      setIncomingRequest(data);
    };

    const handleThreadAccepted = (data: { thread_id: string }) => {
      console.log("✅ Thread accepted:", data);
      setIncomingRequest(null);
      setThreadId(data.thread_id);
    };

    const handleThreadDeclined = () => {
      console.log("❌ Thread declined");
      alert("Connection declined");
    };

    // Register all handlers
    socket.on("active_stars", handleActiveStars);
    socket.on("star_online", handleStarOnline);
    socket.on("stars_offline", handleStarsOffline);
    socket.on("thread_request", handleThreadRequest);
    socket.on("thread_accepted", handleThreadAccepted);
    socket.on("thread_declined", handleThreadDeclined);

    return () => {
      socket.off("active_stars", handleActiveStars);
      socket.off("star_online", handleStarOnline);
      socket.off("stars_offline", handleStarsOffline);
      socket.off("thread_request", handleThreadRequest);
      socket.off("thread_accepted", handleThreadAccepted);
      socket.off("thread_declined", handleThreadDeclined);
    };
  }, [activeStar]);

  /* ---------- FILTER VISIBLE STARS - 🆕 ---------- */
  // Show all stars that are from active (online) users
  // Including your own stars - you just can't connect to them
  const visibleStars = allStars.filter(star => {
    return activeStarIds.has(star.id);
  });

  /* ---------- REQUEST THREAD ---------- */
  const requestThread = () => {
    if (!activeStar) return;

    // Cannot request own star
    if (myStarIds.current.has(activeStar.id)) {
      alert("You cannot connect to your own star.");
      return;
    }

    // Must have created a star first
    if (!myCurrentStarId) {
      alert("You must create your own star before connecting with others.");
      return;
    }

    // Check if star is still active
    if (!activeStarIds.has(activeStar.id)) {
      alert("This star is no longer available.");
      setActiveStar(null);
      return;
    }

    console.log("📤 Sending thread request:", {
      star_id: activeStar.id,
      requester_star_id: myCurrentStarId,
    });

    socket.emit("request_thread", {
      star_id: activeStar.id,
      requester_star_id: myCurrentStarId,
    });

    // 🆕 Mark self as requester
    setUserRole("requester");

    setActiveStar(null);
  };

  return (
    <div className={styles.wrapper}>
      {/* NAV */}
      <div className={styles.nav}>
        <button className={styles.navItem}><Globe size={20} /></button>
        <button className={styles.navItem}><Palette size={20} /></button>
        <button className={styles.navItem}><BarChart3 size={20} /></button>
        <button
          className={styles.navItemPrimary}
          onClick={() => setComposeOpen(true)}
        >
          <PenTool size={20} />
        </button>
      </div>

      {/* STAR FIELD - 🆕 Uses visibleStars instead of stars */}
      <div className={styles.starSpace}>
        {visibleStars.map((s) => (
          <button
            key={s.id}
            className={styles.starWrapper}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              "--star-color": EMOTION_COLORS[s.emotion],
            } as React.CSSProperties}
            onClick={() => setActiveStar(s)}
          >
            <div className={styles.star} />
          </button>
        ))}
      </div>

      {/* STAR CARD */}
      {activeStar && (
        <div className={styles.overlay} onClick={() => setActiveStar(null)}>
          <div 
            className={styles.card} 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              background: `linear-gradient(180deg, rgba(20,20,30,0.95) 0%, ${EMOTION_COLORS[activeStar.emotion]}10 100%)`,
              border: `1px solid ${EMOTION_COLORS[activeStar.emotion]}40`,
              boxShadow: EMOTION_GLOWS[activeStar.emotion],
              padding: '2rem'
            }}
          >
            <button className={styles.closeBtn} onClick={() => setActiveStar(null)}>
              <X />
            </button>

            {/* Emotion badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: `${EMOTION_COLORS[activeStar.emotion]}20`,
              borderRadius: '20px',
              marginBottom: '1.5rem',
              border: `1px solid ${EMOTION_COLORS[activeStar.emotion]}40`
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: EMOTION_COLORS[activeStar.emotion],
                boxShadow: `0 0 10px ${EMOTION_COLORS[activeStar.emotion]}`
              }} />
              <span style={{ 
                textTransform: 'capitalize',
                fontSize: '0.9rem',
                color: EMOTION_COLORS[activeStar.emotion]
              }}>
                {activeStar.emotion}
              </span>
            </div>

            {/* Message text */}
            <p style={{
              fontSize: '1.3rem',
              lineHeight: '1.8',
              marginBottom: '2rem',
              fontFamily: 'var(--font-hand)',
              color: '#fff'
            }}>
              "{activeStar.text}"
            </p>

            {/* Connect button */}
            {!myStarIds.current.has(activeStar.id) && (
              <button 
                className={styles.actionBtn} 
                onClick={requestThread}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: EMOTION_COLORS[activeStar.emotion],
                  border: 'none',
                  borderRadius: '12px',
                  color: '#0a0e27',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 0 20px ${EMOTION_COLORS[activeStar.emotion]}60`
                }}
              >
                Connect with this soul
              </button>
            )}

            {/* Own star message */}
            {myStarIds.current.has(activeStar.id) && (
              <p style={{
                textAlign: 'center',
                opacity: 0.6,
                fontStyle: 'italic',
                fontSize: '0.9rem'
              }}>
                This is your star — others can see it, but you cannot connect to yourself.
              </p>
            )}
          </div>
        </div>
      )}

      {/* INCOMING REQUEST POPUP */}
      {incomingRequest && (
        <ThreadRequestModal
          requesterStar={incomingRequest.requester_star}
          onAccept={() => {
            console.log("✅ Accept button clicked!");
            console.log("📤 Sending respond_thread with:", {
              request_id: incomingRequest.request_id,
              accepted: true,
            });
            
            socket.emit("respond_thread", {
              request_id: incomingRequest.request_id,
              accepted: true,
            });
            
            // 🆕 Mark self as receiver
            setUserRole("receiver");
            
            console.log("✅ respond_thread emitted, closing popup");
            setIncomingRequest(null);
          }}
          onReject={() => {
            console.log("❌ Reject button clicked!");
            socket.emit("respond_thread", {
              request_id: incomingRequest.request_id,
              accepted: false,
            });
            setIncomingRequest(null);
          }}
        />
      )}

      {/* KNOT SESSION */}
      {threadId && userRole && (
        <KnotSession
          threadId={threadId}
          userRole={userRole}
          onClose={() => {
            setThreadId(null);
            setUserRole(null);
          }}
        />
      )}

      {/* COMPOSE */}
      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSubmit={async (d) => {
            const data = await submitUnsent(d.text);
            
            console.log("⭐ Star created:", data.id);

            myStarIds.current.add(data.id);
            setMyCurrentStarId(data.id);
            
            // 🆕 Store in sessionStorage (unique per tab)
            const storageKey = `myCurrentStarId_${clientId.current}`;
            sessionStorage.setItem(storageKey, data.id);
            
            socket.emit("register_star", { star_id: data.id });

            setComposeOpen(false);
          }}
        /> 
      )}
    </div>
  );
}