"use client";

import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { socket } from "@/lib/socket";

interface DrawingCanvasProps {
  active: boolean;
  color: string;
  threadId: string;
  className?: string;
  onInteract?: () => void;
  side: "left" | "right"; // 🆕 Which side of canvas this user can draw on
}

export interface DrawingCanvasRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

type Point = { x: number; y: number };

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ active, color, threadId, className, onInteract, side }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<Point | null>(null);

    /* ---------- IMPERATIVE API ---------- */
    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
      getCanvas: () => canvasRef.current,
    }));

    /* ---------- RESIZE (RETINA SAFE) ---------- */
    useEffect(() => {
      const resize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          
          // 🆕 Draw dividing line in the middle
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rect.width / 2, 0);
          ctx.lineTo(rect.width / 2, rect.height);
          ctx.stroke();
        }
      };

      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }, []);

    /* ---------- DRAW LINE ---------- */
    const drawLine = (from: Point, to: Point, strokeColor: string) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    };

    /* ---------- SOCKET: RECEIVE DRAW ---------- */
    useEffect(() => {
      console.log("🎨 DrawingCanvas: Setting up draw listener for thread:", threadId);
      console.log("🎨 My side:", side);
      
      const handleRemoteDraw = (data: any) => {
        console.log("📥 RECEIVED DRAW EVENT:", {
          threadId: data.thread_id,
          myThreadId: threadId,
          fromX: data.fromX,
          fromY: data.fromY,
          toX: data.toX,
          toY: data.toY,
          color: data.color,
          matches: data.thread_id === threadId
        });
        
        if (data.thread_id !== threadId) {
          console.log("❌ Thread ID mismatch, ignoring");
          return;
        }

        console.log("✅ Drawing remote line on canvas");
        drawLine(
          { x: data.fromX, y: data.fromY },
          { x: data.toX, y: data.toY },
          data.color
        );
      };

      socket.on("draw", handleRemoteDraw);
      
      return () => {
        console.log("🔇 Removing draw listener");
        socket.off("draw", handleRemoteDraw);
      };
    }, [threadId]);

    /* ---------- POINTER UTILS ---------- */
    const getPos = (
      e: React.MouseEvent | React.TouchEvent
    ): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();

      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }

      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    };

    // 🆕 Check if point is on user's allowed side
    const isOnMySide = (point: Point): boolean => {
      const canvas = canvasRef.current;
      if (!canvas) return false;

      const rect = canvas.getBoundingClientRect();
      const midpoint = rect.width / 2;

      if (side === "left") {
        return point.x < midpoint;
      } else {
        return point.x >= midpoint;
      }
    };

    const startDrawing = (
      e: React.MouseEvent | React.TouchEvent
    ) => {
      if (!active || !socket.connected) return;
      
      const pos = getPos(e);
      
      // 🆕 Only allow drawing on user's side
      if (!isOnMySide(pos)) return;
      
      isDrawing.current = true;
      lastPos.current = pos;
      onInteract?.();
    };

    const draw = (
      e: React.MouseEvent | React.TouchEvent
    ) => {
      if (!isDrawing.current || !active || !lastPos.current) return;

      const currentPos = getPos(e);
      
      // 🆕 Stop drawing if cursor crosses to other side
      if (!isOnMySide(currentPos)) {
        console.log("⚠️ Crossed to other side, stopping");
        stopDrawing();
        return;
      }

      const from = lastPos.current;
      const to = currentPos;

      // Draw locally
      drawLine(from, to, color);
      console.log("🖌️ Drawing locally:", { from, to, color });

      // Emit to other participant
      const drawData = {
        thread_id: threadId,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        color,
      };
      
      console.log("📤 EMITTING DRAW EVENT:", drawData);
      socket.emit("draw", drawData);

      lastPos.current = currentPos;
    };

    const stopDrawing = () => {
      isDrawing.current = false;
      lastPos.current = null;
    };

    return (
      <canvas
        ref={canvasRef}
        className={className}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ cursor: active ? 'crosshair' : 'default' }}
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
export default DrawingCanvas;