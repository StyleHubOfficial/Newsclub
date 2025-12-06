import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateNewsBroadcastSpeech, generateSpeechFromText } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { NewsArticle } from '../types';
import { CloseIcon, SparklesIcon, UploadIcon, PlayIcon, PauseIcon, StopIcon, SoundWaveIcon } from './icons';
import AudioVisualizer from './AudioVisualizer';
import { HexagonLoader } from './Loaders';
import { User } from 'firebase/auth';

interface AudioGenerationModalProps {
    articles: NewsArticle[];
    onClose: () => void;
    user: User | null;
    onLoginRequest: () => void;
}

type Mode = 'text' | 'article' | 'ai-conversation';
type Language = 'English' | 'Hindi' | 'Hinglish';
const progressMessages = ["INITIALIZING NEURAL NET", "ANALYZING SYNTAX", "SCRIPTING BROADCAST", "SYNTHESIZING AUDIO WAVES", "FINALIZING OUTPUT"];

const AudioGenerationModal: React.FC<AudioGenerationModalProps> = ({ articles, onClose, user, onLoginRequest }) => {
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
    
    // VISUALIZER STATE
    const [analyserForVisualizer, setAnalyserForVisualizer] = useState<AnalyserNode | null>(null);

    // --- Audio Refs ---
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
            // Stop TTS Demo
            window.speechSynthesis.cancel();
        };
    }, []);

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

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e){}
            sourceRef.current.disconnect();
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        
        gain.gain.value = volume;
        source.playbackRate.value = playbackRate;

        source.onended = () => {
            if (ctx.state === 'running') {
               setStatus('ready');
               sourceRef.current = null;
            }
        };

        source.start(0, offset);
        sourceRef.current = source;
        setStatus('playing');
   }, [volume, playbackRate]);

    const handlePlayPauseClick = async () => {
        const ctx = initAudioContext();

        if (status === 'playing') {
            pauseAudio();
        } else if (status === 'paused') {
            await resumeAudio();
        } else if (status === 'ready') {
            if (ctx.state === 'suspended') await ctx.resume();
            playAudioBuffer(0);
        }
    };

    useEffect(() => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
    }, [volume]);

    useEffect(() => {
        if (sourceRef.current) sourceRef.current.playbackRate.value = playbackRate;
    }, [playbackRate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setTextInput(event.target.result as string);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleGenerate = async () => {
        // AUTH CHECK
        if (!user) {
            onLoginRequest();
            return;
        }

        if (status === 'generating') return;
        
        if (mode === 'text' && !textInput.trim()) { setError("Please enter text or upload a file."); return; }
        if (mode === 'ai-conversation' && !aiTopicInput.trim()) { setError("Please enter a topic."); return; }
        
        setError('');
        setStatus('generating');
        setProgressMessage(progressMessages[0]);

        try {
            const ctx = initAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();

            let audioData: string | null = null;
            let textToProcess = '';

            if (mode === 'article') {
                const article = articles.find(a => a.id === selectedArticleId);
                if (!article) throw new Error("Article not found");
                textToProcess = article.content;
                setProgressMessage(progressMessages[2]);
                audioData = await generateNewsBroadcastSpeech(textToProcess, language);
            } 
            else if (mode === 'text') {
                textToProcess = textInput;
                setProgressMessage(progressMessages[3]);
                audioData = await generateSpeechFromText(textToProcess);
            }
            else if (mode === 'ai-conversation') {
                textToProcess = `Breaking news report about: ${aiTopicInput}`;
                setProgressMessage("GENERATING CONTENT...");
                audioData = await generateNewsBroadcastSpeech(textToProcess, language);
            }

            if (!audioData) throw new Error("Failed to generate audio stream.");

            setProgressMessage(progressMessages[4]);

            const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
            audioBufferRef.current = buffer;
            
            setStatus('ready');
            playAudioBuffer(0);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Generation failed.");
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-[#050505]/80 backdrop-blur-2xl w-full max-w-4xl max-h-[90vh] rounded-[24px] shadow-[0_0_50px_rgba(123,47,255,0.15)] border border-white/10 ring-1 ring-white/5 flex flex-col relative overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Decor */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-secondary to-transparent z-50 animate-scan-line"></div>

                <header className="p-5 border-b border-brand-secondary/20 flex justify-between items-center bg-white/5 backdrop-blur-xl relative z-10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-secondary/10 rounded-full border border-brand-secondary/30 text-brand-secondary shadow-[0_0_10px_rgba(123,47,255,0.2)]">
                            <SoundWaveIcon className="w-5 h-5" />
                        </div>
                        <h2 className="font-orbitron text-xl text-white tracking-wider">
                            AUDIO <span className="text-brand-secondary">SYNTHESIS</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 relative z-10">
                    {/* Mode Selection */}
                    <div className="grid grid-cols-3 gap-4">
                        {(['text', 'article', 'ai-conversation'] as Mode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`
                                    py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all
                                    ${mode === m 
                                        ? 'bg-brand-secondary/20 border-brand-secondary text-white shadow-[0_0_15px_rgba(123,47,255,0.3)]' 
                                        : 'bg-white/5 border-white/10 text-brand-text-muted hover:bg-white/10'}
                                `}
                            >
                                {m.replace('-', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Inputs */}
                    <div className="min-h-[200px]">
                        {mode === 'article' && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase">Select Source Material</label>
                                <select 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand-secondary"
                                    value={selectedArticleId || ''}
                                    onChange={(e) => setSelectedArticleId(Number(e.target.value))}
                                >
                                    {articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                </select>
                            </div>
                        )}

                        {mode === 'text' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Input Text</label>
                                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs text-brand-secondary hover:text-white transition-colors">
                                        <UploadIcon className="w-4 h-4" /> Upload .txt
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleFileChange} />
                                </div>
                                <textarea 
                                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white resize-none outline-none focus:border-brand-secondary"
                                    placeholder="Type or paste text here to synthesize..."
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                />
                            </div>
                        )}

                        {mode === 'ai-conversation' && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase">Topic / Prompt</label>
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-brand-secondary placeholder-gray-600"
                                    placeholder="E.g., The future of renewable energy..."
                                    value={aiTopicInput}
                                    onChange={(e) => setAiTopicInput(e.target.value)}
                                />
                                <div className="p-4 bg-brand-secondary/5 rounded-xl border border-brand-secondary/20 flex items-start gap-3">
                                    <SparklesIcon className="w-5 h-5 text-brand-secondary flex-shrink-0 mt-1" />
                                    <p className="text-xs text-brand-text-muted leading-relaxed">
                                        The AI will generate a professional news report script based on your topic and then synthesize it into a broadcast-quality audio stream with multiple speakers.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                     {/* Language Selector */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Output Language</label>
                        <div className="flex gap-3">
                            {(['English', 'Hindi', 'Hinglish'] as Language[]).map(l => (
                                <button 
                                    key={l}
                                    onClick={() => setLanguage(l)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${language === l ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center font-mono">
                            ERROR: {error}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <footer className="p-5 border-t border-white/10 bg-[#0a0a0a] relative z-10">
                    {status === 'generating' ? (
                        <div className="flex flex-col items-center gap-4 py-2">
                            <HexagonLoader size="sm" text={progressMessage} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {(status === 'ready' || status === 'playing' || status === 'paused') && (
                                <div className="flex items-center justify-between gap-6 animate-slide-up">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={handlePlayPauseClick}
                                            className="w-12 h-12 rounded-full bg-brand-secondary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_#7B2FFF]"
                                        >
                                            {status === 'playing' ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-1" />}
                                        </button>
                                        <button onClick={stopAudio} className="p-2 text-gray-500 hover:text-white">
                                            <StopIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex-grow h-12 bg-black/40 rounded-xl border border-white/5 overflow-hidden relative">
                                        <div className="absolute inset-0 opacity-60">
                                            <AudioVisualizer analyserNode={analyserForVisualizer} width={500} height={48} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {(status === 'idle' || status === 'error') && (
                                <button 
                                    onClick={handleGenerate}
                                    className="
                                        group relative w-full py-4 rounded-xl overflow-hidden
                                        bg-white/5 border border-brand-secondary/50
                                        text-white font-orbitron font-bold text-lg tracking-[0.2em] 
                                        shadow-[0_0_20px_rgba(123,47,255,0.3)]
                                        hover:bg-brand-secondary/20 hover:border-brand-secondary hover:shadow-[0_0_40px_rgba(123,47,255,0.5)] 
                                        active:scale-[0.98] transition-all
                                    "
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {status === 'error' ? 'RETRY SYNTHESIS' : 'INITIALIZE SYNTHESIS'} <SparklesIcon className="w-5 h-5" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-secondary/30 to-transparent -translate-x-full group-hover:animate-sheen skew-x-12 z-0"></div>
                                </button>
                            )}
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default AudioGenerationModal;