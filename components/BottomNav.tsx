
import React from 'react';
import { HomeIcon, ReelsIcon, MicIcon, BoltIcon, SoundWaveIcon } from './icons';

interface BottomNavProps {
    viewMode: 'grid' | 'reels';
    onChangeView: (mode: 'grid' | 'reels') => void;
    onOpenAudio: () => void;
    onOpenLive: () => void;
    onOpenChat: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
    viewMode, 
    onChangeView, 
    onOpenAudio, 
    onOpenLive, 
    onOpenChat 
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-brand-surface/80 backdrop-blur-md border-t border-brand-primary/30 z-50 md:hidden pb-4 px-6 flex justify-between items-center animate-slide-up">
            <button 
                onClick={() => onChangeView('grid')}
                className={`flex flex-col items-center gap-1 transition-colors ${viewMode === 'grid' ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'}`}
            >
                <div className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-brand-primary/10' : ''}`}>
                    <HomeIcon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-orbitron">Feed</span>
            </button>

            <button 
                onClick={() => onChangeView('reels')}
                className={`flex flex-col items-center gap-1 transition-colors ${viewMode === 'reels' ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'}`}
            >
                <div className={`p-2 rounded-full ${viewMode === 'reels' ? 'bg-brand-primary/10' : ''}`}>
                    <ReelsIcon />
                </div>
                 <span className="text-[10px] font-orbitron">Reels</span>
            </button>

            <button 
                onClick={onOpenLive}
                className="relative -top-6 bg-gradient-to-br from-brand-secondary to-brand-accent p-4 rounded-full shadow-lg border-4 border-brand-bg transform active:scale-95 transition-transform"
                aria-label="Live Agent"
            >
                <MicIcon />
                <div className="absolute inset-0 rounded-full animate-pulse-glow border border-white/20"></div>
            </button>

            <button 
                onClick={onOpenAudio}
                className="flex flex-col items-center gap-1 text-brand-text-muted hover:text-brand-text transition-colors"
            >
                <div className="p-2">
                    <SoundWaveIcon className="h-6 w-6" />
                </div>
                 <span className="text-[10px] font-orbitron">Studio</span>
            </button>

            <button 
                onClick={onOpenChat}
                className="flex flex-col items-center gap-1 text-brand-text-muted hover:text-brand-text transition-colors"
            >
                <div className="p-2">
                    <BoltIcon />
                </div>
                 <span className="text-[10px] font-orbitron">Chat</span>
            </button>
        </div>
    );
};

export default BottomNav;
