
import React, { useState } from 'react';
import { CloseIcon, SettingsIcon } from './icons';

interface Preferences {
    categories: string[];
    sources: string[];
}

interface PersonalizationModalProps {
    allCategories: string[];
    allSources: string[];
    currentPreferences: Preferences;
    onSave: (newPreferences: Preferences) => void;
    onClose: () => void;
}

const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
    allCategories,
    allSources,
    currentPreferences,
    onSave,
    onClose
}) => {
    const [selectedCategories, setSelectedCategories] = useState<string[]>(currentPreferences.categories);
    const [selectedSources, setSelectedSources] = useState<string[]>(currentPreferences.sources);

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

    const handleSourceToggle = (source: string) => {
        setSelectedSources(prev =>
            prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
        );
    };

    const handleSave = () => {
        onSave({ categories: selectedCategories, sources: selectedSources });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
            {/* Glass Container with Page Enter Transition */}
            <div className="
                bg-[#050505]/80 backdrop-blur-2xl 
                w-full max-w-2xl 
                rounded-[22px] 
                shadow-[0_0_60px_-10px_rgba(123,47,255,0.15)] 
                border border-white/10 ring-1 ring-white/5 
                flex flex-col animate-page-enter relative overflow-hidden
            " onClick={(e) => e.stopPropagation()}>
                
                {/* Horizontal Laser Sweep */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-secondary to-transparent z-50 animate-scan-line"></div>

                {/* Header */}
                <header className="p-5 border-b border-brand-secondary/20 flex justify-between items-center bg-white/5 backdrop-blur-xl rounded-t-[22px]">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-secondary/10 rounded-full border border-brand-secondary/30 text-brand-secondary shadow-[0_0_10px_rgba(123,47,255,0.2)]">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <h2 className="font-orbitron text-xl text-white tracking-wider">
                            FEED <span className="text-brand-secondary">CALIBRATION</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full border border-transparent hover:border-white/10 active:scale-95">
                        <CloseIcon />
                    </button>
                </header>

                <div className="p-6 md:p-8 flex-grow overflow-y-auto space-y-10">
                    {/* Categories Section */}
                    <div>
                        <h3 className="font-orbitron text-xs text-brand-primary mb-6 tracking-[0.2em] uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                             <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
                             Topics of Interest
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {allCategories.map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => handleCategoryToggle(cat)} 
                                    className={`
                                        px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border
                                        ${selectedCategories.includes(cat) 
                                            ? 'bg-brand-primary text-[#050505] border-brand-primary shadow-[0_0_15px_rgba(58,190,254,0.5)] scale-105 ring-1 ring-brand-primary/50' 
                                            : 'bg-white/5 text-brand-text-muted border-white/10 hover:bg-white/10 hover:border-brand-primary/30 hover:text-white'}
                                    `}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Sources Section */}
                     <div>
                        <h3 className="font-orbitron text-xs text-brand-secondary mb-6 tracking-[0.2em] uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                            <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full"></span>
                             Data Streams
                        </h3>
                        <div className="flex flex-wrap gap-3">
                             {allSources.map(src => (
                                <button 
                                    key={src} 
                                    onClick={() => handleSourceToggle(src)} 
                                    className={`
                                        px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border
                                        ${selectedSources.includes(src) 
                                            ? 'bg-brand-secondary text-white border-brand-secondary shadow-[0_0_15px_rgba(123,47,255,0.5)] scale-105 ring-1 ring-brand-secondary/50' 
                                            : 'bg-white/5 text-brand-text-muted border-white/10 hover:bg-white/10 hover:border-brand-secondary/30 hover:text-white'}
                                    `}
                                >
                                    {src}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="p-5 border-t border-white/10 flex justify-end gap-4 bg-white/5 backdrop-blur-xl rounded-b-[22px]">
                     <button 
                        onClick={onClose} 
                        className="
                            px-6 py-2.5 rounded-full font-orbitron text-xs font-bold tracking-wider 
                            border border-white/10 text-brand-text-muted 
                            hover:bg-white/10 hover:text-white hover:border-white/30
                            transition-all active:scale-95
                        "
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="
                            group relative overflow-hidden
                            px-8 py-2.5 rounded-full font-orbitron text-xs font-bold tracking-wider 
                            bg-white/5 border border-brand-secondary/50 text-white
                            shadow-[0_0_20px_rgba(123,47,255,0.3)] 
                            hover:shadow-[0_0_30px_rgba(123,47,255,0.5)] hover:border-brand-secondary
                            transition-all transform hover:scale-105 active:scale-95
                        "
                    >
                        <span className="relative z-10">SAVE CONFIG</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-secondary/30 to-transparent -translate-x-full group-hover:animate-sheen z-0"></div>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PersonalizationModal;
