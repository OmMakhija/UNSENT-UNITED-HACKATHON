"use client";
import React, { useState } from 'react';
import { Emotion, EMOTION_COLORS, EMOTION_GLOWS } from '@/data/messages';
import styles from './InteractiveConstellation.module.css';
import { X, ArrowRight } from 'lucide-react';

interface ComposeModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function ComposeModal({ onClose, onSubmit }: ComposeModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [text, setText] = useState('');
    const [recipient, setRecipient] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);

    const handleSubmit = () => {
        if (!text || !selectedEmotion) return;
        onSubmit({ text, recipient, emotion: selectedEmotion });
    };

    const handleEmotionSelect = (emotion: Emotion) => {
        setSelectedEmotion(emotion);
        setStep(2);
    };

    return (
        <div className={styles.overlay} style={{ zIndex: 200, animation: 'fadeIn 0.5s ease' }}>
            <div className={`${styles.card} glass-panel`} style={{
                maxWidth: '600px',
                width: '95%',
                transition: 'all 0.5s ease',
                background: selectedEmotion ? `linear-gradient(180deg, rgba(20,20,30,0.95) 0%, ${EMOTION_COLORS[selectedEmotion]}10 100%)` : undefined,
                boxShadow: selectedEmotion ? EMOTION_GLOWS[selectedEmotion] : undefined,
                border: selectedEmotion ? `1px solid ${EMOTION_COLORS[selectedEmotion]}40` : undefined
            }}>
                <button className={styles.closeBtn} onClick={onClose}><X /></button>

                {step === 1 ? (
                    <div className="step-1" style={{ animation: 'slideUp 0.4s ease' }}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '2rem', textAlign: 'center', fontWeight: 600, fontSize: '1.8rem' }}>
                            What weighs on your heart?
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                            {(Object.keys(EMOTION_COLORS) as Emotion[]).map((emotion) => (
                                <button
                                    key={emotion}
                                    onClick={() => handleEmotionSelect(emotion)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '1.5rem 1rem',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        color: '#fff'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = EMOTION_COLORS[emotion];
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = `0 4px 20px ${EMOTION_COLORS[emotion]}40`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: EMOTION_COLORS[emotion],
                                        boxShadow: `0 0 10px ${EMOTION_COLORS[emotion]}`
                                    }} />
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', textTransform: 'capitalize' }}>
                                        {emotion}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="step-2" style={{ animation: 'fadeIn 0.5s ease' }}>
                        <h2 style={{
                            fontFamily: 'var(--font-heading)',
                            marginBottom: '1rem',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: selectedEmotion ? EMOTION_COLORS[selectedEmotion] : '#fff',
                            textShadow: selectedEmotion ? `0 0 15px ${EMOTION_COLORS[selectedEmotion]}60` : undefined
                        }}>
                            Write your unsent letter...
                        </h2>
                        <p style={{ textAlign: 'center', opacity: 0.7, marginBottom: '2rem', fontStyle: 'italic' }}>
                            Theme: {selectedEmotion?.toUpperCase()}
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="To whom?"
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: `1px solid ${selectedEmotion ? EMOTION_COLORS[selectedEmotion] : 'rgba(255,255,255,0.1)'}`,
                                    padding: '1rem',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    fontFamily: 'var(--font-body)',
                                    marginBottom: '1rem',
                                    outline: 'none'
                                }}
                            />
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Let it go..."
                                rows={6}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: `1px solid ${selectedEmotion ? EMOTION_COLORS[selectedEmotion] : 'rgba(255,255,255,0.1)'}`,
                                    padding: '1rem',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    fontFamily: 'var(--font-hand)',
                                    fontSize: '1.4rem',
                                    resize: 'none',
                                    outline: 'none',
                                    lineHeight: 1.5,
                                    boxShadow: `inset 0 0 20px ${selectedEmotion ? EMOTION_COLORS[selectedEmotion] + '10' : 'transparent'}`
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'var(--text-secondary)',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!text}
                                style={{
                                    flex: 1,
                                    padding: '1.2rem',
                                    background: selectedEmotion ? EMOTION_COLORS[selectedEmotion] : '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#0a0e27',
                                    fontFamily: 'var(--font-heading)',
                                    fontWeight: 700,
                                    letterSpacing: '1px',
                                    cursor: !text ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: !text ? 'none' : `0 0 25px ${selectedEmotion ? EMOTION_COLORS[selectedEmotion] : '#fff'}`
                                }}
                            >
                                RELEASE
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
