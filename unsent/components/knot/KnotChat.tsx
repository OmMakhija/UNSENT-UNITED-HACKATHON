"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './knot.module.css';

interface Message {
    id: string;
    sender: 'you' | 'them';
    text: string;
}

export default function KnotChat({ isActive }: { isActive: boolean }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    // Simulated "Them" messages
    useEffect(() => {
        if (!isActive) return;

        const sequence = [
            { delay: 3000, text: "I know what you mean..." },
            { delay: 15000, text: "It's heavy, isn't it?" },
            { delay: 45000, text: "I'm glad we're drawing this together." }
        ];

        const timeouts = sequence.map(item =>
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'them', text: item.text }]);
            }, item.delay)
        );

        return () => timeouts.forEach(clearTimeout);
    }, [isActive]);

    // Auto-scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'you', text: input }]);
        setInput('');
    };

    return (
        <div className={styles.chatArea}>
            <div className={styles.chatMessages}>
                {messages.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '1rem' }}>Connected. Say hello...</div>}
                {messages.map(msg => (
                    <div key={msg.id} className={`${styles.chatBubble} ${msg.sender === 'them' ? styles.bubbleThem : styles.bubbleYou}`}>
                        {msg.sender === 'them' && <span style={{ fontSize: '0.7em', display: 'block', opacity: 0.7, marginBottom: '2px' }}>Anonymous</span>}
                        {msg.text}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <form onSubmit={send} className={styles.chatInputWrapper}>
                <input
                    className={styles.chatInput}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
            </form>
        </div>
    );
}
