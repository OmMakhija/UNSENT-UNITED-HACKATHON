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
  const [stars, setStars] = useState<StarMessage[]>([]);
  const [activeStar, setActiveStar] = useState<StarMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  // ⭐ stars created by THIS browser
  const myStarIds = useRef<Set<string>>(new Set());
  
  // 🆕 Track user's current star for connect requests
  const [myCurrentStarId, setMyCurrentStarId] = useState<string | null>(null);

  // 🔔 incoming request popup - UPDATED to accept full star object
  const [incomingRequest, setIncomingRequest] = useState<{
    request_id: string;
    requester_star: StarMessage | null;
  } | null>(null);

  /* ---------- SOCKET CONNECT ---------- */
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  /* ---------- LOAD STARS ---------- */
  useEffect(() => {
    const load = async () => {
      const data = await fetchStars();

      const mapped = data.map((s: any) => ({
        ...s,
        ...latLngToXY(s.lat, s.lng),
      }));

      setStars(mapped);
    };

    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, []);

  /* ---------- SOCKET EVENTS ---------- */
  useEffect(() => {
    socket.on("thread_request", (data: any) => {
      console.log("🔔 Received thread_request:", data);
      console.log("🔔 requester_star type:", typeof data.requester_star);
      console.log("🔔 requester_star value:", data.requester_star);
      setIncomingRequest(data);
    });

    socket.on("thread_accepted", (data: { thread_id: string }) => {
      console.log("✅ Thread accepted:", data);
      setIncomingRequest(null);
      setThreadId(data.thread_id);
    });

    socket.on("thread_declined", () => {
      console.log("❌ Thread declined");
      alert("Connection declined");
    });

    return () => {
      socket.off("thread_request");
      socket.off("thread_accepted");
      socket.off("thread_declined");
    };
  }, []);

  /* ---------- REQUEST THREAD - UPDATED ---------- */
  const requestThread = () => {
    if (!activeStar) return;

    // ❌ cannot request own star
    if (myStarIds.current.has(activeStar.id)) {
      alert("You cannot connect to your own star.");
      return;
    }

    // ❌ Must have created a star first
    if (!myCurrentStarId) {
      alert("You must create your own star before connecting with others.");
      return;
    }

    console.log("📤 Sending thread request:", {
      star_id: activeStar.id,
      requester_star_id: myCurrentStarId,
    });

    socket.emit("request_thread", {
      star_id: activeStar.id,              // Target star
      requester_star_id: myCurrentStarId,  // 🆕 YOUR star ID
    });

    // Close the star detail
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

      {/* STAR FIELD */}
      <div className={styles.starSpace}>
        {stars.map((s) => (
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

      {/* STAR CARD - ENHANCED 🆕 */}
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

            {/* 🆕 Emotion badge */}
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

            {/* 🆕 Enhanced message display */}
            <p style={{
              fontSize: '1.3rem',
              lineHeight: '1.8',
              marginBottom: '2rem',
              fontFamily: 'var(--font-hand)',
              color: '#fff'
            }}>
              "{activeStar.text}"
            </p>

            {/* 🆕 Enhanced connect button */}
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

            {/* 🆕 If it's their own star */}
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

      {/* 🔔 INCOMING REQUEST POPUP - UPDATED 🆕 */}
      {incomingRequest && (
        <ThreadRequestModal
          requesterStar={incomingRequest.requester_star}
          onAccept={() => {
            socket.emit("respond_thread", {
              request_id: incomingRequest.request_id,
              accepted: true,
            });
            setIncomingRequest(null);
          }}
          onReject={() => {
            socket.emit("respond_thread", {
              request_id: incomingRequest.request_id,
              accepted: false,
            });
            setIncomingRequest(null);
          }}
        />
      )}

      {/* KNOT SESSION */}
      {threadId && (
        <KnotSession
          threadId={threadId}
          onClose={() => setThreadId(null)}
        />
      )}

      {/* COMPOSE - UPDATED 🆕 */}
      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSubmit={async (d) => {
            const data = await submitUnsent(d.text);
            
            console.log("⭐ Star created:", data);

            myStarIds.current.add(data.id);
            setMyCurrentStarId(data.id);  // 🆕 Track current star
            
            socket.emit("register_star", { star_id: data.id });

            setComposeOpen(false);
          }}
        /> 
      )}
    </div>
  );
}