
import React from 'react';
import { HomeIcon, ReelsIcon, CompassIcon, BoltIcon, UserIcon } from './icons';

interface BottomNavProps {
    viewMode: 'grid' | 'reels';
    onChangeView: (mode: 'grid' | 'reels') => void;
    onOpenExplore: () => void;
    onOpenChat: () => void;
    onOpenProfile: () => void;
    isScrolling?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
    viewMode, 
    onChangeView, 
    onOpenExplore,
    onOpenChat,
    onOpenProfile,
    isScrolling = false
}) => {
    
    // Helper to determine active state style
    const getNavItemClass = (isActive: boolean) => 
        `flex flex-col items-center justify-center gap-1 w-full py-3 transition-all duration-300 relative group
         ${isActive 
            ? 'text-brand-accent scale-105' 
            : 'text-brand-text-muted/40 hover:text-white hover:-translate-y-1'
        }`;

    const GlowingSeparator = () => (
        <div className="w-[1px] h-6 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
    );

    return (
        <div 
            className={`
                fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe
                bg-[#050505]/95 backdrop-blur-xl border-t border-white/5
                transition-all duration-300 ease-out
                ${isScrolling 
                    ? 'scale-95 opacity-90 translate-y-2' 
                    : 'scale-100 opacity-100 translate-y-0 shadow-[0_-10px_50px_-10px_rgba(58,190,254,0.3)]'
                }
            `}
        >
            
            {/* Top Glow Line - Intensifies on scroll stop */}
            <div 
                className={`
                    absolute top-0 left-0 right-0 h-[1px] 
                    bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent 
                    transition-all duration-500
                    ${isScrolling ? 'shadow-none opacity-50' : 'shadow-[0_0_15px_#3ABEFE] opacity-100'}
                `}
            ></div>

            <div className="flex justify-between items-center px-2">
                
                {/* 1. Home */}
                <button 
                    onClick={() => onChangeView('grid')}
                    className={getNavItemClass(viewMode === 'grid')}
                >
                    {/* Active Pulse Ring */}
                    {viewMode === 'grid' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full border border-brand-accent/50 shadow-[0_0_15px_rgba(40,255,211,0.3)] animate-pulse-glow"></div>
                        </div>
                    )}
                    
                    <div className={`relative z-10 p-1 rounded-full transition-all ${viewMode === 'grid' ? 'bg-brand-accent/10' : ''}`}>
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
                    <CompassIcon className="h-6 w-6 group-active:scale-95 transition-transform" />
                    <span className="text-[9px] font-orbitron tracking-widest uppercase">Explore</span>
                </button>

                <GlowingSeparator />

                {/* 3. News Reels */}
                <button 
                    onClick={() => onChangeView('reels')}
                    className={getNavItemClass(viewMode === 'reels')}
                >
                     {/* Active Pulse Ring */}
                    {viewMode === 'reels' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full border border-brand-secondary/50 shadow-[0_0_15px_rgba(123,47,255,0.3)] animate-pulse-glow"></div>
                        </div>
                    )}
                    <div className={`relative z-10 p-1 rounded-full transition-all ${viewMode === 'reels' ? 'bg-brand-secondary/10' : ''}`}>
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
                    <BoltIcon className="h-6 w-6 group-active:scale-95 transition-transform" />
                    <span className="text-[9px] font-orbitron tracking-widest uppercase">Chat</span>
                </button>

                <GlowingSeparator />

                 {/* 5. Profile */}
                 <button 
                    onClick={onOpenProfile}
                    className={getNavItemClass(false)}
                >
                    <UserIcon className="h-6 w-6 group-active:scale-95 transition-transform" />
                    <span className="text-[9px] font-orbitron tracking-widest uppercase">Profile</span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
