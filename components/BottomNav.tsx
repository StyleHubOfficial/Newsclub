
import React from 'react';
import { HomeIcon, ReelsIcon, CompassIcon, BoltIcon, UserIcon } from './icons';

interface BottomNavProps {
    viewMode: 'grid' | 'reels';
    onChangeView: (mode: 'grid' | 'reels') => void;
    onOpenExplore: () => void;
    onOpenChat: () => void;
    onOpenProfile: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
    viewMode, 
    onChangeView, 
    onOpenExplore,
    onOpenChat,
    onOpenProfile
}) => {
    // Helper to determine active state style
    const getNavItemClass = (isActive: boolean) => 
        `flex flex-col items-center justify-center gap-1.5 w-full py-2 transition-all duration-300 ${
            isActive 
            ? 'text-brand-primary' 
            : 'text-brand-text-muted hover:text-brand-text'
        }`;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-brand-surface/95 backdrop-blur-xl border-t border-brand-primary/20 rounded-t-2xl z-50 md:hidden flex justify-between items-center px-2 pb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-slide-up">
            
            {/* 1. Home */}
            <button 
                onClick={() => onChangeView('grid')}
                className={getNavItemClass(viewMode === 'grid')}
            >
                <HomeIcon className={`h-6 w-6 ${viewMode === 'grid' ? 'drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]' : ''}`} />
                <span className="text-[10px] font-orbitron font-medium tracking-wide">Home</span>
            </button>

            {/* 2. Explore */}
            <button 
                onClick={onOpenExplore}
                className={getNavItemClass(false)}
            >
                <CompassIcon className="h-6 w-6" />
                <span className="text-[10px] font-orbitron font-medium tracking-wide">Explore</span>
            </button>

            {/* 3. News Reels */}
            <button 
                onClick={() => onChangeView('reels')}
                className={`${getNavItemClass(viewMode === 'reels')} relative`}
            >
                <div className={`p-1 rounded-full transition-transform ${viewMode === 'reels' ? 'bg-brand-secondary/20 scale-110' : ''}`}>
                    <ReelsIcon className={`h-6 w-6 ${viewMode === 'reels' ? 'text-brand-secondary drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : ''}`} />
                </div>
                <span className={`text-[10px] font-orbitron font-medium tracking-wide ${viewMode === 'reels' ? 'text-brand-secondary' : ''}`}>Reels</span>
            </button>

            {/* 4. AI Chat */}
            <button 
                onClick={onOpenChat}
                className={getNavItemClass(false)}
            >
                <BoltIcon className="h-6 w-6" />
                <span className="text-[10px] font-orbitron font-medium tracking-wide">AI Chat</span>
            </button>

             {/* 5. Profile */}
             <button 
                onClick={onOpenProfile}
                className={getNavItemClass(false)}
            >
                <UserIcon className="h-6 w-6" />
                <span className="text-[10px] font-orbitron font-medium tracking-wide">Profile</span>
            </button>
        </div>
    );
};

export default BottomNav;
