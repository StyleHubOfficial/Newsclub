import React from 'react';

const NeonSignature: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => {
    return (
        <div className={`
            inline-flex items-center gap-3 px-4 py-1.5 rounded-full 
            bg-white/5 border border-white/5 backdrop-blur-md 
            shadow-[0_0_15px_rgba(58,190,254,0.1)] 
            hover:bg-white/10 hover:border-white/10 hover:shadow-[0_0_20px_rgba(58,190,254,0.2)]
            transition-all duration-500 cursor-default group select-none
            ${size === 'lg' ? 'scale-125' : 'scale-100'}
        `}>
            <span className="text-[9px] font-orbitron text-brand-text-muted/60 tracking-[0.2em] uppercase">
                Designed By
            </span>
            <div className="h-3 w-[1px] bg-white/10"></div>
            <span className="text-sm font-signature text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-white to-brand-accent drop-shadow-[0_0_5px_rgba(58,190,254,0.5)] group-hover:animate-pulse">
                Lakshya Bhamu
            </span>
        </div>
    );
};

export default NeonSignature;