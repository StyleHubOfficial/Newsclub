
import React from 'react';

const NeonSignature: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => {
    return (
        <div className={`relative group cursor-default select-none ${size === 'lg' ? 'mt-4 md:mt-8' : ''}`}>
            {/* Glow Background - Reduced intensity */}
            <div className="absolute -inset-2 bg-gradient-to-r from-neon-cyan via-purple-500 to-neon-pink opacity-10 blur-md group-hover:opacity-25 transition-opacity duration-500 animate-pulse-glow"></div>
            
            <div className="relative flex flex-col items-start">
                <span className={`font-orbitron text-brand-primary tracking-[0.2em] uppercase ${size === 'lg' ? 'text-[10px] md:text-sm' : 'text-[8px]'} mb-0`}>
                    Architected & Designed By
                </span>
                <div className={`font-signature text-transparent bg-clip-text bg-gradient-to-r from-white via-neon-cyan to-white ${size === 'lg' ? 'text-3xl md:text-6xl' : 'text-xl'} drop-shadow-[0_0_2px_#00f3ff] animate-pulse`}>
                    Lakshya Bhamu
                </div>
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-accent to-transparent mt-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
        </div>
    );
};

export default NeonSignature;
