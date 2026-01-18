"use client";

import styles from "./ThreadRequestModal.module.css";
import { Message, EMOTION_COLORS, EMOTION_GLOWS } from "@/data/messages";

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
  // Safety check - if no star data, show basic message
  if (!requesterStar) {
    return (
      <div className={styles.overlay} style={{ zIndex: 300 }}>
        <div className={styles.card} style={{ padding: '2rem' }}>
          <h3>Someone wants to connect</h3>
          <p style={{ marginBottom: '2rem' }}>Loading their message...</p>
          <div className={styles.actions}>
            <button 
              className={styles.reject} 
              onClick={onReject}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem'
              }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} style={{ zIndex: 300 }}>
      <div 
        className={styles.card}
        style={{
          maxWidth: '500px',
          background: `linear-gradient(180deg, rgba(20,20,30,0.95) 0%, ${EMOTION_COLORS[requesterStar.emotion]}10 100%)`,
          border: `1px solid ${EMOTION_COLORS[requesterStar.emotion]}40`,
          boxShadow: EMOTION_GLOWS[requesterStar.emotion],
          animation: 'slideUp 0.4s ease',
          padding: '2rem'
        }}
      >
        <h3 style={{ 
          marginBottom: '1rem',
          fontSize: '1.5rem',
          fontFamily: 'var(--font-heading)',
          fontWeight: 600
        }}>
          Someone wants to connect
        </h3>

        <p style={{ 
          opacity: 0.7, 
          marginBottom: '1.5rem',
          fontSize: '0.9rem' 
        }}>
          They've shared their unsent message with you:
        </p>

        {/* Emotion badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: `${EMOTION_COLORS[requesterStar.emotion]}20`,
          borderRadius: '20px',
          marginBottom: '1rem',
          border: `1px solid ${EMOTION_COLORS[requesterStar.emotion]}40`
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: EMOTION_COLORS[requesterStar.emotion],
            boxShadow: `0 0 8px ${EMOTION_COLORS[requesterStar.emotion]}`
          }} />
          <span style={{ 
            textTransform: 'capitalize',
            fontSize: '0.85rem',
            color: EMOTION_COLORS[requesterStar.emotion]
          }}>
            {requesterStar.emotion}
          </span>
        </div>

        {/* Their message */}
        <p 
          className={styles.preview}
          style={{
            fontSize: '1.2rem',
            lineHeight: '1.6',
            marginBottom: '2rem',
            fontFamily: 'var(--font-hand)',
            padding: '1rem',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            border: `1px solid ${EMOTION_COLORS[requesterStar.emotion]}20`,
            color: '#fff'
          }}
        >
          "{requesterStar.text}"
        </p>

        <p style={{ 
          textAlign: 'center',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          opacity: 0.8 
        }}>
          Would you like to connect?
        </p>

        <div className={styles.actions}>
          <button 
            className={styles.reject} 
            onClick={onReject}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem'
            }}
          >
            Not now
          </button>
          <button 
            className={styles.accept} 
            onClick={onAccept}
            style={{
              flex: 1,
              padding: '1rem',
              background: EMOTION_COLORS[requesterStar.emotion],
              border: 'none',
              borderRadius: '12px',
              color: '#0a0e27',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: `0 0 15px ${EMOTION_COLORS[requesterStar.emotion]}60`
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}