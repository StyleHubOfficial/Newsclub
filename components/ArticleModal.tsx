
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle, AnalysisResult } from '../types';
import { getFastSummary, getDeepAnalysis, generateNewsBroadcastSpeech } from '../services/geminiService';
import { CloseIcon, ListIcon, BrainIcon, VolumeIcon, ChartIcon, ShareIcon, TwitterIcon, FacebookIcon, MailIcon, LinkIcon, BookmarkIcon, PlayIcon, PauseIcon, StopIcon } from './icons';
import { decode, decodeAudioData } from '../utils/audioUtils';
import AudioVisualizer from './AudioVisualizer';
import InteractiveChart from './InteractiveChart';
import { HolographicScanner } from './Loaders';

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
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0); 

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    
    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const langButtonRef = useRef<HTMLButtonElement>(null);

    const initAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            gainNodeRef.current = audioContextRef.current.createGain();
            analyserNodeRef.current = audioContextRef.current.createAnalyser();
            gainNodeRef.current.connect(analyserNodeRef.current);
            analyserNodeRef.current.connect(audioContextRef.current.destination);
        }
    };

    const stopAudio = useCallback(() => {
        if (sourceRef.current) {
            try {
                sourceRef.current.stop();
            } catch (e) { /* ignore */ }
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setCurrentTime(0);
    }, []);

    const pauseAudio = useCallback(() => {
        if (audioContextRef.current?.state === 'running') {
            audioContextRef.current.suspend();
            setIsPlaying(false);
        }
    }, []);

    const resumeAudio = useCallback(() => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
            setIsPlaying(true);
        }
    }, []);

    const playAudioBuffer = useCallback((offset: number = 0) => {
         if (!audioBufferRef.current || !audioContextRef.current || !gainNodeRef.current) return;

         if (audioContextRef.current.state === 'suspended') {
             resumeAudio();
             return;
         }

         if (sourceRef.current) {
             try { sourceRef.current.stop(); } catch(e){}
             sourceRef.current.disconnect();
         }

         const source = audioContextRef.current.createBufferSource();
         source.buffer = audioBufferRef.current;
         source.connect(gainNodeRef.current);
         gainNodeRef.current.gain.value = volume;
         source.playbackRate.value = playbackRate;

         source.onended = () => {
             if (audioContextRef.current?.state === 'running') {
                setIsPlaying(false);
                setCurrentTime(0);
                pauseTimeRef.current = 0;
             }
         };

         source.start(0, offset);
         startTimeRef.current = audioContextRef.current.currentTime - offset;
         sourceRef.current = source;
         setIsPlaying(true);
    }, [volume, playbackRate, resumeAudio]);


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
        if (isPlaying) {
            pauseAudio();
            return;
        }
        
        if (audioBufferRef.current) {
            if (audioContextRef.current?.state === 'suspended') {
                resumeAudio();
            } else {
                playAudioBuffer(0);
            }
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
        try {
            initAudioContext();
            const audioData = await generateNewsBroadcastSpeech(textToRead, language);
            if (audioData && audioContextRef.current) {
                const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
                audioBufferRef.current = buffer;
                setAudioDuration(buffer.duration);
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
        if (isLoading && !analysisResult && !isPlaying) {
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

    return (
        <div className="fixed inset-0 bg-brand-bg/95 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-surface w-full max-w-5xl max-h-[90vh] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-brand-primary/30 flex flex-col animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header Image */}
                <div className="h-40 md:h-56 relative flex-shrink-0">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent"></div>
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm z-10"
                    >
                        <CloseIcon />
                    </button>
                    <div className="absolute bottom-4 left-6 right-6">
                         <span className="inline-block bg-brand-primary/90 text-brand-bg font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2">
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
                <div className="flex flex-col md:flex-row items-center justify-between p-3 border-b border-brand-primary/20 bg-brand-surface/50 backdrop-blur-md gap-4 relative z-20">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        <button 
                            onClick={() => setActiveTab('full')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'full' ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-brand-primary/10'}`}
                        >
                            Read Full
                        </button>
                        <button 
                            onClick={() => handleGenerate('summary')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'summary' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-secondary/10'}`}
                            disabled={isLoading}
                        >
                            <ListIcon /> Summarize
                        </button>
                        <button 
                            onClick={() => handleGenerate('analysis')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'analysis' ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:bg-brand-accent/10'}`}
                            disabled={isLoading}
                        >
                            <BrainIcon /> Deep Analysis
                        </button>
                        {article.dataPoints && (
                             <button 
                                onClick={() => setActiveTab('data')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'data' ? 'bg-emerald-500 text-white' : 'text-brand-text-muted hover:bg-emerald-500/10'}`}
                            >
                                <ChartIcon /> Data
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end relative">
                         {/* Audio Controls */}
                         <div className="relative flex items-center gap-2 bg-brand-bg rounded-lg p-1.5 border border-brand-primary/20">
                            {isAudioLoading && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-bg z-10">
                                    <div className="h-full bg-brand-accent animate-scan"></div>
                                </div>
                            )}
                            
                            <button 
                                onClick={handleTextToSpeech}
                                disabled={isAudioLoading}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isPlaying ? 'bg-brand-accent text-white animate-pulse' : 'bg-brand-surface text-brand-text-muted hover:text-brand-primary'}`}
                            >
                                {isAudioLoading ? <div className="w-4 h-4 border-2 border-brand-text-muted border-t-transparent rounded-full animate-spin"></div> : (isPlaying ? <PauseIcon className="w-4 h-4" /> : <VolumeIcon />)}
                            </button>
                            
                            {isPlaying ? (
                                <>
                                    <div className="w-16 h-8 hidden sm:block">
                                        <AudioVisualizer analyserNode={analyserNodeRef.current} width={64} height={32} barColor="#e11d48" gap={1} />
                                    </div>
                                    <button onClick={stopAudio} className="p-1 hover:text-brand-accent">
                                        <StopIcon className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                 <div className="relative" ref={langButtonRef as any}>
                                    <button 
                                        onClick={() => setLangOpen(!isLangOpen)}
                                        className="text-xs font-orbitron text-brand-text-muted hover:text-brand-primary px-2 flex items-center gap-1 min-w-[3rem] justify-center"
                                        disabled={isPlaying}
                                    >
                                        {language === 'English' ? 'EN' : language === 'Hindi' ? 'HI' : 'HIN'}
                                        <span className="text-[8px]">▼</span>
                                    </button>
                                    
                                    {isLangOpen && (
                                        <div className="absolute top-full mt-2 right-0 bg-brand-bg border border-brand-primary/50 rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] z-[100] flex flex-col w-32 overflow-hidden">
                                            {(['English', 'Hindi', 'Hinglish'] as Language[]).map(l => (
                                                <button 
                                                    key={l}
                                                    onClick={() => { setLanguage(l); setLangOpen(false); }}
                                                    className={`px-4 py-3 text-left text-xs font-bold hover:bg-brand-primary/20 transition-colors border-b border-white/5 last:border-0 ${language === l ? 'text-brand-primary' : 'text-brand-text-muted'}`}
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
                                className="p-2 rounded-full text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                            >
                                <ShareIcon />
                            </button>
                            {isShareOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-brand-primary/20 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                                    <button onClick={handleCopyLink} className="w-full text-left px-4 py-3 hover:bg-brand-primary/10 flex items-center gap-3 text-sm text-brand-text transition-colors">
                                        <LinkIcon /> {copyStatus}
                                    </button>
                                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(article.url || window.location.href)}`} target="_blank" rel="noopener noreferrer" className="w-full text-left px-4 py-3 hover:bg-brand-primary/10 flex items-center gap-3 text-sm text-brand-text transition-colors">
                                        <TwitterIcon /> Twitter
                                    </a>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => onToggleSave(article.id)} 
                            className={`p-2 rounded-full transition-colors ${isSaved ? 'text-brand-primary bg-brand-primary/10' : 'text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/10'}`}
                        >
                            <BookmarkIcon isSaved={isSaved} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow p-4 md:p-6 overflow-y-auto scroll-smooth">
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm flex justify-between items-center">
                            {error}
                            <button onClick={() => setError(null)}><CloseIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ArticleModal;
