import React from 'react';

export const QuantumSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg', text?: string }> = ({ size = 'md', text }) => {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-24 h-24',
        lg: 'w-48 h-48'
    };

    const dimensions = sizeClasses[size];

    return (
        <div className="flex flex-col items-center gap-4">
            <div className={`relative ${dimensions} flex items-center justify-center`}>
                <div className="absolute w-full h-full border-4 border-brand-primary/20 rounded-full animate-spin-slow"></div>
                <div className="absolute w-3/4 h-3/4 border-2 border-t-brand-secondary border-r-transparent border-b-brand-accent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute w-1/2 h-1/2 border-2 border-brand-primary border-dashed rounded-full animate-spin-reverse"></div>
                <div className="absolute w-1/4 h-1/4 bg-brand-primary/20 rounded-full animate-pulse-glow shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
            </div>
            {text && (
                <div className="font-orbitron text-brand-primary animate-pulse tracking-widest text-sm uppercase">
                    {text}
                </div>
            )}
        </div>
    );
};

export const HolographicScanner: React.FC<{ text?: string }> = ({ text = "PROCESSING INTEL" }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full py-8 gap-4">
            <div className="relative w-full max-w-xs h-32 border border-brand-primary/30 bg-brand-primary/5 rounded-lg overflow-hidden backdrop-blur-sm group">
                {/* Grid Pattern */}
                <div className="absolute inset-0 grid grid-cols-12 gap-1 opacity-10">
                    {Array.from({length: 48}).map((_,i) => <div key={i} className="bg-brand-primary/50 h-full w-full"></div>)}
                </div>
                
                {/* Scanning Bar */}
                <div className="absolute left-0 right-0 h-1 bg-brand-secondary shadow-[0_0_20px_#6366f1] animate-scan z-10"></div>
                <div className="absolute left-0 right-0 h-8 bg-gradient-to-b from-brand-secondary/20 to-transparent animate-scan z-0" style={{ animationDelay: '0.1s' }}></div>

                {/* Random Data Glitches */}
                <div className="absolute top-2 left-2 text-[10px] text-brand-primary/60 font-mono">
                    System.Analysis(Target);
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-brand-accent/60 font-mono animate-pulse">
                     [ENCRYPTED]
                </div>
            </div>
             <div className="font-orbitron text-brand-primary animate-pulse tracking-[0.2em] text-xs md:text-sm uppercase flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-brand-primary rounded-full animate-ping"></span>
                {text}
            </div>
        </div>
    );
};

export const ThinkingBubble: React.FC = () => {
    return (
        <div className="flex items-center gap-1 h-6">
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
    );
};
