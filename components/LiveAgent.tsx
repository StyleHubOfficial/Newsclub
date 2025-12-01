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
    const transcriptionEndRef = useRef<HTMLDivElement>(null);

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

    const scrollToBottom = () => {
        if (transcriptionEndRef.current) {
            transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [transcription, currentTurn]);

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
            
            setStatus('Requesting uplink...');
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            setStatus('Establishing Neural Link...');
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
                        setStatus('LINK ESTABLISHED');
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
                            setStatus('RECEIVING INPUT');
                            setIsListening(true);
                            currentTurnDataRef.current.user += message.serverContent.inputTranscription.text;
                            setCurrentTurn({ ...currentTurnDataRef.current });
                            // Simple debounce
                            thinkingTimeoutRef.current = window.setTimeout(() => { setStatus('PROCESSING...'); setIsListening(false); }, 1000);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setStatus('TRANSMITTING');
                            setIsListening(false);
                            currentTurnDataRef.current.model += message.serverContent.outputTranscription.text;
                            setCurrentTurn({ ...currentTurnDataRef.current });
                        }
                         if (message.serverContent?.turnComplete) {
                            setStatus('AWAITING INPUT');
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
                            setStatus('INTERRUPTED');
                            currentTurnDataRef.current.model = ''; 
                            setCurrentTurn({ ...currentTurnDataRef.current });
                            setIsListening(true);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setStatus('LINK FAILED');
                        setError('Neural link severed. Retrying handshake recommended.');
                        setIsListening(false);
                        setIsConnected(false);
                    },
                    onclose: () => {
                        setStatus('DISCONNECTED');
                        setIsListening(false);
                        setIsConnected(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'You are a professional, quick-witted news reporter. You speak clearly and concisely.',
                },
            });

        } catch (err) {
            console.error('Failed to start Live Agent:', err);
            setStatus('SYSTEM FAILURE');
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
        <div className="fixed inset-0 bg-[#050505]/95 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            {/* FLOATING GLASS PANEL */}
            <div 
                className="
                    bg-[#050505]/80 backdrop-blur-2xl 
                    w-full max-w-2xl h-[80vh] 
                    rounded-[22px] 
                    shadow-[0_0_50px_rgba(14,165,233,0.3)] 
                    border border-white/10 ring-1 ring-white/5 
                    flex flex-col animate-page-enter relative overflow-hidden
                " 
                onClick={e => e.stopPropagation()}
            >
                {/* Holographic Texture */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>

                 {/* Horizontal Laser Sweep */}
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary to-transparent z-50 animate-scan-line"></div>

                {/* Header */}
                <header className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-white/5 z-10 relative">
                    <div className="flex items-center gap-3">
                        <div className={`relative w-3 h-3 flex items-center justify-center`}>
                             <div className={`absolute w-full h-full rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                             {isConnected && <div className="absolute w-full h-full rounded-full bg-green-500 animate-ping"></div>}
                        </div>
                        <h2 className="font-orbitron text-xl text-brand-primary tracking-widest">NEWS REPORTER <span className="text-brand-text-muted text-xs">LIVE</span></h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent transition-colors p-2 hover:bg-white/5 rounded-full border border-transparent hover:border-white/10">
                        <CloseIcon />
                    </button>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-900/90 text-white p-3 text-center text-xs font-mono border-b border-red-500/50 z-10 flex justify-between items-center px-6">
                        <span>ERROR: {error}</span>
                        <button 
                            onClick={startSession} 
                            className="px-3 py-1 bg-red-800 rounded border border-red-500 hover:bg-red-700 transition-colors font-orbitron text-[10px]"
                        >
                            RECONNECT
                        </button>
                    </div>
                )}

                {/* Chat History */}
                <div className="flex-grow p-6 overflow-y-auto space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-brand-secondary/30 scrollbar-track-transparent relative z-10">
                    {/* Welcome Message */}
                    <div className="flex justify-start">
                         <div className="max-w-[85%] bg-white/5 border-l-2 border-brand-secondary rounded-r-2xl rounded-tl-2xl p-4 backdrop-blur-sm shadow-lg">
                            <p className="text-brand-secondary text-xs font-orbitron mb-2">NEWS REPORTER</p>
                            <p className="text-brand-text font-light">Live link established. I'm listening.</p>
                        </div>
                    </div>

                    {transcription.map((turn, index) => (
                        <div key={index} className="space-y-4">
                            {turn.user && (
                                <div className="flex justify-end animate-fade-in">
                                    <div className="max-w-[85%] bg-brand-primary/10 border-r-2 border-brand-primary rounded-l-2xl rounded-tr-2xl p-4 text-right shadow-[0_0_15px_rgba(58,190,254,0.1)]">
                                        <p className="text-brand-primary text-xs font-orbitron mb-2">YOU</p>
                                        <p className="text-white font-light">{turn.user}</p>
                                    </div>
                                </div>
                            )}
                            {turn.model && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="max-w-[85%] bg-white/5 border-l-2 border-brand-secondary rounded-r-2xl rounded-tl-2xl p-4 shadow-lg">
                                        <p className="text-brand-secondary text-xs font-orbitron mb-2">NEWS REPORTER</p>
                                        <p className="text-brand-text font-light">{turn.model}</p>
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
                                    <div className="max-w-[85%] bg-brand-primary/5 border-r-2 border-brand-primary/50 rounded-l-2xl rounded-tr-2xl p-4 text-right opacity-80">
                                         <p className="text-brand-primary text-xs font-orbitron mb-2">RECEIVING...</p>
                                        <p className="text-white font-light">{currentTurn.user}</p>
                                    </div>
                                </div>
                            )}
                            {currentTurn.model && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="max-w-[85%] bg-white/5 border-l-2 border-brand-secondary/50 rounded-r-2xl rounded-tl-2xl p-4 opacity-80">
                                        <p className="text-brand-secondary text-xs font-orbitron mb-2">TRANSMITTING...</p>
                                        <p className="text-brand-text font-light">{currentTurn.model}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!isListening && status === 'PROCESSING...' && (
                        <div className="flex justify-start animate-fade-in">
                             <div className="bg-white/5 border-l-2 border-brand-secondary rounded-r-2xl rounded-tl-2xl p-4">
                                <ThinkingBubble />
                            </div>
                        </div>
                    )}
                    <div ref={transcriptionEndRef} />
                </div>

                {/* Footer / Visualizer */}
                <footer className="p-0 bg-black/40 backdrop-blur-lg flex-shrink-0 border-t border-brand-primary/30 relative z-10">
                     <div className="w-full h-32 flex flex-col items-center justify-center relative">
                        
                        {/* Status Overlay */}
                        <div className="absolute top-2 left-0 right-0 text-center">
                            <span className={`text-[10px] font-orbitron tracking-[0.3em] ${isListening ? 'text-brand-primary animate-pulse' : 'text-brand-text-muted'}`}>
                                {status}
                            </span>
                        </div>
                        
                       <div className="w-full opacity-80 mt-4 px-4">
                           <AudioVisualizer analyserNode={analyserNodeRef.current} barColor={isListening ? "#0ea5e9" : "#6366f1"} gap={2} height={80} width={600} />
                       </div>
                       
                       {/* Microphone Icon Animation */}
                       <div className={`absolute bottom-4 p-4 rounded-full border transition-all duration-500 transform ${isListening ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_20px_#0ea5e9] scale-110 animate-vibrate' : 'border-brand-text-muted/30 bg-transparent scale-100'}`}>
                            <MicIcon className={`h-6 w-6 ${isListening ? 'text-brand-primary' : 'text-brand-text-muted'}`} />
                       </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LiveAgent;