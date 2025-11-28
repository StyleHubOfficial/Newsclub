
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { streamChatResponse, generateImageFromPrompt } from '../services/geminiService';
import { CloseIcon, SendIcon, ImageIcon, MicIcon, StopIcon } from './icons';
import { ThinkingBubble } from './Loaders';
import { Part } from '@google/genai';
import { encode } from '../utils/audioUtils';

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'initial', text: 'Hello! Ask me anything about tech, or switch to image mode to create a visual.', sender: 'bot' }
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
            setMessages([ { id: 'initial', text: 'Hello! Ask me anything about tech, or switch to image mode to create a visual.', sender: 'bot' } ]);
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
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome/Firefox usually supports webm
                // Convert blob to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Data = (reader.result as string).split(',')[1];
                    await handleVoiceMessage(base64Data);
                };
                
                // Stop all tracks to release mic
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
            // Construct the multimodal part
            const audioPart: Part = {
                inlineData: {
                    mimeType: 'audio/webm',
                    data: base64Audio
                }
            };
            
            // We can send audio + text prompts. 
            const parts: Part[] = [
                audioPart,
                { text: "Listen to this audio and respond helpfuly." }
            ];

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
                    ? { ...msg, text: "Sorry, I couldn't process the audio.", isLoading: false } 
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
                    ? { ...msg, text: error instanceof Error ? error.message : "Image generation failed.", isLoading: false } 
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
            default: return 'Type your message...';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-full max-w-md h-[60vh] z-40 animate-slide-up">
            <div className="bg-brand-surface rounded-lg shadow-2xl flex flex-col h-full border border-brand-primary/30">
                <header className="p-4 border-b border-brand-primary/20 flex justify-between items-center">
                    <h2 className="font-orbitron text-xl text-brand-secondary">AI Assistant</h2>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary transition-colors">
                        <CloseIcon />
                    </button>
                </header>
                
                {error && <div className="bg-red-900/50 text-white text-xs p-2 text-center">{error}</div>}

                <div className="flex-grow p-4 overflow-y-auto">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-bg border border-brand-primary/10'}`}>
                                {msg.isLoading && <ThinkingBubble />}
                                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                {msg.imageUrl && <img src={msg.imageUrl} alt="Generated by AI" className="rounded-lg mt-2" />}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <footer className="p-4 border-t border-brand-primary/20">
                    <div className="flex items-center gap-2">
                         <button onClick={() => setMode(m => m === 'image' ? 'chat' : 'image')} className={`p-3 rounded-full hover:bg-opacity-80 transition-colors ${mode === 'image' ? 'bg-brand-secondary text-white' : 'bg-brand-bg text-brand-text-muted'}`} aria-label="Toggle Image Mode">
                            <ImageIcon className="h-5 w-5" />
                        </button>
                        
                        <div className="relative flex-grow">
                             <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={getPlaceholder()}
                                disabled={isRecording}
                                className={`w-full bg-brand-bg border border-brand-secondary/50 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:border-brand-primary transition-colors text-brand-text ${isRecording ? 'animate-pulse border-brand-accent' : ''}`}
                            />
                        </div>

                        {mode === 'chat' && (
                            <button 
                                onClick={isRecording ? stopRecording : startRecording} 
                                className={`p-3 rounded-full text-white transition-all duration-300 ${isRecording ? 'bg-brand-accent animate-pulse-glow' : 'bg-brand-bg text-brand-text-muted hover:text-brand-text'}`}
                                aria-label="Toggle Voice Input"
                            >
                                {isRecording ? <StopIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
                            </button>
                        )}

                        <button onClick={handleSend} disabled={isRecording} className="bg-brand-primary p-3 rounded-full text-white hover:bg-opacity-80 transition-colors disabled:opacity-50" aria-label="Send Message">
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChatBot;
