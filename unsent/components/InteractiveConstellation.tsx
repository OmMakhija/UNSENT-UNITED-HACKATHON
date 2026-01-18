"use client";

import { useState, useEffect, useRef } from "react";
import { Message, EMOTION_COLORS, EMOTION_GLOWS } from "@/data/messages";
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
  messages?: Message[]; // optional, not used yet
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
  const [hoveredStar, setHoveredStar] = useState<StarMessage | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Client ID (unique per tab)
  const clientId = useRef(getClientId());

  // Stars created by THIS tab
  const myStarIds = useRef<Set<string>>(new Set());

  // Track user's current star for connect requests
  const [myCurrentStarId, setMyCurrentStarId] = useState<string | null>(null);

  // Track active (online) stars
  const [activeStarIds, setActiveStarIds] = useState<Set<string>>(new Set());

  const hasRegisteredStars = useRef(false);
  const [userRole, setUserRole] =
    useState<"requester" | "receiver" | null>(null);

  const [incomingRequest, setIncomingRequest] = useState<{
    request_id: string;
    requester_star: StarMessage | null;
  } | null>(null);

  /* ---------- SOCKET CONNECT ---------- */
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      socket.emit("get_active_stars");
    };

    socket.on("connect", handleConnect);

    if (socket.connected) socket.emit("get_active_stars");

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

      if (!hasRegisteredStars.current && socket.connected) {
        const storageKey = `myCurrentStarId_${clientId.current}`;
        const storedStarId = sessionStorage.getItem(storageKey);

        if (storedStarId) {
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
    socket.on("active_stars", (d: { star_ids: string[] }) =>
      setActiveStarIds(new Set(d.star_ids))
    );

    socket.on("star_online", (d: { star_id: string }) =>
      setActiveStarIds((p) => new Set([...p, d.star_id]))
    );

    socket.on("stars_offline", (d: { star_ids: string[] }) => {
      setActiveStarIds((p) => {
        const n = new Set(p);
        d.star_ids.forEach((id) => n.delete(id));
        return n;
      });
      if (activeStar && d.star_ids.includes(activeStar.id)) {
        setActiveStar(null);
      }
    });

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
  }, [activeStar]);

  /* ---------- FILTER VISIBLE STARS ---------- */
  const visibleStars = allStars.filter((s) => activeStarIds.has(s.id));

  /* ---------- REQUEST THREAD ---------- */
  const requestThread = () => {
    if (!activeStar) return;
    if (myStarIds.current.has(activeStar.id)) return;
    if (!myCurrentStarId) return;

    socket.emit("request_thread", {
      star_id: activeStar.id,
      requester_star_id: myCurrentStarId,
    });

    setUserRole("requester");
    setActiveStar(null);
  };

  /* ---------- RENDER ---------- */
  return (
    <div className={styles.wrapper}>
      {/* unchanged render tree */}
    </div>
  );
}
