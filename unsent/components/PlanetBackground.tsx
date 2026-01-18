"use client";

import React from 'react';

export default function PlanetBackground() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: '#040408', // Deep space black/purple
                overflow: 'hidden',
                pointerEvents: 'none'
            }}
        >
            {/* Stars Layer */}
            <div className="stars" />

            {/* The Planet Container */}
            <div className="planet-container">
                <div className="planet-surface" />
                <div className="planet-lighting" />
            </div>

            {/* Atmospheric Glow */}
            <div className="atmosphere" />

            <style jsx>{`
        .stars {
            position: absolute;
            inset: 0;
            background-image: 
                radial-gradient(1px 1px at 10% 10%, white, transparent), 
                radial-gradient(1px 1px at 20% 30%, white, transparent), 
                radial-gradient(2px 2px at 40% 70%, rgba(255, 255, 255, 0.5), transparent), 
                radial-gradient(1px 1px at 90% 40%, white, transparent),
                radial-gradient(1.5px 1.5px at 50% 80%, white, transparent);
            background-size: 550px 550px;
            opacity: 0.4;
            animation: twinkle 8s infinite alternate;
        }

        .planet-container {
            position: absolute;
            top: 50%;
            right: -10vh;
            width: 85vh;
            height: 85vh;
            border-radius: 50%;
            transform: translateY(-50%);
            z-index: 1;
        }

        .planet-surface {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            /* Complex gradient to simulate a planet surface texture */
            background: 
                radial-gradient(circle at 30% 30%, rgba(138, 43, 226, 0.2) 0%, transparent 40%),
                conic-gradient(from 0deg, #000 0%, #1a0b2e 30%, #2d1b4e 50%, #1a0b2e 70%, #000 100%);
            background-size: 200% 200%;
            filter: contrast(1.2);
            animation: rotateSurface 60s linear infinite;
        }

        .planet-lighting {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            /* Fixed lighting layer - shadows do NOT rotate */
            box-shadow: 
                inset 8px 8px 30px rgba(255, 255, 255, 0.4), /* Sharp rim light */
                inset 30px 30px 80px rgba(138, 43, 226, 0.6), /* Purple inner glow */
                inset 60px 60px 100px rgba(90, 0, 180, 0.4), /* Deeper violet */
                -20px -20px 60px rgba(138, 43, 226, 0.2); /* Outer glow */
            /* Add pulse to the lighting/glow */
            animation: pulseGlow 8s ease-in-out infinite alternate;
        }

        .atmosphere {
            position: absolute;
            top: 50%;
            right: -10vh;
            width: 86vh;
            height: 86vh;
            border-radius: 50%;
            transform: translateY(-50%);
            background: transparent;
            box-shadow: -40px -40px 100px rgba(120, 40, 255, 0.15);
            z-index: 0;
            filter: blur(20px);
            animation: pulseAtmosphere 10s ease-in-out infinite alternate;
        }

        @keyframes rotateSurface {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes pulseGlow {
            0% { box-shadow: inset 8px 8px 30px rgba(255, 255, 255, 0.4), inset 30px 30px 80px rgba(138, 43, 226, 0.6), inset 60px 60px 100px rgba(90, 0, 180, 0.4), -20px -20px 60px rgba(138, 43, 226, 0.2); }
            100% { box-shadow: inset 8px 8px 40px rgba(255, 255, 255, 0.6), inset 30px 30px 100px rgba(160, 80, 255, 0.8), inset 60px 60px 120px rgba(110, 0, 220, 0.5), -25px -25px 80px rgba(160, 60, 255, 0.4); }
        }

        @keyframes pulseAtmosphere {
            0% { box-shadow: -40px -40px 100px rgba(120, 40, 255, 0.15); opacity: 0.8; }
            100% { box-shadow: -50px -50px 140px rgba(140, 60, 255, 0.3); opacity: 1; }
        }

        @keyframes twinkle {
            0% { opacity: 0.3; }
            100% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
            .planet-container {
                width: 50vh;
                height: 50vh;
                right: -15vh;
                top: 30%;
            }
            .atmosphere {
                width: 51vh;
                height: 51vh;
                right: -15vh;
                top: 30%;
            }
        }
      `}</style>
        </div>
    );
}
