"use client";

import React, { useEffect, useRef } from 'react';

export default function GalaxyBackground() {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                background: '#090011',
                overflow: 'hidden',
                pointerEvents: 'none'
            }}
        >
            <div className="galaxy-container">
                <div className="galaxy-spiral"></div>
                <div className="galaxy-core"></div>
                <div className="stars"></div>
            </div>
            <style jsx>{`
        .galaxy-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200vmax;
          height: 200vmax;
          transform: translate(-50%, -50%) perspective(1000px) rotateX(60deg);
          animation: rotateGalaxy 120s linear infinite;
        }

        .galaxy-core {
           position: absolute;
           top: 50%;
           left: 50%;
           transform: translate(-50%, -50%);
           width: 20vw;
           height: 20vw;
           background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,220,100,0.8) 20%, rgba(200,100,200,0.5) 40%, transparent 70%);
           border-radius: 50%;
           box-shadow: 0 0 100px 50px rgba(180, 100, 255, 0.4);
           z-index: 10;
        }

        .galaxy-spiral {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: 
            repeating-conic-gradient(
              from 0deg,
              transparent 0deg,
              rgba(138, 43, 226, 0.1) 10deg,
              rgba(75, 0, 130, 0.3) 20deg,
              rgba(218, 112, 214, 0.2) 30deg,
              transparent 40deg,
              transparent 180deg
            );
          border-radius: 50%;
          filter: blur(8px);
          mix-blend-mode: screen;
        }

        /* Create some twinkling stars */
        .stars {
            background-image: 
                radial-gradient(1px 1px at 10% 10%, white, transparent), 
                radial-gradient(1px 1px at 20% 30%, white, transparent), 
                radial-gradient(2px 2px at 40% 70%, white, transparent), 
                radial-gradient(1px 1px at 90% 40%, white, transparent),
                radial-gradient(2px 2px at 50% 80%, white, transparent);
            background-size: 550px 550px;
            width: 100%;
            height: 100%;
            opacity: 0.6;
            animation: twinkle 5s infinite;
        }

        @keyframes rotateGalaxy {
          from { transform: translate(-50%, -50%) perspective(1000px) rotateX(60deg) rotateZ(0deg); }
          to { transform: translate(-50%, -50%) perspective(1000px) rotateX(60deg) rotateZ(360deg); }
        }

        @keyframes twinkle {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.8; }
        }
      `}</style>
        </div>
    );
}
