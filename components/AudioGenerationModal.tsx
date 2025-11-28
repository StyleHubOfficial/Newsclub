
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateSpeechFromText, generateNewsBroadcastSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { NewsArticle } from '../types';
import { CloseIcon, SparklesIcon, UploadIcon, PlayIcon, PauseIcon, StopIcon } from './icons';
import AudioVisualizer from './AudioVisualizer';
import { QuantumSpinner } from './Loaders';

interface AudioGenerationModalProps {
    articles: NewsArticle[];
    onClose: () => void;
}

type Mode = 'text' | 'article' | 'ai-conversation';
type Language = 'English' | 'Hindi' | 'Hinglish';
const progressMessages = ["INITIALIZING NEURAL NET", "ANALYZING SYNTAX", "SYNTHESIZING AUDIO WAVES", "FINALIZING OUTPUT"];

const AudioGenerationModal: React.FC<AudioGenerationModalProps> = ({ articles, onClose }) => {
    const [mode, setMode] = useState<Mode>('text');
    const [textInput, setTextInput] = useState('');
    const [aiTopicInput, setAiTopicInput] = useState('');
    const [selectedArticleId, setSelectedArticleId] = useState<number | null>(articles[0]?.id || null);
    const [language, setLanguage] = useState<Language>('English');
    
    const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'playing' | 'paused' | 'error'>('idle');
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState('');

    // Audio Player State
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
             gainNodeRef.current = audioContextRef.current.createGain();
             analyserNodeRef.current = audioContextRef.current.createAnalyser();
             gainNodeRef.current.connect(analyserNodeRef.current);
             analyserNodeRef.current.connect(audioContextRef.current.destination);
        }
    };

    const stopAudio = useCallback(() => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch(e){}
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (status === 'playing' || status === 'paused') {
            setStatus('ready');
        }
    }, [status]);

    useEffect(() => {
        return () => { // Cleanup on unmount
            stopAudio();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        }
    }, [stopAudio]);
    
    const playAudio = useCallback(() => {
        if (!audioBufferRef.current || !audioContextRef.current || !gainNodeRef.current) return;

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
            setStatus('playing');
            return;
        }

        // Clean up previous source
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
             // Only if naturally ended
             if (audioContextRef.current?.state === 'running') {
                setStatus('ready');
                sourceRef.current = null;
             }
        };

        source.start(0);
        sourceRef.current = source;
        setStatus('playing');
    }, [volume, playbackRate]);

    const pauseAudio = useCallback(() => {
        if (audioContextRef.current?.state === 'running') {
            audioContextRef.current.suspend();
            setStatus('paused');
        }
    }, []);

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
        
        let intervalId = 0;
        let messageIndex = 0;
        intervalId = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % progressMessages.length;
            setProgressMessage(progressMessages[messageIndex]);
        }, 1500);
        setProgressMessage(progressMessages[0]);

        try {
            let audioData: string | null = null;
            if (mode === 'text') {
                if (!textInput.trim()) throw new Error("Please enter some text to generate audio.");
                audioData = await generateSpeechFromText(textInput);
            } else if (mode === 'ai-conversation') {
                if (!aiTopicInput.trim()) throw new Error("Please enter a topic or upload a file to generate a conversation.");
                audioData = await generateNewsBroadcastSpeech(aiTopicInput, language);
            } else {
                const article = articles.find(a => a.id === selectedArticleId);
                if (!article) throw new Error("Please select a valid article.");
                audioData = await generateNewsBroadcastSpeech(article.content, language);
            }
            
            if (audioData) {
                initAudioContext();
                if(audioContextRef.current) {
                    const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
                    audioBufferRef.current = buffer;
                    setStatus('ready'); // Ready to play
                    playAudio(); // Auto play
                }
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

    const selectedArticle = articles.find(a => a.id === selectedArticleId);

    return (
        <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-lg flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-black/50 w-full max-w-3xl rounded-lg shadow-2xl border border-brand-primary/30 flex flex-col animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-brand-primary/20 bg-brand-surface/50">
                    <h2 className="font-orbitron text-xl text-brand-secondary">Audio Synthesis Agent</h2>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary transition-colors">
                        <CloseIcon />
                    </button>
                </header>
                
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="bg-brand-bg/50 border border-brand-primary/20 rounded-full p-1 flex gap-1 w-min">
                            <button onClick={() => setMode('text')} className={`px-4 py-1.5 rounded-full font-semibold transition-colors text-sm ${mode === 'text' ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-brand-surface'}`}>Text-to-Speech</button>
                            <button onClick={() => setMode('article')} className={`px-4 py-1.5 rounded-full font-semibold transition-colors text-sm ${mode === 'article' ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-brand-surface'}`}>Article Broadcast</button>
                            <button onClick={() => setMode('ai-conversation')} className={`px-4 py-1.5 rounded-full font-semibold transition-colors text-sm flex items-center gap-2 ${mode === 'ai-conversation' ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-brand-surface'}`}>
                                <SparklesIcon/> AI Conversation
                            </button>
                        </div>
                         <div className={`flex items-center gap-2 transition-opacity duration-300 ${mode === 'text' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            {(['English', 'Hindi', 'Hinglish'] as Language[]).map(lang => (
                                <button key={lang} onClick={() => setLanguage(lang)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${language === lang ? 'bg-brand-secondary text-white' : 'bg-brand-bg hover:bg-brand-primary/20'}`}>
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {status === 'generating' ? (
                        <div className="flex flex-col items-center justify-center h-48 py-8 animate-fade-in">
                            <QuantumSpinner text={progressMessage} />
                        </div>
                    ) : (
                        <>
                            {mode === 'text' && (
                                <textarea 
                                    value={textInput}
                                    onChange={e => setTextInput(e.target.value)}
                                    placeholder="Type or paste text here to generate a single-speaker narration..."
                                    className="w-full h-32 bg-brand-bg border-2 border-brand-secondary/50 rounded-lg p-4 focus:outline-none focus:border-brand-primary transition-colors text-brand-text resize-none"
                                />
                            )}
                            {mode === 'article' && (
                                <div>
                                     <select 
                                        value={selectedArticleId || ''} 
                                        onChange={e => setSelectedArticleId(Number(e.target.value))}
                                        className="w-full bg-brand-bg border-2 border-brand-secondary/50 rounded-full py-2 px-4 focus:outline-none focus:border-brand-primary transition-colors text-brand-text mb-2"
                                     >
                                        {articles.map(article => <option key={article.id} value={article.id}>{article.title}</option>)}
                                    </select>
                                    <p className="text-sm text-brand-text-muted h-10 overflow-hidden text-ellipsis">{selectedArticle?.summary}</p>
                                </div>
                            )}
                            {mode === 'ai-conversation' && (
                                 <div className="relative">
                                    <textarea 
                                        value={aiTopicInput}
                                        onChange={e => setAiTopicInput(e.target.value)}
                                        placeholder="Describe a topic... The AI will generate a news-style conversation about it. You can also upload a .txt file."
                                        className="w-full h-32 bg-brand-bg border-2 border-brand-secondary/50 rounded-lg p-4 focus:outline-none focus:border-brand-primary transition-colors text-brand-text pr-28 resize-none"
                                    />
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt" />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-brand-bg border border-brand-secondary/50 rounded-full text-sm font-semibold text-brand-text-muted hover:bg-brand-surface hover:text-brand-text transition-colors"
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
                        <div className="bg-brand-accent/20 border border-brand-accent rounded p-3 text-brand-text text-center text-sm">
                            <span className="font-bold">Error:</span> {error}
                            <button onClick={() => setStatus('idle')} className="ml-4 underline">Reset</button>
                        </div>
                    </div>
                )}

                <div className="px-6 pb-6 text-center min-h-[60px] flex flex-col justify-center">
                    {(status === 'idle' || status === 'error') && (
                        <button onClick={handleGenerate} className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-bold py-3 px-8 rounded-full text-lg transform hover:scale-105 transition-transform duration-300 self-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                           Synthesize Audio
                        </button>
                    )}
                </div>
                
                 {(status === 'playing' || status === 'paused' || status === 'ready') && (
                    <footer className="p-4 border-t border-brand-primary/20 bg-brand-bg/80 backdrop-blur-md flex flex-col gap-4 animate-slide-up">
                         <div className="flex justify-between items-center">
                            <span className="font-orbitron text-xs text-brand-text-muted tracking-widest uppercase">
                                {status === 'playing' ? 'Now Playing' : (status === 'paused' ? 'Paused' : 'Ready')}
                            </span>
                            <div className="h-10 w-full max-w-xs opacity-80">
                                <AudioVisualizer analyserNode={analyserNodeRef.current} width={200} height={40} barColor="#e11d48" gap={3} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-3">
                                 <button 
                                    onClick={status === 'playing' ? pauseAudio : playAudio}
                                    className="w-10 h-10 rounded-full bg-brand-text text-brand-bg hover:bg-white flex items-center justify-center transition-colors"
                                >
                                    {status === 'playing' ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5 ml-1"/>}
                                </button>
                                <button onClick={stopAudio} className="p-2 text-brand-text-muted hover:text-brand-accent transition-colors">
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

                            <div className="flex items-center gap-1 bg-brand-bg border border-brand-primary/20 rounded-lg p-1">
                                {[1, 1.25, 1.5].map(rate => (
                                    <button 
                                        key={rate} 
                                        onClick={() => setPlaybackRate(rate)}
                                        className={`px-2 py-1 text-[10px] font-bold rounded ${playbackRate === rate ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-surface'}`}
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
