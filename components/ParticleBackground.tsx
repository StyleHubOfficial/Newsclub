
import React, { useEffect, useState } from 'react';

const ParticleBackground: React.FC = () => {
    const [offsetY, setOffsetY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
             // Basic parallax stub if needed globally, but CSS animation handles most movement
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050505]">
            {/* 1. Faint Circuit Pattern Overlay - Parallax Movement simulated via CSS animation */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] animate-float" style={{ animationDuration: '20s' }}></div>

            {/* 2. Soft Glowing Gradients (Blobs) */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse-glow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-[100px] animate-float"></div>

            {/* 3. Floating Particles Layer */}
            <div className="absolute inset-0">
                {/* Generate random particles via CSS */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white/20 animate-float"
                        style={{
                            width: Math.random() * 4 + 1 + 'px',
                            height: Math.random() * 4 + 1 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDuration: Math.random() * 10 + 10 + 's',
                            animationDelay: Math.random() * 5 + 's',
                            opacity: Math.random() * 0.5
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default ParticleBackground;
