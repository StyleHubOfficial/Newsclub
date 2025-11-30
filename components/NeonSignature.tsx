
import React from 'react';

const NeonSignature: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => {
    return (
        <div className={`relative group cursor-default select-none flex flex-col items-center ${size === 'lg' ? 'mt-8' : ''}`}>
            {/* Glow Background - Very subtle */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-primary via-purple-500 to-brand-accent opacity-5 blur-xl group-hover:opacity-15 transition-opacity duration-700"></div>
            
            <div className="relative flex flex-col items-center">
                <span className={`font-orbitron text-brand-text-muted/60 tracking-[0.3em] uppercase ${size === 'lg' ? 'text-xs mb-1' : 'text-[8px] mb-0.5'} font-light`}>
                    Architected & Designed By
                </span>
                <div className={`font-signature text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-primary to-white ${size === 'lg' ? 'text-4xl md:text-5xl' : 'text-xl'} drop-shadow-[0_0_8px_rgba(58,190,254,0.3)] animate-pulse`}>
                    Lakshya Bhamu
                </div>
                {/* Animated Underline */}
                <div className="h-[1px] w-1/2 bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent mt-1 transform scale-x-50 group-hover:scale-x-100 transition-transform duration-700 ease-out"></div>
            </div>
        </div>
    );
};

export default NeonSignature;
