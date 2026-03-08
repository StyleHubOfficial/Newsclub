import React, { useState } from 'react';
import { generateImageFromPrompt } from '../services/geminiService';
import { CloseIcon, ImageIcon, DownloadIcon, SparklesIcon } from './icons';
import { HexagonLoader } from './Loaders';

interface ImageGenerationModalProps {
    onClose: () => void;
}

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-image-preview');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageUrl = await generateImageFromPrompt(prompt, aspectRatio, selectedModel);
            setGeneratedImage(imageUrl);
        } catch (err: any) {
            setError(err.message || "Failed to generate image.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const a = document.createElement('a');
        a.href = generatedImage;
        a.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const imageModels = [
        { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2' },
        { id: 'gemini-2.5-flash-image', name: 'Nano Banana' },
        { id: 'imagen-3.0-generate-001', name: 'Imagen 3 Standard' },
        { id: 'imagen-3.0-fast-generate-001', name: 'Imagen 3 Fast' },
        { id: 'imagen-2.0-generate-001', name: 'Imagen 2' },
        { id: 'imagen-1.0-generate-001', name: 'Imagen 1' },
        { id: 'imagen-3.0-generate-001', name: 'Imagen' },
    ];

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-[#050505]/80 backdrop-blur-2xl w-full max-w-4xl max-h-[90vh] rounded-[24px] shadow-[0_0_50px_rgba(58,190,254,0.15)] border border-white/10 ring-1 ring-white/5 flex flex-col relative overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Decor */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary to-transparent z-50 animate-scan-line"></div>

                <header className="p-5 border-b border-brand-primary/20 flex justify-between items-center bg-white/5 backdrop-blur-xl relative z-10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/10 rounded-full border border-brand-primary/30 text-brand-primary shadow-[0_0_10px_rgba(58,190,254,0.2)]">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h2 className="font-orbitron text-xl text-white tracking-wider">
                            IMAGE <span className="text-brand-primary">GENERATOR</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full border border-transparent hover:border-white/10 active:scale-95">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-grow p-6 md:p-8 overflow-y-auto relative z-10 flex flex-col md:flex-row gap-6">
                    
                    {/* Controls */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Model</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary outline-none transition-colors appearance-none font-light"
                            >
                                {imageModels.map(model => (
                                    <option key={model.id} value={model.id} className="bg-[#050505] text-white">
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe a futuristic city..."
                                className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-primary outline-none transition-colors resize-none placeholder-gray-600 font-light"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`
                                            py-2 rounded-lg border text-xs font-mono transition-all
                                            ${aspectRatio === ratio 
                                                ? 'bg-brand-primary/20 border-brand-primary text-white shadow-[0_0_10px_rgba(58,190,254,0.3)]' 
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}
                                        `}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="
                                w-full group relative px-6 py-4 rounded-xl overflow-hidden
                                bg-gradient-to-r from-brand-primary to-blue-600
                                text-white font-orbitron font-bold tracking-widest shadow-[0_0_30px_rgba(58,190,254,0.4)]
                                hover:shadow-[0_0_50px_rgba(58,190,254,0.6)] hover:scale-105
                                active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? 'GENERATING...' : 'GENERATE'} <SparklesIcon className="w-4 h-4" />
                            </span>
                        </button>
                        
                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-xs font-mono">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="w-full md:w-2/3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden min-h-[300px]">
                        {isLoading ? (
                            <HexagonLoader size="lg" text="RENDERING PIXELS" />
                        ) : generatedImage ? (
                            <div className="relative w-full h-full flex items-center justify-center group">
                                <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain shadow-2xl" />
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-brand-primary hover:border-brand-primary transition-all text-xs font-bold font-orbitron"
                                    >
                                        <DownloadIcon className="w-4 h-4" /> DOWNLOAD
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-600">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-light">Enter a prompt to generate visuals</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerationModal;
