
import React from 'react';
import { SearchResult } from '../types';
import { CloseIcon, SearchIcon, LinkIcon } from './icons';
import { HolographicScanner } from './Loaders';

interface SearchResultsModalProps {
    result: SearchResult;
    onClose: () => void;
    isLoading: boolean;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ result, onClose, isLoading }) => {
    return (
        <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            {/* FLOATING GLASS PANEL */}
            <div className="
                bg-[#050505]/80 backdrop-blur-2xl 
                w-full max-w-3xl max-h-[85vh] 
                rounded-[22px] 
                shadow-[0_0_50px_rgba(40,255,211,0.15)] 
                border border-white/10 ring-1 ring-white/5 
                flex flex-col animate-page-enter relative overflow-hidden
            " onClick={(e) => e.stopPropagation()}>
                
                {/* Holographic Texture */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>

                {/* Horizontal Laser Sweep */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent to-transparent z-50 animate-scan-line"></div>

                {/* Header */}
                <header className="p-5 border-b border-brand-accent/20 flex justify-between items-center bg-white/5 backdrop-blur-xl z-10 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-accent/10 rounded-full border border-brand-accent/30 text-brand-accent shadow-[0_0_10px_rgba(40,255,211,0.2)]">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                        <h2 className="font-orbitron text-xl text-white tracking-wider">
                            GLOBAL <span className="text-brand-accent">INTELLIGENCE</span>
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-brand-text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full border border-transparent hover:border-white/10 active:scale-95"
                    >
                        <CloseIcon />
                    </button>
                </header>

                {/* Content */}
                <div className="p-6 md:p-8 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-brand-accent/20 scrollbar-track-transparent relative z-10">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-64 gap-4">
                            <HolographicScanner text="SCANNING NEURAL WEB" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="
                                prose prose-invert max-w-none 
                                prose-p:text-brand-text-muted prose-p:font-light prose-p:leading-relaxed 
                                prose-headings:font-orbitron prose-headings:text-white
                                prose-a:text-brand-accent prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-brand-primary prose-strong:font-normal
                            " dangerouslySetInnerHTML={{ __html: result.text.replace(/\n/g, '<br />') }}></div>
                            
                            {result.sources && result.sources.length > 0 && (
                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="font-orbitron text-xs font-bold text-brand-primary mb-4 tracking-[0.2em] uppercase flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></span>
                                        Verified Sources
                                    </h3>
                                    <div className="grid gap-3">
                                        {result.sources.map((source, index) => (
                                            <a 
                                                key={index} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="
                                                    flex items-center gap-3 p-3 rounded-xl
                                                    bg-white/5 border border-white/5 
                                                    hover:bg-white/10 hover:border-brand-accent/30 hover:shadow-[0_0_15px_rgba(40,255,211,0.1)]
                                                    transition-all group
                                                "
                                            >
                                                <div className="p-2 bg-black/40 rounded-lg text-brand-text-muted group-hover:text-brand-accent transition-colors">
                                                    <LinkIcon className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm text-brand-text-muted group-hover:text-white truncate font-light tracking-wide transition-colors">
                                                    {source.title || source.uri}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchResultsModal;