"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './knot.module.css';

interface Message {
    id: string;
    sender: 'you' | 'them';
    text: string;
}

interface KnotChatProps {
    isActive: boolean;
    threadId: string;
    socket: any; // Your existing socket instance from parent component
}

export default function KnotChat({ isActive, threadId, socket }: KnotChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !socket || !threadId) return;

        console.log('🎯 Setting up chat listeners');
        console.log('   Socket ID:', socket.id);
        console.log('   Thread ID:', threadId);

        // Listen for chat history when joining
        const handleChatHistory = (data: { messages: Array<{ text: string; sender_sid: string; timestamp: number }> }) => {
            const formattedMessages = data.messages.map(msg => ({
                id: msg.timestamp.toString(),
                sender: (msg.sender_sid === socket.id ? 'you' : 'them') as 'you' | 'them',
                text: msg.text
            }));
            setMessages(formattedMessages);
            console.log('📜 Loaded chat history:', formattedMessages.length, 'messages');
        };

        // Listen for incoming chat messages
        const handleChatMessage = (data: { text: string; sender_sid: string }) => {
            console.log('💬 RAW chat_message event received:', data);
            console.log('   My socket.id:', socket.id);
            console.log('   Message sender_sid:', data.sender_sid);
            
            const isFromYou = data.sender_sid === socket.id;
            console.log('   Is from you?', isFromYou);
            
            const newMessage: Message = {
                id: Date.now().toString() + Math.random(),
                sender: (isFromYou ? 'you' : 'them') as 'you' | 'them',
                text: data.text
            };
            
            console.log('   Adding message:', newMessage);
            
            setMessages(prev => {
                console.log('   Previous messages count:', prev.length);
                const updated = [...prev, newMessage];
                console.log('   Updated messages count:', updated.length);
                return updated;
            });
        };

        socket.on('chat_history', handleChatHistory);
        socket.on('chat_message', handleChatMessage);

        return () => {
            socket.off('chat_history', handleChatHistory);
            socket.off('chat_message', handleChatMessage);
        };
    }, [isActive, socket, threadId]);

    // Auto-scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('🔍 Send clicked:', { input, socket: !!socket, threadId });
        
        if (!input.trim()) {
            console.log('❌ Empty input');
            return;
        }
        
        if (!socket) {
            console.log('❌ No socket');
            return;
        }
        
        if (!threadId) {
            console.log('❌ No threadId');
            return;
        }

        const messageText = input;

        // Send to server - server will broadcast to ALL users including sender
        socket.emit('chat_message', {
            thread_id: threadId,
            text: messageText
        });

        console.log('📤 Sent chat message:', messageText);

        setInput('');
    };

    return (
        <div className={styles.chatArea}>
            <div className={styles.chatMessages}>
                {messages.length === 0 && (
                    <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '1rem' }}>
                        Connected. Say hello...
                    </div>
                )}
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
                <button type="submit" className={styles.chatSendButton}>
                    Send
                </button>
            </form>
        </div>
    );
}