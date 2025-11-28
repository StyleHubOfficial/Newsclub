
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { CloseIcon, MicIcon } from './icons';
import AudioVisualizer from './AudioVisualizer';
import { ThinkingBubble } from './Loaders';

interface LiveAgentProps {
    onClose: () => void;
}

const LiveAgent: React.FC<LiveAgentProps> = ({ onClose }) => {
    const [status, setStatus] = useState('Initializing...');
    const [transcription, setTranscription] = useState<{ user: string, model: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState({ user: '', model: '' });
    const [isListening, setIsListening] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const currentTurnDataRef = useRef({ user: '', model: '' });
    const thinkingTimeoutRef = useRef<number | null>(null);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);

    const cleanup = useCallback(() => {
        if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        audioContextRef.current?.close();
        outputAudioContextRef.current?.close();
    }, []);

    const getApiKey = () => {
        let key = '';
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
            key = (import.meta as any).env.VITE_API_KEY;
        } else if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_KEY) {
            key = process.env.NEXT_PUBLIC_API_KEY;
        } else if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            key = process.env.API_KEY;
        }
        return key;
    };

    const startSession = async () => {
        setError(null);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API_KEY not found. Please set VITE_API_KEY.");
            
            const ai = new GoogleGenAI({ apiKey });
            
            setStatus('Requesting microphone...');
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            setStatus('Connecting...');
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const outputNode = outputAudioContextRef.current.createGain();
            analyserNodeRef.current = outputAudioContextRef.current.createAnalyser();
            outputNode.connect(analyserNodeRef.current);
            analyserNodeRef.current.connect(outputAudioContextRef.current.destination);

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('Connected. Listening...');
                        setIsListening(true);
                        setIsConnected(true);
                        if (!audioContextRef.current || !streamRef.current) return;
                        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                        const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         if (thinkingTimeoutRef.current) {
                            clearTimeout(thinkingTimeoutRef.current);
                            thinkingTimeoutRef.current = null;
                        }
                        
                         if (message.serverContent?.inputTranscription) {
                            setStatus('Listening...');
                            setIsListening(true);
                            currentTurnDataRef.current.user += message.serverContent.inputTranscription.text;
                            setCurrentTurn({ ...currentTurnDataRef.current });
                            // Simple debounce to guess when user stops
                            thinkingTimeoutRef.current = window.setTimeout(() => { setStatus('Thinking...'); setIsListening(false); }, 1000);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setStatus('Speaking...');
                            setIsListening(false);
                            currentTurnDataRef.current.model += message.serverContent.outputTranscription.text;
                            setCurrentTurn({ ...currentTurnDataRef.current });
                        }
                         if (message.serverContent?.turnComplete) {
                            setStatus('Listening...');
                            setIsListening(true);
                            setTranscription(prev => [...prev, currentTurnDataRef.current]);
                            currentTurnDataRef.current = { user: '', model: '' };
                            setCurrentTurn({ user: '', model: '' });
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                            }
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setStatus('Interrupted. Listening...');
                            currentTurnDataRef.current.model = ''; 
                            setCurrentTurn({ ...currentTurnDataRef.current });
                            setIsListening(true);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setStatus('Connection Failed');
                        setError('Connection to Gemini Live failed. Please try again.');
                        setIsListening(false);
                        setIsConnected(false);
                    },
                    onclose: () => {
                        setStatus('Disconnected');
                        setIsListening(false);
                        setIsConnected(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'You are Cygnus, a futuristic news assistant. You speak directly to the user. Keep answers short and witty.',
                },
            });

        } catch (err) {
            console.error('Failed to start Live Agent:', err);
            setStatus('Error');
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsListening(false);
        }
    };

    useEffect(() => {
        startSession();
        return () => {
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-surface w-full max-w-2xl h-[80vh] rounded-lg shadow-2xl border border-brand-primary/30 flex flex-col animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <header className="p-4 border-b border-brand-primary/20 flex justify-between items-center flex-shrink-0 bg-brand-surface/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <h2 className="font-orbitron text-xl text-brand-secondary">Live Agent Cygnus</h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary transition-colors">
                        <CloseIcon />
                    </button>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-900/80 text-white p-3 text-center text-sm z-10">
                        {error}
                        <button onClick={startSession} className="ml-2 underline font-bold">Retry</button>
                    </div>
                )}

                {/* Chat History */}
                <div className="flex-grow p-6 overflow-y-auto space-y-6 scroll-smooth">
                    {/* Welcome Message */}
                    <div className="flex justify-start">
                         <div className="max-w-[80%] bg-brand-bg/50 border border-brand-secondary/30 rounded-lg p-3 rounded-tl-none">
                            <p className="text-brand-text-muted text-sm font-semibold mb-1">Cygnus</p>
                            <p className="text-brand-text">Online. Speak naturally, I am listening.</p>
                        </div>
                    </div>

                    {transcription.map((turn, index) => (
                        <div key={index} className="space-y-4">
                            {turn.user && (
                                <div className="flex justify-end animate-fade-in">
                                    <div className="max-w-[80%] bg-brand-primary/20 border border-brand-primary/30 rounded-lg p-3 rounded-tr-none">
                                        <p className="text-brand-text-muted text-sm font-semibold mb-1 text-right">You</p>
                                        <p className="text-white">{turn.user}</p>
                                    </div>
                                </div>
                            )}
                            {turn.model && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="max-w-[80%] bg-brand-bg/50 border border-brand-secondary/30 rounded-lg p-3 rounded-tl-none">
                                        <p className="text-brand-text-muted text-sm font-semibold mb-1">Cygnus</p>
                                        <p className="text-brand-text">{turn.model}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Current Turn (Real-time) */}
                    {(currentTurn.user || currentTurn.model) && (
                         <div className="space-y-4">
                            {currentTurn.user && (
                                <div className="flex justify-end animate-pulse">
                                    <div className="max-w-[80%] bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-3 rounded-tr-none opacity-80">
                                         <p className="text-brand-text-muted text-sm font-semibold mb-1 text-right">You</p>
                                        <p className="text-white">{currentTurn.user}</p>
                                    </div>
                                </div>
                            )}
                            {currentTurn.model && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="max-w-[80%] bg-brand-bg/30 border border-brand-secondary/20 rounded-lg p-3 rounded-tl-none opacity-80">
                                        <p className="text-brand-text-muted text-sm font-semibold mb-1">Cygnus</p>
                                        <p className="text-brand-text">{currentTurn.model}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!isListening && status === 'Thinking...' && (
                        <div className="flex justify-start animate-fade-in">
                             <div className="bg-brand-bg/50 border border-brand-secondary/30 rounded-lg p-4 rounded-tl-none">
                                <ThinkingBubble />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Visualizer */}
                <footer className="p-4 border-t border-brand-primary/20 bg-black/40 backdrop-blur-md flex-shrink-0">
                     <div className="w-full h-24 flex items-center justify-center relative">
                        {/* Status Overlay */}
                        <div className="absolute top-0 left-0 right-0 text-center">
                            <span className={`text-xs font-mono uppercase tracking-widest ${isListening ? 'text-brand-primary animate-pulse' : 'text-brand-text-muted'}`}>
                                {status}
                            </span>
                        </div>
                        
                       <AudioVisualizer analyserNode={analyserNodeRef.current} barColor={isListening ? "#0ea5e9" : "#6366f1"} gap={2} height={60} />
                       
                       {/* Microphone Icon Animation */}
                       <div className={`absolute bottom-2 p-2 rounded-full border transition-all duration-500 ${isListening ? 'border-brand-primary bg-brand-primary/20 shadow-[0_0_15px_#0ea5e9]' : 'border-brand-text-muted/30 bg-transparent'}`}>
                            <MicIcon className={`h-6 w-6 ${isListening ? 'text-brand-primary' : 'text-brand-text-muted'}`} />
                       </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LiveAgent;
