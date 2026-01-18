export type Emotion = 'grief' | 'gratitude' | 'regret' | 'love' | 'apology' | 'hope' | 'loneliness';

export const EMOTION_COLORS: Record<Emotion, string> = {
    grief: '#6B9BD1',       // Pale Blue
    gratitude: '#F4D03F',   // Warm Gold
    regret: '#C77B89',      // Dusty Rose
    love: '#E8B4C8',        // Soft Pink
    apology: '#B8A1D6',     // Lavender
    hope: '#A8DADC',        // Mint Green
    loneliness: '#C0C5CE',  // Silver-Grey
};

export const EMOTION_GLOWS: Record<Emotion, string> = {
    grief: '0 0 20px rgba(107, 155, 209, 0.6)',
    gratitude: '0 0 20px rgba(244, 208, 63, 0.6)',
    regret: '0 0 20px rgba(199, 123, 137, 0.6)',
    love: '0 0 20px rgba(232, 180, 200, 0.6)',
    apology: '0 0 20px rgba(184, 161, 214, 0.6)',
    hope: '0 0 20px rgba(168, 218, 220, 0.6)',
    loneliness: '0 0 20px rgba(192, 197, 206, 0.6)',
};

export interface Message {
    id: string;
    author: string;
    text: string;
    emotion: Emotion;
    location: string;
    resonances: number;
    timestamp: string;
    x: number; // 0-100% position
    y: number; // 0-100% position
    size: number; // relative size
}

export const MOCK_MESSAGES: Message[] = [
    {
        id: '1',
        author: 'Anonymous',
        text: "Dear Mom, I'm sorry I never said this when you could hear me. I forgive you. I hope you forgive me too.",
        emotion: 'apology',
        location: 'Seattle, WA',
        resonances: 2847,
        timestamp: '2h ago',
        x: 20,
        y: 30,
        size: 1.2
    },
    {
        id: '2',
        author: 'A Friend',
        text: "To the person I was before 2020: I miss you, but I'm learning to love who we became.",
        emotion: 'grief',
        location: 'London, UK',
        resonances: 14032,
        timestamp: '5h ago',
        x: 50,
        y: 50,
        size: 1.5
    },
    {
        id: '3',
        author: 'Anonymous',
        text: "I still check your profile every Tuesday. I don't know why Tuesday.",
        emotion: 'love',
        location: 'Berlin, DE',
        resonances: 892,
        timestamp: '1d ago',
        x: 80,
        y: 20,
        size: 1.0
    },
    {
        id: '4',
        author: 'Lost Soul',
        text: "Thank you for the coffee. You didn't know it was the only warm thing I touched that day.",
        emotion: 'gratitude',
        location: 'New York, NY',
        resonances: 5621,
        timestamp: '3d ago',
        x: 30,
        y: 70,
        size: 1.3
    },
    {
        id: '5',
        author: 'Anonymous',
        text: "I wish I had been brave enough to stay.",
        emotion: 'regret',
        location: 'Tokyo, JP',
        resonances: 342,
        timestamp: '12h ago',
        x: 70,
        y: 60,
        size: 0.9
    },
    {
        id: '6',
        author: 'Dreamer',
        text: "One day, the noise will stop, and we will finally hear the music.",
        emotion: 'hope',
        location: 'Cape Town, SA',
        resonances: 1120,
        timestamp: '30m ago',
        x: 40,
        y: 85,
        size: 1.1
    },
    {
        id: '7',
        author: 'Silent',
        text: "The room is full of people, but I am the only one here.",
        emotion: 'loneliness',
        location: 'Paris, FR',
        resonances: 4404,
        timestamp: '4h ago',
        x: 10,
        y: 50,
        size: 1.4
    }
];
