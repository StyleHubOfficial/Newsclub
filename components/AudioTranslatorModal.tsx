import React, { useState } from 'react';
import { translateAudio } from '../services/geminiService';
import { CloseIcon, MicIcon, SparklesIcon } from './icons';
import { HexagonLoader } from './Loaders';

interface AudioTranslatorModalProps {
    onClose: () => void;
}

const AudioTranslatorModal: React.FC<AudioTranslatorModalProps> = ({ onClose }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('English');
    const [translatedAudio, setTranslatedAudio] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('TRANSLATE');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTranslate = async () => {
        if (!audioFile) return;
        setIsLoading(true);
        setStatus('TRANSCRIBING & TRANSLATING...');
        setError(null);
        setTranslatedAudio(null);

        try {
            const audioBase64 = await translateAudio(
                audioFile, 
                sourceLang, 
                targetLang,
                (newStatus) => setStatus(newStatus)
            );
            setStatus('DONE');
            setTranslatedAudio(`data:audio/wav;base64,${audioBase64}`);
        } catch (err: any) {
            setError(err.message || "Failed to translate audio.");
        } finally {
            setIsLoading(false);
            setStatus('TRANSLATE');
        }
    };

    const languages = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'];

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-[#050505]/80 backdrop-blur-2xl w-full max-w-2xl rounded-[24px] shadow-[0_0_50px_rgba(58,190,254,0.15)] border border-white/10 ring-1 ring-white/5 flex flex-col relative overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <header className="p-5 border-b border-brand-primary/20 flex justify-between items-center bg-white/5 backdrop-blur-xl relative z-10">
                    <h2 className="font-orbitron text-xl text-white tracking-wider">
                        AUDIO <span className="text-brand-primary">TRANSLATOR</span>
                    </h2>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                        <CloseIcon />
                    </button>
                </header>

                <div className="p-6 space-y-6">
                    <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white">
                            <option value="auto">Auto-detect</option>
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white">
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={handleTranslate}
                        disabled={isLoading || !audioFile}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-blue-600 text-white font-orbitron font-bold tracking-widest shadow-[0_0_30px_rgba(58,190,254,0.4)] hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {status}
                    </button>

                    {error && <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-xs font-mono">{error}</div>}

                    {translatedAudio && (
                        <div className="mt-4 space-y-3">
                            <audio controls src={translatedAudio} className="w-full" />
                            <a 
                                href={translatedAudio} 
                                download="translated_audio.wav"
                                className="block w-full text-center py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-all"
                            >
                                Download Audio
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioTranslatorModal;
