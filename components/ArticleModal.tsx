
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle, AnalysisResult } from '../types';
import { getFastSummary, getDeepAnalysis, generateNewsBroadcastSpeech } from '../services/geminiService';
import { CloseIcon, ListIcon, BrainIcon, VolumeIcon, ChartIcon, ShareIcon, TwitterIcon, FacebookIcon, MailIcon, LinkIcon, BookmarkIcon, PlayIcon, PauseIcon } from './icons';
import { decode, decodeAudioData } from '../utils/audioUtils';
import AudioVisualizer from './AudioVisualizer';
import InteractiveChart from './InteractiveChart';
import { HolographicScanner, ThinkingBubble, QuantumSpinner } from './Loaders';

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
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const [language, setLanguage] = useState<Language>('English');
    const [error, setError] = useState<string | null>(null);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0); // Tracking time (visual only for now)

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0); // Time when paused
    
    const shareButtonRef = useRef<HTMLButtonElement>(null);

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

         // If strictly resuming from suspension
         if (audioContextRef.current.state === 'suspended') {
             resumeAudio();
             return;
         }

         // Stop previous source if exists (restart case)
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
             // Only reset if it naturally ended, not manually stopped/paused via suspend
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
        
        // If we have buffer and paused/stopped, just resume or play
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
                    <h3 className="font-orbitron text-2xl mb-4 text-brand-primary">{analysisResult.title}</h3>
                    <div className="prose prose-invert max-w-none text-brand-text-muted whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: analysisResult.content.replace(/\n/g, '<br />') }} />
                </div>
            );
        }

        return (
            <div>
                 <h3 className="font-orbitron text-2xl mb-4 text-brand-primary">Full Article</h3>
                <p className="text-brand-text-muted whitespace-pre-wrap">{article.content}</p>
            </div>
        );
    };

    const articleUrl = encodeURIComponent(article.url || window.location.href);
    const articleTitle = encodeURIComponent(article.title);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            {isAudioLoading && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <QuantumSpinner text="SYNTHESIZING BROADCAST" />
                </div>
            )}
            <div className="bg-brand-surface w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl border border-brand-primary/30 flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-brand-primary/20 flex justify-between items-center">
                    <h2 className="font-orbitron text-2xl text-brand-secondary truncate pr-4">{article.title}</h2>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary transition-colors flex-shrink-0">
                        <CloseIcon />
                    </button>
                </header>
                
                {error && (
                    <div className="bg-brand-accent/20 border-l-4 border-brand-accent p-4 m-4 mb-0 text-brand-text">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                <div className="p-6 flex-grow overflow-y-auto">
                    {renderContent()}
                </div>
                
                {(isPlaying || audioBufferRef.current) && (
                    <div className="p-4 border-t border-brand-primary/20 bg-black/40 backdrop-blur-md flex flex-col gap-4 animate-slide-up transition-all duration-300">
                        <div className="flex justify-between items-center">
                            <span className="font-orbitron text-sm text-brand-primary tracking-widest">NEURAL AUDIO PLAYER</span>
                            {/* Visualizer */}
                             <div className="h-12 w-48 hidden sm:block">
                                <AudioVisualizer analyserNode={analyserNodeRef.current} width={192} height={48} barColor="#00f3ff" />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Controls */}
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => isPlaying ? pauseAudio() : playAudioBuffer(0)}
                                    className="w-12 h-12 rounded-full bg-brand-primary hover:bg-brand-secondary text-white flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all"
                                >
                                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-1" />}
                                </button>
                                
                                <div className="flex flex-col gap-1 w-32">
                                    <div className="flex justify-between text-[10px] text-brand-text-muted font-orbitron">
                                        <span>VOL</span>
                                        <span>{Math.round(volume * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.01" 
                                        value={volume} 
                                        onChange={(e) => setVolume(Number(e.target.value))}
                                        className="w-full h-1 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    />
                                </div>
                            </div>
                             
                             {/* Speed Control */}
                             <div className="flex items-center gap-2 bg-brand-bg/50 p-1.5 rounded-full border border-brand-primary/20">
                                {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                                    <button 
                                        key={rate} 
                                        onClick={() => setPlaybackRate(rate)}
                                        className={`px-2 py-1 text-[10px] font-orbitron font-bold rounded-full transition-all ${playbackRate === rate ? 'bg-brand-primary text-white shadow-[0_0_10px_rgba(14,165,233,0.6)]' : 'text-brand-text-muted hover:text-white'}`}
                                    >
                                       {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <footer className="p-4 border-t border-brand-primary/20 space-y-4">
                    <div className="flex flex-wrap gap-2 justify-start items-center">
                        <button onClick={() => { setActiveTab('full'); setAnalysisResult(null); }} className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${activeTab === 'full' ? 'bg-brand-primary text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}>
                           Full Text
                        </button>
                        <button onClick={() => { setActiveTab('summary'); handleGenerate('summary'); }} className={`px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'summary' ? 'bg-brand-primary text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}>
                            <ListIcon /> Summary
                        </button>
                        <button onClick={() => { setActiveTab('analysis'); handleGenerate('analysis'); }} className={`px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-brand-primary text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}>
                            <BrainIcon /> Analysis
                        </button>
                        {article.dataPoints && (
                             <button onClick={() => { setActiveTab('data'); setAnalysisResult(null); }} className={`px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'data' ? 'bg-brand-primary text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}>
                                <ChartIcon /> Data
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold mr-2 hidden sm:inline">Language:</span>
                            {(['English', 'Hindi', 'Hinglish'] as Language[]).map(lang => (
                                 <button key={lang} onClick={() => setLanguage(lang)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${language === lang ? 'bg-brand-secondary text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}>
                                    {lang}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                 <button ref={shareButtonRef} onClick={() => setShareOpen(p => !p)} className="p-2 rounded font-semibold text-sm bg-brand-bg hover:bg-brand-primary/20 transition-colors flex items-center gap-2">
                                    <ShareIcon />
                                </button>
                                {isShareOpen && (
                                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-brand-bg border border-brand-primary/20 rounded-lg shadow-lg p-2 z-10 animate-fade-in">
                                        <a href={`https://twitter.com/intent/tweet?url=${articleUrl}&text=${articleTitle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-brand-surface rounded">
                                            <TwitterIcon /> Share on X
                                        </a>
                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${articleUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-brand-surface rounded">
                                            <FacebookIcon /> Share on Facebook
                                        </a>
                                         <a href={`mailto:?subject=${articleTitle}&body=Check%20out%20this%20article:%20${articleUrl}`} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-brand-surface rounded">
                                            <MailIcon /> Share via Email
                                        </a>
                                        <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-brand-surface rounded">
                                            <LinkIcon /> {copyStatus}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => onToggleSave(article.id)} className={`px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2 ${isSaved ? 'bg-brand-secondary text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}>
                               <BookmarkIcon isSaved={isSaved} /> {isSaved ? 'Saved' : 'Save'}
                            </button>
                             <button onClick={handleTextToSpeech} disabled={(isAudioLoading && !isPlaying && !audioBufferRef.current) || activeTab === 'data'} className="px-4 py-2 rounded font-semibold text-sm bg-brand-accent text-white hover:bg-opacity-80 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px] justify-center shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                                {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />} 
                                {isPlaying ? 'Pause' : (isAudioLoading ? <ThinkingBubble /> : (audioBufferRef.current ? 'Resume Broadcast' : 'Start Broadcast'))}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ArticleModal;
