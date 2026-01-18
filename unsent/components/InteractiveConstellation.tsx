"use client";

import { useState, useEffect, useRef } from "react";
import { Message, EMOTION_COLORS } from "@/data/messages";
import { PenTool, X } from "lucide-react";
import styles from "./InteractiveConstellation.module.css";

import ComposeModal from "./ComposeModal";
import KnotSession from "./knot/KnotSession";
import ThreadRequestModal from "./ThreadRequestModal";

import { fetchStars, submitUnsent } from "@/lib/api";
import { socket } from "@/lib/socket";
import { getClientId } from "@/lib/clientId";

/* ---------- PROPS ---------- */
interface InteractiveConstellationProps {
  messages?: Message[];
}

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

export default function InteractiveConstellation(
  _props: InteractiveConstellationProps
) {
  const [allStars, setAllStars] = useState<StarMessage[]>([]);
  const [activeStar, setActiveStar] = useState<StarMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const clientId = useRef(getClientId());
  const myStarIds = useRef<Set<string>>(new Set());
  const [myCurrentStarId, setMyCurrentStarId] = useState<string | null>(null);
  const [activeStarIds, setActiveStarIds] = useState<Set<string>>(new Set());

  const [incomingRequest, setIncomingRequest] = useState<{
    request_id: string;
    requester_star: StarMessage | null;
  } | null>(null);

  const [userRole, setUserRole] =
    useState<"requester" | "receiver" | null>(null);

  /* ---------- SOCKET CONNECT ---------- */
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("connect", () => {
      socket.emit("get_active_stars");
    });

    return () => {
      socket.off("connect");
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

      const storageKey = `myCurrentStarId_${clientId.current}`;
      const storedStarId = sessionStorage.getItem(storageKey);

      if (storedStarId && socket.connected) {
        myStarIds.current.add(storedStarId);
        setMyCurrentStarId(storedStarId);
        socket.emit("register_star", { star_id: storedStarId });
      }
    };

    load();
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, []);

  /* ---------- SOCKET EVENTS ---------- */
  useEffect(() => {
    socket.on("active_stars", (d: { star_ids: string[] }) =>
      setActiveStarIds(new Set(d.star_ids))
    );

    socket.on("star_online", (d: { star_id: string }) =>
      setActiveStarIds((p) => new Set([...p, d.star_id]))
    );

    socket.on("stars_offline", (d: { star_ids: string[] }) =>
      setActiveStarIds((p) => {
        const n = new Set(p);
        d.star_ids.forEach((id) => n.delete(id));
        return n;
      })
    );

    socket.on("thread_request", setIncomingRequest);

    socket.on("thread_accepted", (d: { thread_id: string }) => {
      setIncomingRequest(null);
      setThreadId(d.thread_id);
    });

    socket.on("thread_declined", () => alert("Connection declined"));

    return () => {
      socket.off("active_stars");
      socket.off("star_online");
      socket.off("stars_offline");
      socket.off("thread_request");
      socket.off("thread_accepted");
      socket.off("thread_declined");
    };
  }, []);

  /* ---------- FILTER VISIBLE STARS ---------- */
  const visibleStars = allStars.filter((s) => activeStarIds.has(s.id));

  /* ---------- RENDER ---------- */
  return (
    <div className={styles.wrapper}>
      {/* NAV / CREATE STAR */}
      <div
        className={styles.nav}
        style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}
      >
        <button
          className={styles.navItemPrimary}
          onClick={() => setComposeOpen(true)}
        >
          <PenTool size={20} />
        </button>
      </div>

      {/* STAR FIELD */}
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

      {/* STAR MODAL */}
      {activeStar && (
        <div className={styles.overlay} onClick={() => setActiveStar(null)}>
          <div className={styles.card} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveStar(null)}>
              <X />
            </button>
            <p>"{activeStar.text}"</p>

            {!myStarIds.current.has(activeStar.id) && myCurrentStarId && (
              <button
                onClick={() => {
                  socket.emit("request_thread", {
                    star_id: activeStar.id,
                    requester_star_id: myCurrentStarId,
                  });
                  setUserRole("requester");
                  setActiveStar(null);
                }}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      )}

      {/* COMPOSE */}
      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSubmit={async (d) => {
            const data = await submitUnsent(d.text);
            myStarIds.current.add(data.id);
            setMyCurrentStarId(data.id);
            sessionStorage.setItem(
              `myCurrentStarId_${clientId.current}`,
              data.id
            );
            socket.emit("register_star", { star_id: data.id });
            setComposeOpen(false);
          }}
        />
      )}

      {/* THREAD */}
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

      {/* INCOMING REQUEST */}
      {incomingRequest && (
        <ThreadRequestModal
          requesterStar={incomingRequest.requester_star}
          onAccept={() => {
            socket.emit("respond_thread", {
              request_id: incomingRequest.request_id,
              accepted: true,
            });
            setUserRole("receiver");
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
    </div>
  );
}
