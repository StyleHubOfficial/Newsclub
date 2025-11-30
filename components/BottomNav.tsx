
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
        `flex flex-col items-center justify-center gap-1 w-full py-3 transition-all duration-300 relative group
         ${isActive 
            ? 'text-brand-accent' 
            : 'text-brand-text-muted/40 hover:text-white'
        }`;

    const GlowingSeparator = () => (
        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 z-50 md:hidden animate-slide-up pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.9)]">
            
            {/* Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent shadow-[0_0_10px_#3ABEFE]"></div>

            <div className="flex justify-between items-center px-2">
                
                {/* 1. Home */}
                <button 
                    onClick={() => onChangeView('grid')}
                    className={getNavItemClass(viewMode === 'grid')}
                >
                    {viewMode === 'grid' && (
                        <div className="absolute top-0 w-12 h-[2px] bg-brand-accent shadow-[0_0_15px_#28FFD3] animate-pulse"></div>
                    )}
                    <div className={`p-1 rounded-full transition-all ${viewMode === 'grid' ? 'bg-brand-accent/10 shadow-[0_0_15px_rgba(40,255,211,0.2)]' : ''}`}>
                         <HomeIcon className={`h-6 w-6 ${viewMode === 'grid' ? 'drop-shadow-[0_0_5px_rgba(40,255,211,0.8)]' : ''}`} />
                    </div>
                    <span className={`text-[9px] font-orbitron tracking-widest uppercase ${viewMode === 'grid' ? 'text-white' : ''}`}>Home</span>
                </button>

                <GlowingSeparator />

                {/* 2. Explore */}
                <button 
                    onClick={onOpenExplore}
                    className={getNavItemClass(false)}
                >
                    <CompassIcon className="h-6 w-6" />
                    <span className="text-[9px] font-orbitron tracking-widest uppercase">Explore</span>
                </button>

                <GlowingSeparator />

                {/* 3. News Reels */}
                <button 
                    onClick={() => onChangeView('reels')}
                    className={getNavItemClass(viewMode === 'reels')}
                >
                    {viewMode === 'reels' && (
                         <div className="absolute top-0 w-12 h-[2px] bg-brand-secondary shadow-[0_0_15px_#7B2FFF] animate-pulse"></div>
                    )}
                    <div className={`p-1 rounded-full transition-all ${viewMode === 'reels' ? 'bg-brand-secondary/10 shadow-[0_0_15px_rgba(123,47,255,0.2)]' : ''}`}>
                        <ReelsIcon className={`h-6 w-6 ${viewMode === 'reels' ? 'text-brand-secondary drop-shadow-[0_0_5px_rgba(123,47,255,0.8)]' : ''}`} />
                    </div>
                    <span className={`text-[9px] font-orbitron tracking-widest uppercase ${viewMode === 'reels' ? 'text-white' : ''}`}>Reels</span>
                </button>

                <GlowingSeparator />

                {/* 4. AI Chat */}
                <button 
                    onClick={onOpenChat}
                    className={getNavItemClass(false)}
                >
                    <BoltIcon className="h-6 w-6" />
                    <span className="text-[9px] font-orbitron tracking-widest uppercase">Chat</span>
                </button>

                <GlowingSeparator />

                 {/* 5. Profile */}
                 <button 
                    onClick={onOpenProfile}
                    className={getNavItemClass(false)}
                >
                    <UserIcon className="h-6 w-6" />
                    <span className="text-[9px] font-orbitron tracking-widest uppercase">Profile</span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
