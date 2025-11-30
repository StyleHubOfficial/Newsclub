
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateNewsBroadcastSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { NewsArticle } from '../types';
import { CloseIcon, SparklesIcon, UploadIcon, PlayIcon, PauseIcon, StopIcon } from './icons';
import AudioVisualizer from './AudioVisualizer';
import { HexagonLoader } from './Loaders';

interface AudioGenerationModalProps {
    articles: NewsArticle[];
    onClose: () => void;
}

type Mode = 'text' | 'article' | 'ai-conversation';
type Language = 'English' | 'Hindi' | 'Hinglish';
const progressMessages = ["INITIALIZING NEURAL NET", "ANALYZING SYNTAX", "SCRIPTING BROADCAST", "SYNTHESIZING AUDIO WAVES", "FINALIZING OUTPUT"];

const AudioGenerationModal: React.FC<AudioGenerationModalProps> = ({ articles, onClose }) => {
    // --- UI State ---
    const [mode, setMode] = useState<Mode>('text');
    const [textInput, setTextInput] = useState('');
    const [aiTopicInput, setAiTopicInput] = useState('');
    const [selectedArticleId, setSelectedArticleId] = useState<number | null>(articles[0]?.id || null);
    const [language, setLanguage] = useState<Language>('English');
    
    const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'playing' | 'paused' | 'error'>('idle');
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState('');

    // --- Audio State ---
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    
    // VISUALIZER STATE (Critical)
    const [analyserForVisualizer, setAnalyserForVisualizer] = useState<AnalyserNode | null>(null);

    // --- Audio Refs (Stable across renders) ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Cleanup on Unmount ---
    useEffect(() => {
        return () => {
            stopAudio();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    // --- Audio Engine Logic ---

    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
             const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
             const ctx = new AudioContext(); 
             
             const gain = ctx.createGain();
             const analyser = ctx.createAnalyser();
             
             // Connection: Gain -> Analyser -> Destination
             gain.connect(analyser);
             analyser.connect(ctx.destination);
             
             audioContextRef.current = ctx;
             gainNodeRef.current = gain;
             analyserNodeRef.current = analyser;
             
             // Update state to trigger Visualizer render
             setAnalyserForVisualizer(analyser);
        }
        return audioContextRef.current;
    }, []);

    const stopAudio = useCallback(() => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e) {}
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (status === 'playing' || status === 'paused') {
            setStatus('ready');
        }
    }, [status]);

    const pauseAudio = useCallback(() => {
        if (audioContextRef.current?.state === 'running') {
            audioContextRef.current.suspend();
            setStatus('paused');
        }
    }, []);

    const resumeAudio = useCallback(async () => {
        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
            setStatus('playing');
        }
    }, []);

    const playAudioBuffer = useCallback((offset: number = 0) => {
        const ctx = audioContextRef.current;
        const gain = gainNodeRef.current;
        const buffer = audioBufferRef.current;

        if (!buffer || !ctx || !gain) return;

        // Ensure context is running
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Stop previous source if exists
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e){}
            sourceRef.current.disconnect();
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Connection: Source -> Gain (Chain: Source -> Gain -> Analyser -> Destination)
        source.connect(gain);
        
        // Apply current settings
        gain.gain.value = volume;
        source.playbackRate.value = playbackRate;

        source.onended = () => {
            // Only reset status if we didn't manually pause/stop
            if (ctx.state === 'running') {
               setStatus('ready');
               sourceRef.current = null;
            }
        };

        source.start(0, offset);
        sourceRef.current = source;
        setStatus('playing');
   }, [volume, playbackRate]);

    // --- Interaction Handlers ---

    const handlePlayPauseClick = async () => {
        const ctx = initAudioContext(); // Ensure context exists

        if (status === 'playing') {
            pauseAudio();
        } else if (status === 'paused') {
            await resumeAudio();
        } else if (status === 'ready') {
            // Start from beginning
            if (ctx.state === 'suspended') await ctx.resume();
            playAudioBuffer(0);
        }
    };

    // Update Volume/Speed on the fly
    useEffect(() => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
    }, [volume]);

    useEffect(() => {
        if (sourceRef.current) sourceRef.current.playbackRate.value = playbackRate;
    }, [playbackRate]);


    // --- Data Handling ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result;
                if (typeof text === 'string') {
                    setAiTopicInput(text);
                }
            };
            reader.onerror = () => {
                setError('Failed to read the file.');
                setStatus('error');
            };
            reader.readAsText(file);
        } else if (file) {
            setError('Please upload a valid .txt file.');
            setStatus('error');
        }
    };

    const handleGenerate = async () => {
        setError('');
        setStatus('generating');
        stopAudio();
        audioBufferRef.current = null;
        
        // CRITICAL: Initialize AudioContext inside the user gesture event handler
        const ctx = initAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        
        // Progress Text Animation
        let intervalId = 0;
        let messageIndex = 0;
        intervalId = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % progressMessages.length;
            setProgressMessage(progressMessages[messageIndex]);
        }, 1500);
        setProgressMessage(progressMessages[0]);

        try {
            let inputText = '';

            if (mode === 'text') {
                if (!textInput.trim()) throw new Error("Please enter some text to broadcast.");
                inputText = textInput;
            } else if (mode === 'ai-conversation') {
                if (!aiTopicInput.trim()) throw new Error("Please enter a topic or upload a file.");
                inputText = aiTopicInput;
            } else {
                const article = articles.find(a => a.id === selectedArticleId);
                if (!article) throw new Error("Please select a valid article.");
                inputText = article.content;
            }
            
            const audioData = await generateNewsBroadcastSpeech(inputText, language);
            
            if (audioData) {
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                audioBufferRef.current = buffer;
                
                setStatus('ready');
                playAudioBuffer(0); // Auto-play on success
            } else {
                throw new Error("Audio generation failed to produce data.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setStatus('error');
        } finally {
            clearInterval(intervalId);
        }
    };

    // --- Render ---
    const selectedArticle = articles.find(a => a.id === selectedArticleId);
    const modeButtonStyle = (isActive: boolean) => `
        px-4 py-2 rounded-full font-semibold transition-all duration-300 text-sm border
        ${isActive 
            ? 'bg-brand-primary text-white border-brand-primary shadow-[0_0_15px_rgba(58,190,254,0.4)]' 
            : 'bg-white/5 text-brand-text-muted border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'}
        active:scale-95
    `;

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-lg flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#050505]/80 backdrop-blur-2xl w-full max-w-3xl rounded-[22px] shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 ring-1 ring-white/5 flex flex-col animate-page-enter relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-secondary to-transparent z-50 animate-scan-line"></div>

                <header className="p-4 flex justify-between items-center border-b border-brand-primary/20 bg-white/5">
                    <h2 className="font-orbitron text-xl text-brand-secondary">NEWS REPORTER</h2>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary transition-colors">
                        <CloseIcon />
                    </button>
                </header>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="bg-brand-bg/50 border border-brand-primary/20 rounded-full p-1 flex gap-1 w-min">
                            <button onClick={() => setMode('text')} className={modeButtonStyle(mode === 'text')}>Text Input</button>
                            <button onClick={() => setMode('article')} className={modeButtonStyle(mode === 'article')}>Article Mode</button>
                            <button onClick={() => setMode('ai-conversation')} className={`${modeButtonStyle(mode === 'ai-conversation')} flex items-center gap-2`}>
                                <SparklesIcon/> AI Topic
                            </button>
                        </div>
                         <div className={`flex items-center gap-2 transition-opacity duration-300`}>
                            {(['English', 'Hindi', 'Hinglish'] as Language[]).map(lang => (
                                <button key={lang} onClick={() => setLanguage(lang)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${language === lang ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-transparent text-brand-text-muted border-transparent hover:bg-white/5'}`}>
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {status === 'generating' ? (
                        <div className="flex flex-col items-center justify-center h-48 py-8 animate-fade-in">
                            <HexagonLoader text={progressMessage} />
                        </div>
                    ) : (
                        <>
                            {mode === 'text' && (
                                <div className="space-y-2">
                                    <textarea 
                                        value={textInput}
                                        onChange={e => setTextInput(e.target.value)}
                                        placeholder="Enter any text here. Our AI Anchors (Orion & Celeste) will turn it into a professional news broadcast..."
                                        className="w-full h-32 bg-white/5 border border-brand-secondary/30 rounded-xl p-4 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(58,190,254,0.1)] transition-all text-brand-text resize-none font-light"
                                    />
                                    <p className="text-[10px] text-brand-text-muted text-right font-orbitron tracking-widest">
                                        MODE: NEURAL SCRIPTING
                                    </p>
                                </div>
                            )}
                            {mode === 'article' && (
                                <div>
                                     <select 
                                        value={selectedArticleId || ''} 
                                        onChange={e => setSelectedArticleId(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-brand-secondary/30 rounded-xl py-2 px-4 focus:outline-none focus:border-brand-primary transition-all text-brand-text mb-2"
                                     >
                                        {articles.map(article => <option key={article.id} value={article.id} className="bg-brand-bg">{article.title}</option>)}
                                    </select>
                                    <p className="text-sm text-brand-text-muted h-10 overflow-hidden text-ellipsis px-2">{selectedArticle?.summary}</p>
                                </div>
                            )}
                            {mode === 'ai-conversation' && (
                                 <div className="relative">
                                    <textarea 
                                        value={aiTopicInput}
                                        onChange={e => setAiTopicInput(e.target.value)}
                                        placeholder="Describe a topic... The AI will generate a news-style conversation about it. You can also upload a .txt file."
                                        className="w-full h-32 bg-white/5 border border-brand-secondary/30 rounded-xl p-4 focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(58,190,254,0.1)] transition-all text-brand-text pr-28 resize-none font-light"
                                    />
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt" />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-brand-bg/50 border border-brand-secondary/50 rounded-full text-sm font-semibold text-brand-text-muted hover:bg-brand-secondary/20 hover:text-white transition-colors"
                                    >
                                        <UploadIcon className="h-4 w-4" />
                                        Upload
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {status === 'error' && (
                    <div className="px-6 py-2">
                        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-center text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <span className="font-bold">Error:</span> {error}
                            <button onClick={() => setStatus('idle')} className="ml-4 underline hover:text-white">Reset</button>
                        </div>
                    </div>
                )}

                <div className="px-6 pb-6 text-center min-h-[60px] flex flex-col justify-center">
                    {(status === 'idle' || status === 'error') && (
                        <button 
                            onClick={handleGenerate} 
                            className="
                                self-center px-10 py-3 rounded-full 
                                bg-gradient-to-br from-brand-primary to-brand-secondary 
                                text-white font-orbitron font-bold text-lg tracking-wide
                                border border-white/20
                                shadow-[0_0_30px_rgba(99,102,241,0.5)] 
                                hover:scale-105 hover:shadow-[0_0_50px_rgba(99,102,241,0.7)] 
                                active:scale-95 active:animate-ripple
                                transition-all duration-300
                            "
                        >
                           Synthesize Audio
                        </button>
                    )}
                </div>
                
                 {(status === 'playing' || status === 'paused' || status === 'ready') && (
                    <footer className="p-4 border-t border-brand-primary/20 bg-white/5 backdrop-blur-md flex flex-col gap-4 animate-slide-up">
                         <div className="flex justify-between items-center">
                            <span className="font-orbitron text-xs text-brand-text-muted tracking-widest uppercase">
                                {status === 'playing' ? 'Now Playing' : (status === 'paused' ? 'Paused' : 'Ready')}
                            </span>
                            <div className="h-10 w-full max-w-xs opacity-80">
                                <AudioVisualizer analyserNode={analyserForVisualizer} width={200} height={40} barColor="#e11d48" gap={3} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-3">
                                 <button 
                                    onClick={handlePlayPauseClick}
                                    className="w-12 h-12 rounded-full bg-brand-text text-brand-bg hover:bg-white hover:scale-110 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95"
                                >
                                    {status === 'playing' ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6 ml-1"/>}
                                </button>
                                <button onClick={stopAudio} className="p-3 rounded-full text-brand-text-muted hover:text-brand-accent hover:bg-white/5 transition-colors active:scale-95">
                                    <StopIcon className="w-6 h-6" />
                                </button>
                             </div>

                             <div className="flex flex-col flex-grow max-w-xs gap-1">
                                <div className="flex justify-between text-[10px] text-brand-text-muted">
                                    <span>Volume</span>
                                    <span>{Math.round(volume * 100)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.01" 
                                    value={volume} 
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-full h-1 bg-brand-surface rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                                />
                             </div>

                            <div className="flex items-center gap-1 bg-black/40 border border-brand-primary/20 rounded-lg p-1">
                                {[1, 1.25, 1.5].map(rate => (
                                    <button 
                                        key={rate} 
                                        onClick={() => setPlaybackRate(rate)}
                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${playbackRate === rate ? 'bg-brand-secondary text-white shadow-sm' : 'text-brand-text-muted hover:bg-white/10'}`}
                                    >
                                       {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default AudioGenerationModal;
