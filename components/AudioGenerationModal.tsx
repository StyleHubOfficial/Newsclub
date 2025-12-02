import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateNewsBroadcastSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { NewsArticle } from '../types';
import { CloseIcon, SparklesIcon, UploadIcon, PlayIcon, PauseIcon, StopIcon, SoundWaveIcon } from './icons';
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
        // @ts-ignore
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
                playAudioBuffer(0); // Auto-play
            } else {
                throw new Error("No audio data received from the neural network.");
            }

        } catch (err: any) {
            console.error("Audio Generation Error:", err);
            setError(err.message || "Failed to synthesize audio.");
            setStatus('error');
        } finally {
            clearInterval(intervalId);
            // If we didn't error or finish (though playAudioBuffer sets 'playing'), reset if stuck
            if (status === 'generating') setStatus('idle'); 
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={onClose}>
            {/* Modal Container */}
            <div 
                className="
                    bg-[#0a0a0a]/90 w-full max-w-4xl h-[85vh] 
                    rounded-[30px] border border-white/10 
                    shadow-[0_0_60px_rgba(123,47,255,0.15)] 
                    flex flex-col relative overflow-hidden animate-scale-in
                " 
                onClick={e => e.stopPropagation()}
            >
                {/* Holographic Texture */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>

                {/* Header */}
                <header className="p-6 border-b border-brand-secondary/20 flex justify-between items-center bg-white/5 backdrop-blur-xl relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-secondary/10 rounded-full border border-brand-secondary/30 text-brand-secondary shadow-[0_0_15px_rgba(123,47,255,0.3)]">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <h2 className="font-orbitron text-xl text-white tracking-widest">
                            AUDIO <span className="text-brand-secondary">STUDIO</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative z-10">
                    
                    {/* Left Panel: Configuration */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-white/5 space-y-8">
                        
                        {/* 1. Source Selection */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full"></span> Input Source
                            </label>
                            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
                                <button 
                                    onClick={() => setMode('text')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'text' ? 'bg-brand-secondary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    TEXT
                                </button>
                                <button 
                                    onClick={() => setMode('article')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'article' ? 'bg-brand-secondary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    ARTICLE
                                </button>
                                <button 
                                    onClick={() => setMode('ai-conversation')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'ai-conversation' ? 'bg-brand-secondary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    AI SCRIPT
                                </button>
                            </div>
                        </div>

                        {/* 2. Content Input */}
                        <div className="space-y-4">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full"></span> Content
                            </label>
                            
                            {mode === 'text' && (
                                <textarea 
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Enter text to convert to broadcast speech..."
                                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-secondary outline-none resize-none placeholder-white/20 font-light"
                                />
                            )}

                            {mode === 'article' && (
                                <div className="space-y-3">
                                    <select 
                                        value={selectedArticleId || ''}
                                        onChange={(e) => setSelectedArticleId(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-secondary outline-none"
                                    >
                                        {articles.map(article => (
                                            <option key={article.id} value={article.id} className="bg-black text-white">
                                                {article.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <h4 className="text-xs font-bold text-gray-400 mb-2">Preview</h4>
                                        <p className="text-xs text-gray-500 line-clamp-4 leading-relaxed">
                                            {articles.find(a => a.id === selectedArticleId)?.content || "Select an article to preview content."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mode === 'ai-conversation' && (
                                <div className="space-y-4">
                                    <textarea 
                                        value={aiTopicInput}
                                        onChange={(e) => setAiTopicInput(e.target.value)}
                                        placeholder="Describe a topic (e.g. 'Future of AI') or paste content..."
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-secondary outline-none resize-none placeholder-white/20"
                                    />
                                    <div 
                                        className="border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <UploadIcon className="w-6 h-6 text-gray-500 mb-2" />
                                        <span className="text-xs text-gray-400">Upload Text File (.txt)</span>
                                        <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleFileChange} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Language & Generate */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                             <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Broadcast Language</label>
                                <select 
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as Language)}
                                    className="bg-black border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:border-brand-secondary outline-none"
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Hinglish">Hinglish</option>
                                </select>
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={status === 'generating'}
                                className="
                                    w-full py-4 rounded-xl font-orbitron font-bold tracking-widest text-sm
                                    bg-gradient-to-r from-brand-secondary to-brand-primary 
                                    text-white shadow-[0_0_20px_rgba(123,47,255,0.4)]
                                    hover:shadow-[0_0_30px_rgba(123,47,255,0.6)] hover:scale-[1.02]
                                    active:scale-95 transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center justify-center gap-2
                                "
                            >
                                {status === 'generating' ? 'SYNTHESIZING...' : 'GENERATE AUDIO'}
                                {status !== 'generating' && <SparklesIcon className="w-4 h-4" />}
                            </button>

                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center font-mono">
                                    Error: {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Visualization & Playback */}
                    <div className="w-full md:w-1/2 bg-black/40 flex flex-col relative">
                        {status === 'generating' ? (
                            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6">
                                <HexagonLoader size="lg" />
                                <div className="space-y-2">
                                    <h3 className="text-brand-secondary font-orbitron text-lg animate-pulse">{progressMessage}</h3>
                                    <p className="text-xs text-gray-500 font-mono">Processing neural tensors...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col">
                                {/* Visualizer Area */}
                                <div className="flex-grow flex items-center justify-center p-8 relative overflow-hidden">
                                     {/* Background Glow */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-secondary/20 rounded-full blur-[100px] transition-opacity duration-1000 ${status === 'playing' ? 'opacity-100 animate-pulse' : 'opacity-20'}`}></div>
                                    
                                    <div className="relative z-10 w-full">
                                        {status === 'idle' || status === 'error' ? (
                                            <div className="text-center text-gray-600">
                                                <SoundWaveIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                                <p className="text-sm font-light">Audio visualization will appear here.</p>
                                            </div>
                                        ) : (
                                            <AudioVisualizer 
                                                analyserNode={analyserForVisualizer} 
                                                barColor="#7B2FFF" 
                                                gap={4} 
                                                height={200} 
                                                width={400} 
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Controls Footer */}
                                <div className="p-6 bg-white/5 border-t border-white/10 backdrop-blur-xl">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Play/Pause Main Button */}
                                        <button 
                                            onClick={handlePlayPauseClick}
                                            disabled={status === 'idle' || status === 'error'}
                                            className={`
                                                w-16 h-16 rounded-full flex items-center justify-center transition-all 
                                                border border-white/20 shadow-lg
                                                ${status === 'playing' 
                                                    ? 'bg-brand-secondary text-white shadow-[0_0_20px_#7B2FFF]' 
                                                    : 'bg-white text-black hover:scale-105'}
                                                disabled:opacity-30 disabled:cursor-not-allowed
                                            `}
                                        >
                                            {status === 'playing' ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                                        </button>

                                        {/* Volume & Speed */}
                                        <div className="flex-grow space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-gray-500 w-8">VOL</span>
                                                <input 
                                                    type="range" 
                                                    min="0" max="1" step="0.05" 
                                                    value={volume} 
                                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                    className="flex-grow h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <span className="text-[10px] font-bold text-gray-500 w-8">SPD</span>
                                                 {[0.75, 1, 1.25, 1.5].map(rate => (
                                                     <button 
                                                        key={rate}
                                                        onClick={() => setPlaybackRate(rate)}
                                                        className={`
                                                            px-2 py-1 rounded text-[10px] font-bold transition-colors border border-transparent
                                                            ${playbackRate === rate 
                                                                ? 'bg-white/10 text-white border-white/20' 
                                                                : 'text-gray-600 hover:text-gray-300'}
                                                        `}
                                                     >
                                                         {rate}x
                                                     </button>
                                                 ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioGenerationModal;