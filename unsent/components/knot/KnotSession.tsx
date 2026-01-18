"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./knot.module.css";
import { X, Download, Paintbrush, Trash2 } from "lucide-react";
import DrawingCanvas, { DrawingCanvasRef } from "./DrawingCanvas";
import KnotChat from "./KnotChat";
import { socket } from "@/lib/socket";

const PREDEFINED_COLORS = [
  "#ffffff",
  "#4ECDC4",
  "#F4D03F",
  "#E8B4C8",
  "#B8A1D6",
];

interface KnotSessionProps {
  threadId: string;
  onClose: () => void;
}

export default function KnotSession({
  threadId,
  onClose,
}: KnotSessionProps) {
  const [timeLeft, setTimeLeft] = useState(263);
  const [sessionState, setSessionState] = useState<
    "active" | "merging" | "finished"
  >("active");
  const [activeColor, setActiveColor] = useState("#ffffff");

  const canvasRef = useRef<DrawingCanvasRef>(null);

  /* ---------- JOIN / LEAVE THREAD ---------- */
  useEffect(() => {
    if (!socket.connected) return;

    socket.emit("join_thread", { thread_id: threadId });

    return () => {
      socket.emit("leave_thread", { thread_id: threadId });
    };
  }, [threadId]);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (sessionState !== "active") return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSessionState("merging");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState]);

  /* ---------- MERGE TRANSITION ---------- */
  useEffect(() => {
    if (sessionState === "merging") {
      const timeout = setTimeout(
        () => setSessionState("finished"),
        2000
      );
      return () => clearTimeout(timeout);
    }
  }, [sessionState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    alert("This would download the merged artwork.");
  };

  return (
    <div className={styles.knotOverlay}>
      {/* ---------- TOP BAR ---------- */}
      <div className={styles.topBar}>
        <div className={styles.timer}>
          <span>⏱️</span>
          <span>{formatTime(timeLeft)} remaining</span>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span>🌐 Two souls connected</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              opacity: 0.5,
              cursor: "pointer",
            }}
          >
            <X />
          </button>
        </div>
      </div>

      {/* ---------- MAIN CONTENT ---------- */}
      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        {/* ---------- TOOLS ---------- */}
        {sessionState === "active" && (
          <div className={styles.tools}>
            <button className={styles.toolBtnActive}>
              <Paintbrush size={20} />
            </button>

            {PREDEFINED_COLORS.map((c) => (
              <button
                key={c}
                className={styles.toolBtn}
                style={{
                  background: c,
                  width: "20px",
                  height: "20px",
                  border:
                    activeColor === c ? "2px solid #fff" : "none",
                }}
                onClick={() => setActiveColor(c)}
              />
            ))}

            <div
              style={{
                height: "1px",
                background: "rgba(255,255,255,0.1)",
                margin: "0.5rem 0",
              }}
            />

            <button
              className={styles.toolBtn}
              onClick={() => canvasRef.current?.clear()}
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}

        {/* ---------- SHARED CANVAS ---------- */}
        <div
          className={styles.canvasArea}
          style={{ opacity: sessionState === "active" ? 1 : 0 }}
        >
          <div className={styles.canvasContainer}>
            <span className={styles.canvasLabel}>Shared Space</span>
            <DrawingCanvas
              ref={canvasRef}
              active={sessionState === "active"}
              color={activeColor}
              threadId={threadId}
              className={styles.drawingCanvas}
            />
          </div>
        </div>

        {/* ---------- FINISHED STATE ---------- */}
        {sessionState !== "active" && (
          <div className={styles.mergedContainer}>
            <div className={styles.mergedArtwork}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(45deg, rgba(78,205,196,0.1), rgba(184,161,214,0.1))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "4rem", opacity: 0.5 }}>
                  ∞
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "3rem",
                textAlign: "center",
                animation: "fadeIn 3s ease",
              }}
            >
              <h2 style={{ fontSize: "2rem" }}>
                This moment existed.
              </h2>
              <p style={{ fontSize: "1.5rem", opacity: 0.8 }}>
                Let it go with gratitude.
              </p>

              <button
                onClick={handleDownload}
                style={{
                  padding: "1rem 2rem",
                  background: "white",
                  color: "#000",
                  borderRadius: "30px",
                  fontWeight: 700,
                  marginTop: "1rem",
                }}
              >
                <Download size={18} /> Download your Knot
              </button>

              <button
                onClick={onClose}
                style={{
                  marginTop: "2rem",
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "underline",
                }}
              >
                Return to Constellation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- CHAT ---------- */}
      {sessionState === "active" && <KnotChat isActive={true} />}
    </div>
  );
}
