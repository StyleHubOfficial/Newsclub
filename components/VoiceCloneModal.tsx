
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseIcon, MicIcon, StopIcon, PlayIcon, FingerprintIcon, DownloadIcon, PauseIcon, VolumeIcon } from './icons';
import AudioVisualizer from './AudioVisualizer';
import { generateSpeechFromText } from '../services/geminiService';
import { decode, decodeAudioData, audioBufferToWav } from '../utils/audioUtils';
import { HexagonLoader, HolographicScanner } from './Loaders';

interface VoiceCloneModalProps {
    onClose: () => void;
}

const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<'record' | 'input' | 'processing' | 'result'>('record');
    const [isRecording, setIsRecording] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [clonedAudioBuffer, setClonedAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const inputAnalyserRef = useRef<AnalyserNode | null>(null); // For microphone viz

    // Cleanup
    useEffect(() => {
        return () => {
            if (sourceRef.current) sourceRef.current.stop();
            if (audioContextRef.current) audioContextRef.current.close();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const initAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            inputAnalyserRef.current = audioContextRef.current.createAnalyser();
        }
        return audioContextRef.current;
    };

    const startRecording = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            // Connect for visualizer
            const ctx = initAudioContext();
            if(inputAnalyserRef.current) {
                const source = ctx.createMediaStreamSource(stream);
                source.connect(inputAnalyserRef.current);
            }

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setStep('input');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error:", err);
            setError("Microphone access denied. Please verify permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleGenerate = async () => {
        if (!textInput.trim()) return;
        
        setStep('processing');
        setError(null);

        try {
            // NOTE: In a real "Voice Clone" API (like ElevenLabs), we would send 'audioBlob' 
            // as the reference file. The current Gemini API does not publicly support 
            // "Few-Shot Voice Cloning" from audio upload in the standard endpoint yet.
            // We simulate the *UX flow* here, but use a high-quality prebuilt voice ('Fenrir') 
            // to represent the "Synthesized Identity".
            
            const base64Audio = await generateSpeechFromText(textInput, 'Fenrir');
            
            if (base64Audio) {
                const ctx = initAudioContext();
                if (ctx.state === 'suspended') await ctx.resume();
                
                const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                setClonedAudioBuffer(buffer);
                setStep('result');
            } else {
                throw new Error("Failed to synthesize audio.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Generation failed.");
            setStep('input');
        }
    };

    const playAudio = useCallback(() => {
        if (!clonedAudioBuffer || !audioContextRef.current) return;
        
        if (isPlaying) {
            if (sourceRef.current) sourceRef.current.stop();
            setIsPlaying(false);
            return;
        }

        const ctx = audioContextRef.current;
        const source = ctx.createBufferSource();
        source.buffer = clonedAudioBuffer;
        
        // Connect to Analyser then Destination
        if (analyserRef.current) {
            source.connect(analyserRef.current);
            analyserRef.current.connect(ctx.destination);
        } else {
            source.connect(ctx.destination);
        }

        source.onended = () => setIsPlaying(false);
        source.start();
        sourceRef.current = source;
        setIsPlaying(true);
    }, [clonedAudioBuffer, isPlaying]);

    const handleDownload = () => {
        if (!clonedAudioBuffer) return;
        try {
            const blob = audioBufferToWav(clonedAudioBuffer);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `voice_clone_${Date.now()}.wav`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="
                    bg-[#050505]/80 backdrop-blur-2xl 
                    w-full max-w-lg 
                    rounded-[24px] 
                    shadow-[0_0_50px_rgba(40,255,211,0.2)] 
                    border border-white/10 ring-1 ring-white/5 
                    flex flex-col relative overflow-hidden animate-scale-in
                " 
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent to-transparent z-50 animate-scan-line"></div>

                {/* Header */}
                <header className="p-6 border-b border-brand-accent/20 flex justify-between items-center bg-white/5 backdrop-blur-xl relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-accent/10 rounded-full border border-brand-accent/30 text-brand-accent shadow-[0_0_10px_rgba(40,255,211,0.2)]">
                            <FingerprintIcon className="w-6 h-6" />
                        </div>
                        <h2 className="font-orbitron text-xl text-white tracking-wider">
                            VOICE <span className="text-brand-accent">CLONE</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full border border-transparent hover:border-white/10 active:scale-95">
                        <CloseIcon />
                    </button>
                </header>

                <div className="p-8 flex flex-col items-center justify-center flex-grow relative z-10 min-h-[300px]">
                    
                    {error && (
                        <div className="absolute top-4 w-full px-8">
                            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center">
                                {error}
                            </div>
                        </div>
                    )}

                    {step === 'record' && (
                        <div className="flex flex-col items-center gap-6 w-full animate-fade-in">
                            <div className="text-center space-y-2">
                                <h3 className="font-orbitron text-sm text-brand-primary tracking-widest uppercase">Identity Calibration</h3>
                                <p className="text-xs text-brand-text-muted">Read the following text clearly to map your vocal biometric signature.</p>
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center italic text-brand-text/90 font-light w-full relative overflow-hidden">
                                "The quick brown fox jumps over the lazy dog to verify my neural identity."
                                <div className="absolute bottom-0 left-0 h-1 bg-brand-accent transition-all duration-300" style={{ width: isRecording ? '100%' : '0%' }}></div>
                            </div>

                            <div className="h-16 w-full flex items-center justify-center">
                                {isRecording ? (
                                    <AudioVisualizer analyserNode={inputAnalyserRef.current} width={200} height={50} barColor="#28FFD3" />
                                ) : (
                                    <div className="text-xs text-gray-600 font-mono">READY TO RECORD</div>
                                )}
                            </div>

                            <button 
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`
                                    w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300
                                    ${isRecording 
                                        ? 'border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse' 
                                        : 'border-brand-accent bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-black hover:shadow-[0_0_30px_rgba(40,255,211,0.4)]'}
                                `}
                            >
                                {isRecording ? <StopIcon className="w-8 h-8" /> : <MicIcon className="w-8 h-8" />}
                            </button>
                        </div>
                    )}

                    {step === 'input' && (
                        <div className="flex flex-col items-center gap-6 w-full animate-slide-up">
                            <div className="flex items-center gap-2 text-brand-accent">
                                <FingerprintIcon className="w-8 h-8" />
                                <span className="font-orbitron text-lg tracking-widest">VOICE CAPTURED</span>
                            </div>
                            
                            <textarea 
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Enter text to generate speech in your cloned voice..."
                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-accent outline-none resize-none font-light"
                            />

                            <button 
                                onClick={handleGenerate}
                                disabled={!textInput.trim()}
                                className="
                                    w-full py-4 rounded-xl 
                                    bg-gradient-to-r from-brand-accent to-teal-600 
                                    text-black font-orbitron font-bold tracking-widest
                                    shadow-[0_0_20px_rgba(40,255,211,0.3)]
                                    hover:shadow-[0_0_30px_rgba(40,255,211,0.5)] hover:scale-[1.02]
                                    active:scale-95 transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                "
                            >
                                SYNTHESIZE AUDIO
                            </button>
                            
                            <button onClick={() => setStep('record')} className="text-xs text-brand-text-muted hover:text-white underline">
                                Re-record Identity
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
                            <HexagonLoader size="lg" text="CLONING VOICE PATTERN" />
                            <div className="w-64">
                                <HolographicScanner text="MAPPING NEURAL PROSODY" />
                            </div>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="flex flex-col items-center gap-8 w-full animate-scale-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-accent/20 blur-xl rounded-full animate-pulse-glow"></div>
                                <FingerprintIcon className="w-24 h-24 text-brand-accent relative z-10" />
                            </div>
                            
                            <div className="w-full bg-white/5 border border-brand-accent/30 rounded-2xl p-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-brand-accent animate-ping' : 'bg-gray-500'}`}></span>
                                        <span className="text-xs font-orbitron text-brand-accent tracking-widest">CLONE_OUTPUT_V1.wav</span>
                                    </div>
                                </div>
                                
                                <div className="h-16 bg-black/40 rounded-lg overflow-hidden border border-white/5 relative flex items-center justify-center">
                                     <AudioVisualizer analyserNode={analyserRef.current} width={300} height={64} barColor="#28FFD3" />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={playAudio}
                                        className="flex-1 py-3 bg-brand-accent text-black font-bold font-orbitron rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                                        {isPlaying ? 'PAUSE' : 'PLAY CLONE'}
                                    </button>
                                    <button 
                                        onClick={handleDownload}
                                        className="px-4 py-3 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                                        title="Download"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setStep('input')} className="text-xs text-brand-text-muted hover:text-white">
                                Generate Another
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default VoiceCloneModal;
