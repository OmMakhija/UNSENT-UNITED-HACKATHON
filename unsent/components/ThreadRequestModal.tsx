"use client";

import { Message, EMOTION_COLORS } from "@/data/messages";

interface Props {
  requesterStar: Message | null;
  onAccept: () => void;
  onReject: () => void;
}

export default function ThreadRequestModal({
  requesterStar,
  onAccept,
  onReject,
}: Props) {
  console.log("🎨 ThreadRequestModal rendering", { requesterStar });

  // Safety check
  if (!requesterStar) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div 
          style={{
            background: 'rgba(20,20,30,0.95)',
            padding: '2rem',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Someone wants to connect</h3>
          <p style={{ marginBottom: '2rem', opacity: 0.7, color: '#fff' }}>Loading their message...</p>
          <button 
            onClick={onReject}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  const emotionColor = EMOTION_COLORS[requesterStar.emotion] || "#ffffff";

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div 
        style={{
          background: `linear-gradient(180deg, rgba(20,20,30,0.95) 0%, ${emotionColor}10 100%)`,
          border: `1px solid ${emotionColor}40`,
          boxShadow: `0 0 20px ${emotionColor}60`,
          padding: '2rem',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '90%',
        }}
      >
        <h3 style={{ 
          marginBottom: '1rem',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#fff',
        }}>
          Someone wants to connect
        </h3>

        <p style={{ 
          opacity: 0.7, 
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          color: '#fff',
        }}>
          They've shared their unsent message with you:
        </p>

        {/* Emotion badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: `${emotionColor}20`,
          borderRadius: '20px',
          marginBottom: '1rem',
          border: `1px solid ${emotionColor}40`,
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: emotionColor,
            boxShadow: `0 0 8px ${emotionColor}`,
          }} />
          <span style={{ 
            textTransform: 'capitalize',
            fontSize: '0.85rem',
            color: emotionColor,
          }}>
            {requesterStar.emotion}
          </span>
        </div>

        {/* Message */}
        <p style={{
          fontSize: '1.2rem',
          lineHeight: '1.6',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          border: `1px solid ${emotionColor}20`,
          color: '#fff',
        }}>
          "{requesterStar.text}"
        </p>

        <p style={{ 
          textAlign: 'center',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          opacity: 0.8,
          color: '#fff',
        }}>
          Would you like to connect?
        </p>

        {/* Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
        }}>
          <button 
            onClick={() => {
              console.log("❌ REJECT BUTTON CLICKED!");
              onReject();
            }}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Not now
          </button>
          
          <button 
            onClick={() => {
              console.log("✅ ACCEPT BUTTON CLICKED!");
              onAccept();
            }}
            style={{
              flex: 1,
              padding: '1rem',
              background: emotionColor,
              border: 'none',
              borderRadius: '12px',
              color: '#0a0e27',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: `0 0 15px ${emotionColor}60`,
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}