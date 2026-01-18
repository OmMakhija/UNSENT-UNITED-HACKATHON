"use client";

import React, { useState } from 'react';
import PlanetBackground from './PlanetBackground';
import { ArrowRight } from 'lucide-react';

const COSMIC_TITLES = [
    "Nebula Wanderer",
    "Stardust Keeper",
    "Void Whisperer",
    "Comet Chaser",
    "Astral Dreamer",
    "Eclipse Watcher",
    "Nova Seeker",
    "Celestial Voyager",
    "Infinity Walker",
    "Horizon Drifter"
];

interface LoginPageProps {
    onLogin: (username: string, cosmicName: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [name, setName] = useState('');
    const [step, setStep] = useState<'input' | 'unveiling'>('input');
    const [generatedName, setGeneratedName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const randomTitle = COSMIC_TITLES[Math.floor(Math.random() * COSMIC_TITLES.length)];
        const cosmicIdentity = `${name} the ${randomTitle}`;
        setGeneratedName(cosmicIdentity);
        setStep('unveiling');

        // Allow the user to admire the glowing name for a moment before entering
        setTimeout(() => {
            onLogin(name, cosmicIdentity);
        }, 3000);
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <PlanetBackground />

            <div style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
            }}>
                {step === 'input' ? (
                    <div style={{
                        background: 'rgba(20, 20, 25, 0.4)',
                        backdropFilter: 'blur(15px)',
                        WebkitBackdropFilter: 'blur(15px)',
                        padding: '3rem',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '420px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        animation: 'fadeIn 1s ease'
                    }}>
                        <h1 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '2rem',
                            marginBottom: '0.5rem',
                            color: '#fff',
                            fontWeight: 600
                        }}>
                            Enter the Void
                        </h1>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            color: 'rgba(255,255,255,0.5)',
                            marginBottom: '2.5rem',
                            fontSize: '0.9rem'
                        }}>
                            Leave your identity behind. Take a new one.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Your Name..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        color: '#fff',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '1.1rem', // Slightly larger
                                        outline: 'none',
                                        textAlign: 'center', // Center the name input
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#8a2be2';
                                        e.target.style.background = 'rgba(0,0,0,0.5)';
                                        e.target.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                        e.target.style.background = 'rgba(0,0,0,0.3)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!name.trim()}
                                style={{
                                    background: 'linear-gradient(90deg, #8a2be2 0%, #a855f7 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    color: '#fff',
                                    fontFamily: 'var(--font-heading)',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: !name.trim() ? 'not-allowed' : 'pointer',
                                    opacity: !name.trim() ? 0.7 : 1,
                                    transition: 'all 0.3s',
                                    marginTop: '1rem',
                                    boxShadow: !name.trim() ? 'none' : '0 4px 20px rgba(138, 43, 226, 0.4)'
                                }}
                            >
                                Begin Journey
                            </button>
                        </form>
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        animation: 'fadeIn 2s ease'
                    }}>
                        <p style={{
                            color: 'rgba(255,255,255,0.6)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '1rem',
                            marginBottom: '1rem',
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            Welcome
                        </p>
                        <h1 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '4rem',
                            fontWeight: 700,
                            color: '#fff',
                            textShadow: '0 0 20px #a855f7, 0 0 40px #8a2be2, 0 0 80px #8a2be2', // Glow effect
                            animation: 'pulseGlow 2s infinite alternate'
                        }}>
                            {generatedName}
                        </h1>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes pulseGlow {
                    from { text-shadow: 0 0 20px #a855f7, 0 0 40px #8a2be2; transform: scale(1); }
                    to { text-shadow: 0 0 30px #d8b4fe, 0 0 60px #a855f7, 0 0 90px #8a2be2; transform: scale(1.05); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
