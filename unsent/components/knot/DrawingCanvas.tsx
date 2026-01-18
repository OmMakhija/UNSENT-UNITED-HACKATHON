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
}

export interface DrawingCanvasRef {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

type Point = { x: number; y: number };

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ active, color, threadId, className, onInteract }, ref) => {
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
      const handleRemoteDraw = (data: any) => {
        if (data.thread_id !== threadId) return;

        drawLine(
          { x: data.fromX, y: data.fromY },
          { x: data.toX, y: data.toY },
          data.color
        );
      };

      socket.on("draw", handleRemoteDraw);
      return () => {
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

    const startDrawing = (
      e: React.MouseEvent | React.TouchEvent
    ) => {
      if (!active || !socket.connected) return;
      isDrawing.current = true;
      lastPos.current = getPos(e);
      onInteract?.();
    };

    const draw = (
      e: React.MouseEvent | React.TouchEvent
    ) => {
      if (!isDrawing.current || !active || !lastPos.current) return;

      const currentPos = getPos(e);
      const from = lastPos.current;
      const to = currentPos;

      // Draw locally
      drawLine(from, to, color);

      // Emit to other participant
      socket.emit("draw", {
        thread_id: threadId,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        color,
      });

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
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
export default DrawingCanvas;
