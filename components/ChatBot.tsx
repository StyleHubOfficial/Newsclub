
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
    <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-brand-primary flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_#3ABEFE] relative group">
        <div className="absolute inset-0 bg-brand-primary/20 animate-pulse rounded-full"></div>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-primary relative z-10">
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
        <div className="fixed bottom-24 right-0 left-0 md:left-auto md:right-6 w-full md:w-[450px] h-[70vh] z-40 animate-slide-up px-3 md:px-0">
            {/* Glass Panel */}
            <div className="bg-[#050505]/80 backdrop-blur-2xl rounded-[22px] shadow-[0_0_80px_-20px_rgba(58,190,254,0.3)] flex flex-col h-full border border-white/10 overflow-hidden ring-1 ring-white/5">
                <header className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <BotAvatar />
                        <div>
                            <h2 className="font-orbitron text-sm text-brand-primary font-bold tracking-wider">NEWS REPORTER</h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse shadow-[0_0_5px_#28FFD3]"></span>
                                <span className="text-[9px] text-brand-text-muted uppercase tracking-widest">System Active</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary transition-colors p-2 hover:bg-white/5 rounded-full border border-transparent hover:border-white/10">
                        <CloseIcon />
                    </button>
                </header>
                
                {error && <div className="bg-red-900/40 border-b border-red-500/50 text-red-200 text-xs p-2 text-center font-mono">system_alert: {error}</div>}

                <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-brand-primary/20 scrollbar-track-transparent">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && <div className="pt-1"><BotAvatar /></div>}
                            <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl backdrop-blur-md border ${
                                msg.isError 
                                    ? 'bg-red-900/10 border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                    : msg.sender === 'user' 
                                        ? 'bg-brand-primary/10 border-brand-primary/30 text-white rounded-br-none shadow-[0_0_20px_rgba(58,190,254,0.1)]' 
                                        : 'bg-white/5 border-white/10 text-gray-200 rounded-bl-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                            }`}>
                                {msg.isLoading && <ThinkingBubble />}
                                
                                {msg.isError && (
                                    <div className="flex items-center gap-2 mb-2 border-b border-red-500/30 pb-1">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                        <span className="font-orbitron text-[10px] font-bold text-red-400 tracking-widest">SYSTEM FAILURE</span>
                                    </div>
                                )}
                                
                                {msg.text && <p className={`whitespace-pre-wrap text-sm leading-relaxed font-light ${msg.isError ? 'font-mono text-xs opacity-80' : ''}`}>{msg.text}</p>}
                                
                                {msg.imageUrl && (
                                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-brand-primary/40 shadow-[0_0_20px_rgba(58,190,254,0.2)]">
                                        <img src={msg.imageUrl} alt="Generated" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                            <span className="text-[10px] text-brand-primary font-orbitron tracking-widest border border-brand-primary/50 px-2 py-1 rounded bg-black/50 backdrop-blur-md">GENERATED_ASSET</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                <footer className="p-3 border-t border-white/5 bg-white/5 backdrop-blur-lg">
                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-full p-1.5 pl-3 focus-within:border-brand-primary/50 transition-colors shadow-inner">
                         <button 
                            onClick={() => setMode(m => m === 'image' ? 'chat' : 'image')} 
                            className={`p-2 rounded-full transition-all duration-300 ${mode === 'image' ? 'bg-brand-secondary text-white shadow-[0_0_15px_#7B2FFF]' : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'}`}
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
                            className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-brand-text placeholder-brand-text-muted/30 px-2 font-light tracking-wide"
                        />

                        {mode === 'chat' && (
                            <button 
                                onClick={isRecording ? stopRecording : startRecording} 
                                className={`
                                    p-2 rounded-full transition-all duration-300 border
                                    ${isRecording 
                                        ? 'bg-brand-accent text-black animate-vibrate ring-2 ring-brand-accent shadow-[0_0_20px_#28FFD3] border-brand-accent' 
                                        : 'bg-transparent border-transparent text-brand-text-muted hover:text-brand-accent hover:border-brand-accent/50 hover:bg-white/5'}
                                `}
                                title="Voice Input"
                            >
                                {isRecording ? <StopIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
                            </button>
                        )}

                        <button 
                            onClick={handleSend} 
                            disabled={isRecording || !input.trim()} 
                            className="
                                group relative overflow-hidden
                                p-2.5 rounded-full text-white 
                                bg-white/5 border border-brand-primary/50
                                transition-all hover:bg-brand-primary/20 hover:border-brand-primary hover:shadow-[0_0_15px_rgba(58,190,254,0.5)]
                                active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sheen z-0"></div>
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChatBot;
