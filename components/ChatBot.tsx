
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { streamChatResponse, generateImageFromPrompt, resetChat } from '../services/geminiService';
import { CloseIcon, SendIcon, ImageIcon, MicIcon, StopIcon } from './icons';
import { ThinkingBubble } from './Loaders';
import { Part } from '@google/genai';

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
}

const BotAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-primary flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_10px_#0ea5e9]">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-primary animate-pulse-glow">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 13L10 16L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="9" r="1" fill="currentColor" className="animate-ping" />
            <circle cx="15" cy="9" r="1" fill="currentColor" className="animate-ping" style={{ animationDelay: '0.5s' }} />
        </svg>
    </div>
);

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'initial', text: 'Greetings. I am your Neural Assistant. Ask me anything or request a visual generation.', sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'chat' | 'image'>('chat');
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (isOpen) {
             // Reset chat session on open to ensure clean state
             resetChat();
             if(messages.length === 0 || messages[0].id !== 'initial') {
                 setMessages([ { id: 'initial', text: 'Greetings. I am your Neural Assistant. Ask me anything or request a visual generation.', sender: 'bot' } ]);
             }
            setError(null);
        } else {
            setInput('');
            setMode('chat');
            setIsRecording(false);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }
    }, [isOpen]);

    const startRecording = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Data = (reader.result as string).split(',')[1];
                    await handleVoiceMessage(base64Data);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleVoiceMessage = async (base64Audio: string) => {
        const userMessage: ChatMessage = { id: Date.now().toString(), text: "🎤 [Audio Message]", sender: 'user' };
        const botMessageId = (Date.now() + 1).toString();
        const botMessage: ChatMessage = { id: botMessageId, sender: 'bot', isLoading: true };

        setMessages(prev => [...prev, userMessage, botMessage]);

        try {
            const audioPart: Part = {
                inlineData: {
                    mimeType: 'audio/webm',
                    data: base64Audio
                }
            };
            const parts: Part[] = [ audioPart, { text: "Listen to this audio and respond helpfuly." } ];

            await streamChatResponse(parts, (chunk) => {
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                        ? { ...msg, text: (msg.text || '') + chunk, isLoading: false } 
                        : msg
                ));
            });
        } catch (err) {
             setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                    ? { ...msg, text: "Sorry, I couldn't process the audio.", isLoading: false, isError: true } 
                    : msg
            ));
        }
    };
    
    const handleChat = async () => {
        const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        const botMessageId = (Date.now() + 1).toString();
        const botMessage: ChatMessage = { id: botMessageId, sender: 'bot', isLoading: true };

        setMessages(prev => [...prev, userMessage, botMessage]);
        
        await streamChatResponse(input, (chunk) => {
            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                    ? { ...msg, text: (msg.text || '') + chunk, isLoading: false } 
                    : msg
            ));
        });
    }

    const handleImageGeneration = async () => {
        const userMessage: ChatMessage = { id: Date.now().toString(), text: `Generate an image of: ${input}`, sender: 'user' };
        const botMessageId = (Date.now() + 1).toString();
        const botMessage: ChatMessage = { id: botMessageId, sender: 'bot', isLoading: true };
        
        setMessages(prev => [...prev, userMessage, botMessage]);

        try {
            const imageUrl = await generateImageFromPrompt(input);
             setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                    ? { ...msg, imageUrl, isLoading: false } 
                    : msg
            ));
        } catch(error) {
             setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                    ? { 
                        ...msg, 
                        text: error instanceof Error ? error.message : "Image generation failed.", 
                        isLoading: false,
                        isError: true 
                      } 
                    : msg
            ));
        }
    }

    const handleSend = async () => {
        if (input.trim() === '') return;
        setInput('');

        if (mode === 'image') {
            await handleImageGeneration();
        } else {
            await handleChat();
        }
    };

    const getPlaceholder = () => {
        if (isRecording) return 'Listening...';
        switch(mode) {
            case 'image': return 'Describe an image to create...';
            default: return 'Type message...';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-0 left-0 md:left-auto md:right-6 w-full md:w-full max-w-md h-[60vh] z-40 animate-slide-up px-2 md:px-0">
            <div className="bg-brand-surface/95 backdrop-blur-md rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col h-full border border-brand-primary/30 overflow-hidden">
                <header className="p-4 border-b border-brand-primary/20 flex justify-between items-center bg-brand-bg/50">
                    <div className="flex items-center gap-2">
                        <BotAvatar />
                        <div>
                            <h2 className="font-orbitron text-sm text-brand-text font-bold">NEWS REPORTER</h2>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse"></span>
                                <span className="text-[10px] text-brand-text-muted uppercase">Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary transition-colors p-1 hover:bg-brand-primary/10 rounded">
                        <CloseIcon />
                    </button>
                </header>
                
                {error && <div className="bg-brand-accent/20 border-b border-brand-accent/50 text-brand-text text-xs p-2 text-center">{error}</div>}

                <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-brand-primary/20 scrollbar-track-transparent">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && <div className="pt-1"><BotAvatar /></div>}
                            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                                msg.isError 
                                    ? 'bg-red-900/40 border border-red-500/50 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                    : msg.sender === 'user' 
                                        ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-br-none shadow-lg' 
                                        : 'bg-brand-bg/80 border border-brand-primary/20 text-brand-text rounded-bl-none shadow'
                            }`}>
                                {msg.isLoading && <ThinkingBubble />}
                                
                                {msg.isError && (
                                    <div className="flex items-center gap-2 mb-1 border-b border-red-500/30 pb-1">
                                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span className="font-orbitron text-xs font-bold text-red-400">ERROR REPORT</span>
                                    </div>
                                )}
                                
                                {msg.text && <p className={`whitespace-pre-wrap text-sm leading-relaxed ${msg.isError ? 'font-mono text-xs' : ''}`}>{msg.text}</p>}
                                
                                {msg.imageUrl && (
                                    <div className="mt-2 relative group rounded-lg overflow-hidden border border-brand-primary/30">
                                        <img src={msg.imageUrl} alt="Generated" className="w-full h-auto" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                            <span className="text-xs text-brand-primary font-orbitron">GENERATED_ASSET</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                <footer className="p-3 border-t border-brand-primary/20 bg-brand-bg/50">
                    <div className="flex items-center gap-2 bg-brand-bg/80 border border-brand-primary/20 rounded-full p-1 pl-2 focus-within:border-brand-primary/60 transition-colors shadow-inner">
                         <button 
                            onClick={() => setMode(m => m === 'image' ? 'chat' : 'image')} 
                            className={`p-2 rounded-full transition-all duration-300 ${mode === 'image' ? 'bg-brand-secondary text-white shadow-[0_0_10px_#6366f1]' : 'text-brand-text-muted hover:text-brand-text'}`}
                            title="Toggle Image Mode"
                        >
                            <ImageIcon className="h-5 w-5" />
                        </button>
                        
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={getPlaceholder()}
                            disabled={isRecording}
                            className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-brand-text placeholder-brand-text-muted/50 px-2"
                        />

                        {mode === 'chat' && (
                            <button 
                                onClick={isRecording ? stopRecording : startRecording} 
                                className={`p-2 rounded-full transition-all duration-300 ${isRecording ? 'bg-brand-accent text-white animate-pulse shadow-[0_0_10px_#e11d48]' : 'text-brand-text-muted hover:text-brand-primary'}`}
                                title="Voice Input"
                            >
                                {isRecording ? <StopIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
                            </button>
                        )}

                        <button 
                            onClick={handleSend} 
                            disabled={isRecording || !input.trim()} 
                            className="bg-brand-primary p-2 rounded-full text-white hover:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChatBot;
