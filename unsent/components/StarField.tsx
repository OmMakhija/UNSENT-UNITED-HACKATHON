"use client";

import React, { useEffect, useRef } from "react";

interface Star {
    x: number;
    y: number;
    z: number; // Depth for parallax
    size: number;
    opacity: number;
    speed: number;
}

export default function StarField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Set canvas size
        const setSize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        setSize();

        const stars: Star[] = [];
        const numStars = 400;

        // Initialize stars
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z: Math.random() * 2 + 0.5,
                size: Math.random() * 1.5,
                opacity: Math.random() * 0.8 + 0.2, // Min opacity 0.2
                speed: Math.random() * 0.05 + 0.02,
            });
        }

        let animationFrameId: number;

        const render = () => {
            // Clear with slight transparency for trail effect? No, just clear.
            ctx.clearRect(0, 0, width, height);

            stars.forEach((star) => {
                // Float logic
                star.y -= star.speed * star.z;

                // Mouse parallax could be added here later

                // Wrap around
                if (star.y < 0) {
                    star.y = height;
                    star.x = Math.random() * width;
                }

                // Draw star
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.beginPath();
                // Brightness variation based on z-index could be cool
                ctx.arc(star.x, star.y, star.size * (star.z * 0.5), 0, Math.PI * 2);
                ctx.fill();

                // Optional: Twinkle (randomly adjust opacity slightly)
                if (Math.random() > 0.99) {
                    star.opacity = Math.random() * 0.8 + 0.2;
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener("resize", setSize);
        render();

        return () => {
            window.removeEventListener("resize", setSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="star-field"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -1,
                pointerEvents: "none", // Allow clicks to pass through
            }}
        />
    );
}
