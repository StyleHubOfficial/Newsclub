import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle, AnalysisResult } from '../types';
import { getFastSummary, getDeepAnalysis, generateNewsBroadcastSpeech } from '../services/geminiService';
import { CloseIcon, ListIcon, BrainIcon, VolumeIcon, ChartIcon, ShareIcon, TwitterIcon, LinkIcon, BookmarkIcon, PlayIcon, PauseIcon, StopIcon } from './icons';
import { decode, decodeAudioData } from '../utils/audioUtils';
import AudioVisualizer from './AudioVisualizer';
import InteractiveChart from './InteractiveChart';
import { HexagonLoader, HolographicScanner } from './Loaders';

type Language = 'English' | 'Hindi' | 'Hinglish';
type ActiveTab = 'full' | 'summary' | 'analysis' | 'data';

interface ArticleModalProps {
    article: NewsArticle;
    onClose: () => void;
    onToggleSave: (articleId: number) => void;
    isSaved: boolean;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose, onToggleSave, isSaved }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('full');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isShareOpen, setShareOpen] = useState(false);
    const [isLangOpen, setLangOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const [language, setLanguage] = useState<Language>('English');
    const [error, setError] = useState<string | null>(null);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [audioReady, setAudioReady] = useState(false);
    
    // VISUALIZER STATE
    const [analyserForVisualizer, setAnalyserForVisualizer] = useState<AnalyserNode | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    
    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const langButtonRef = useRef<HTMLButtonElement>(null);

    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            
            const gain = ctx.createGain();
            const analyser = ctx.createAnalyser();
            
            // Connect Gain -> Analyser -> Destination
            gain.connect(analyser);
            analyser.connect(ctx.destination);
            
            audioContextRef.current = ctx;
            gainNodeRef.current = gain;
            analyserNodeRef.current = analyser;
            
            // Update State to trigger Visualizer render
            setAnalyserForVisualizer(analyser);
        }
        return audioContextRef.current;
    }, []);

    const stopAudio = useCallback(() => {
        if (sourceRef.current) {
            try {
                sourceRef.current.stop();
            } catch (e) { /* ignore */ }
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const pauseAudio = useCallback(() => {
        if (audioContextRef.current?.state === 'running') {
            audioContextRef.current.suspend();
            setIsPlaying(false);
        }
    }, []);

    const resumeAudio = useCallback(async () => {
        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
            setIsPlaying(true);
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
         
         // Connect Source -> Gain
         source.connect(gain);
         
         gain.gain.value = volume;
         source.playbackRate.value = playbackRate;

         source.onended = () => {
             if (ctx.state === 'running') {
                setIsPlaying(false);
             }
         };

         source.start(0, offset);
         sourceRef.current = source;
         setIsPlaying(true);
    }, [volume, playbackRate]);


    const handleGenerate = useCallback(async (type: 'summary' | 'analysis') => {
        setIsLoading(true);
        setAnalysisResult(null);
        setError(null);
        setActiveTab(type);
        try {
            const generator = type === 'summary' ? getFastSummary : getDeepAnalysis;
            const content = await generator(article.content);
            setAnalysisResult({
                title: type === 'summary' ? 'AI Summary' : 'AI Deep Analysis',
                content: content
            });
        } catch (err) {
            console.error(`Failed to generate ${type}:`, err);
            setError(`Could not generate ${type}. Please try again later.`);
        } finally {
            setIsLoading(false);
        }
    }, [article.content]);

    const handleTextToSpeech = async () => {
        // Init context immediately on user click
        const ctx = initAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();

        if (audioReady && audioBufferRef.current) {
            if (isPlaying) pauseAudio();
            else playAudioBuffer(0);
            return;
        }
        
        if (activeTab === 'data') return;

        let textToRead = '';
        if (activeTab !== 'full' && analysisResult) {
            textToRead = analysisResult.content;
        } else {
            textToRead = article.content;
        }

        setIsAudioLoading(true);
        setError(null);
        stopAudio();
        
        try {
            const audioData = await generateNewsBroadcastSpeech(textToRead, language);
            if (audioData) {
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                audioBufferRef.current = buffer;
                setAudioReady(true);
                playAudioBuffer(0);
            } else {
                setError("Failed to synthesize audio.");
            }
        } catch (err) {
             setError("Audio generation error. Check your connection or try again.");
             console.error(err);
        } finally {
            setIsAudioLoading(false);
        }
    };
    
    useEffect(() => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
    }, [volume]);

    useEffect(() => {
        if (sourceRef.current) sourceRef.current.playbackRate.value = playbackRate;
    }, [playbackRate]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            stopAudio();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        }
    }, [onClose, stopAudio]);

    const handleCopyLink = () => {
        const url = article.url || window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        });
    };

    const renderContent = () => {
        if (isLoading && !analysisResult) {
            return (
                <div className="flex justify-center items-center h-64">
                    <HolographicScanner text="PROCESSING CONTENT" />
                </div>
            );
        }
        
        if (activeTab === 'data' && article.dataPoints) {
            return <InteractiveChart data={article.dataPoints} title={article.visualizationTitle || 'Data Visualization'} />
        }

        if (activeTab !== 'full' && analysisResult) {
            return (
                <div>
                    <h3 className="font-orbitron text-xl mb-4 text-brand-primary">{analysisResult.title}</h3>
                    <div className="prose prose-sm prose-invert max-w-none text-brand-text-muted whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: analysisResult.content.replace(/\n/g, '<br />') }} />
                </div>
            );
        }

        return (
            <div>
                 <h3 className="font-orbitron text-xl mb-4 text-brand-primary">Full Article</h3>
                <p className="text-brand-text leading-relaxed whitespace-pre-wrap text-sm md:text-base">{article.content}</p>
            </div>
        );
    };

    // Updated Tab Button Style
    const tabButtonStyle = (isActive: boolean, activeColorClass: string, borderColorClass: string) => `
        px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-300 relative
        ${isActive 
            ? `bg-${activeColorClass}/10 text-${activeColorClass} border-${borderColorClass} shadow-[0_0_15px_${borderColorClass === 'brand-primary' ? '#3ABEFE' : borderColorClass === 'brand-secondary' ? '#7B2FFF' : '#28FFD3'}] ring-1 ring-${activeColorClass}/30` 
            : 'border-white/10 bg-transparent text-brand-text-muted hover:bg-white/5 hover:border-white/30 hover:text-white'}
        active:scale-95
    `;

    // Neon Circular Action Icon Style
    const actionIconClass = `
        relative group/icon overflow-hidden
        p-2 rounded-full transition-all duration-300 border border-white/10 
        bg-black/40 text-brand-text-muted
        hover:text-white hover:bg-white/10 hover:border-white/30
        hover:scale-110 hover:rotate-12
        active:scale-95 active:animate-ripple
    `;

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            {/* FLOATING GLASS PANEL - MODAL */}
            <div 
                className="
                    bg-[#050505]/80 backdrop-blur-2xl 
                    w-full max-w-5xl max-h-[90vh] 
                    rounded-[24px] 
                    shadow-[0_0_50px_rgba(58,190,254,0.15)] 
                    border border-white/10 ring-1 ring-white/5 
                    flex flex-col animate-page-enter relative overflow-hidden
                " 
                onClick={e => e.stopPropagation()}
            >
                {/* HOLOGRAPHIC TEXTURE OVERLAY */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>

                {/* Horizontal Laser Sweep */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent to-transparent z-50 animate-scan-line"></div>

                {/* Header Image */}
                <div className="h-40 md:h-56 relative flex-shrink-0 group">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover opacity-80 transition-transform duration-[2s] group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors backdrop-blur-md border border-white/10 z-10 hover:border-white/30 active:scale-95"
                    >
                        <CloseIcon />
                    </button>
                    <div className="absolute bottom-4 left-6 right-6 z-10">
                         <span className="inline-block bg-brand-primary/20 text-brand-primary border border-brand-primary/50 font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2 backdrop-blur-md shadow-[0_0_10px_rgba(58,190,254,0.3)]">
                            {article.category}
                        </span>
                        <h2 className="font-orbitron text-xl md:text-3xl text-white drop-shadow-lg leading-tight line-clamp-2">{article.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-300">
                             <span>{article.source}</span>
                             <span>•</span>
                             <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between p-3 border-b border-white/10 bg-white/5 backdrop-blur-xl gap-4 relative z-20">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        <button 
                            onClick={() => setActiveTab('full')}
                            className={tabButtonStyle(activeTab === 'full', 'brand-primary', 'brand-primary')}
                        >
                            Read Full
                        </button>
                        <button 
                            onClick={() => handleGenerate('summary')}
                            className={`flex items-center gap-2 ${tabButtonStyle(activeTab === 'summary', 'brand-secondary', 'brand-secondary')}`}
                            disabled={isLoading}
                        >
                            <ListIcon /> Summarize
                        </button>
                        <button 
                            onClick={() => handleGenerate('analysis')}
                            className={`flex items-center gap-2 ${tabButtonStyle(activeTab === 'analysis', 'brand-accent', 'brand-accent')}`}
                            disabled={isLoading}
                        >
                            <BrainIcon /> Deep Analysis
                        </button>
                        {article.dataPoints && (
                             <button 
                                onClick={() => setActiveTab('data')}
                                className={`flex items-center gap-2 ${tabButtonStyle(activeTab === 'data', 'emerald-400', 'emerald-500')}`}
                            >
                                <ChartIcon /> Data
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end relative">
                         {/* Audio Agent */}
                         <div className="relative flex items-center gap-2 bg-black/40 rounded-full p-1 border border-white/10 shadow-inner">
                            <button 
                                onClick={handleTextToSpeech}
                                disabled={isAudioLoading}
                                className={`
                                    flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 active:scale-95
                                    ${audioReady 
                                        ? 'text-black bg-brand-accent shadow-[0_0_15px_#28FFD3] animate-pulse-glow font-bold ring-1 ring-brand-accent' 
                                        : 'text-brand-text-muted hover:text-white hover:bg-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'}
                                `}
                            >
                                <VolumeIcon />
                                <span className="text-xs font-bold font-orbitron">{isAudioLoading ? 'GENERATING...' : 'AUDIO AGENT'}</span>
                            </button>
                            
                            {!isAudioLoading && !audioReady && (
                                 <div className="relative" ref={langButtonRef as any}>
                                    <button 
                                        onClick={() => setLangOpen(!isLangOpen)}
                                        className="text-xs font-orbitron text-brand-text-muted hover:text-white px-3 py-1.5 flex items-center gap-1 min-w-[3rem] justify-center border-l border-white/10 hover:bg-white/5 transition-colors"
                                    >
                                        {language === 'English' ? 'EN' : language === 'Hindi' ? 'HI' : 'HIN'}
                                        <span className="text-[8px]">▼</span>
                                    </button>
                                    
                                    {isLangOpen && (
                                        <div className="absolute top-full mt-2 right-0 bg-[#0a0a0a] border border-white/10 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] z-[100] flex flex-col w-32 overflow-hidden backdrop-blur-xl">
                                            {(['English', 'Hindi', 'Hinglish'] as Language[]).map(l => (
                                                <button 
                                                    key={l}
                                                    onClick={() => { setLanguage(l); setLangOpen(false); }}
                                                    className={`px-4 py-3 text-left text-xs font-bold hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 ${language === l ? 'text-brand-primary' : 'text-brand-text-muted'}`}
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                         <div className="relative" ref={shareButtonRef as any}>
                            <button 
                                onClick={() => setShareOpen(!isShareOpen)}
                                className={actionIconClass}
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity"></div>
                                <ShareIcon className="relative z-10" />
                            </button>
                            {isShareOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                                    <button onClick={handleCopyLink} className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 text-sm text-brand-text transition-colors">
                                        <LinkIcon /> {copyStatus}
                                    </button>
                                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(article.url || window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 text-sm text-brand-text transition-colors">
                                        <TwitterIcon /> Twitter
                                    </a>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => onToggleSave(article.id)} 
                            className={`
                                group/icon relative overflow-hidden
                                p-2 rounded-full transition-all duration-300 border border-transparent 
                                ${isSaved 
                                    ? 'text-brand-primary bg-brand-primary/10 shadow-[0_0_10px_rgba(58,190,254,0.2)] border-brand-primary/30' 
                                    : 'text-brand-text-muted hover:text-white hover:bg-white/10 hover:border-white/10'}
                                hover:scale-110 hover:rotate-12
                                active:scale-95 active:animate-ripple
                            `}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity"></div>
                            <BookmarkIcon isSaved={isSaved} className="relative z-10" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow p-4 md:p-6 overflow-y-auto scroll-smooth relative z-10">
                    {isAudioLoading && (
                        <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm z-30 flex items-center justify-center animate-fade-in rounded-[22px]">
                             <HexagonLoader text="SYNTHESIZING AUDIO" />
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex justify-between items-center backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            {error}
                            <button onClick={() => setError(null)}><CloseIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                    {renderContent()}
                </div>
                
                 {/* Full Audio Player Interface - Hi-Tech Redesign */}
                 {(audioReady || isAudioLoading) && !isAudioLoading && (
                    <footer className="p-4 border-t border-brand-primary/20 bg-white/5 backdrop-blur-md flex flex-col gap-4 animate-slide-up relative z-30">
                         <div className="flex justify-between items-center">
                            <span className="font-orbitron text-xs text-brand-text-muted tracking-widest uppercase flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-brand-accent animate-pulse' : 'bg-gray-500'}`}></span>
                                {isPlaying ? 'Playing Stream' : 'Stream Paused'}
                            </span>
                            {/* Visualizer using the state node */}
                            <div className="h-10 w-full max-w-xs opacity-80">
                                <AudioVisualizer analyserNode={analyserForVisualizer} width={200} height={40} barColor="#e11d48" gap={3} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-3">
                                 {/* Primary Circular Button */}
                                 <button 
                                    onClick={isPlaying ? pauseAudio : () => playAudioBuffer(0)}
                                    className="
                                        w-12 h-12 rounded-full flex items-center justify-center transition-all 
                                        bg-white text-black 
                                        shadow-[0_0_20px_rgba(255,255,255,0.4)]
                                        hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] 
                                        active:scale-95
                                        border border-white/50
                                    "
                                >
                                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6 ml-1"/>}
                                </button>
                                {/* Secondary Circular Button */}
                                <button onClick={stopAudio} className="p-3 rounded-full text-brand-text-muted hover:text-brand-accent hover:bg-white/5 transition-colors active:scale-95 border border-transparent hover:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                    <StopIcon className="w-6 h-6" />
                                </button>
                             </div>

                             <div className="flex flex-col flex-grow max-w-xs gap-1">
                                <div className="flex justify-between text-[10px] text-brand-text-muted font-orbitron">
                                    <span>Gain Level</span>
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

export default ArticleModal;