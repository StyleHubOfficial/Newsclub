import React from 'react';

const ThreeDEarth: React.FC = () => {
    return (
        // Removed animate-float to stop up/down movement
        <div className="relative w-40 h-40 md:w-96 md:h-96 perspective-1000 my-4 md:my-0">
            {/* Outer Holographic Rings */}
            <div className="absolute inset-[-20%] border border-brand-primary/20 rounded-full animate-spin-slow" style={{ transform: 'rotateX(70deg)' }}></div>
            <div className="absolute inset-[-10%] border border-brand-secondary/30 rounded-full animate-spin-reverse" style={{ transform: 'rotateX(70deg) rotateY(10deg)' }}></div>
            <div className="absolute inset-[-30%] border border-dashed border-brand-accent/20 rounded-full animate-spin-slow" style={{ animationDuration: '15s' }}></div>

            {/* The Sphere */}
            <div className="w-full h-full rounded-full relative shadow-[inset_-20px_-20px_50px_rgba(0,0,0,0.9),0_0_50px_rgba(14,165,233,0.4)] overflow-hidden bg-brand-bg">
                {/* Map Texture (CSS Gradient Approximation of Continents + Grid) */}
                <div 
                    className="absolute inset-0 w-[200%] h-full opacity-60 animate-earth-rotate"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 50% 50%, rgba(14,165,233,0.8) 2px, transparent 2px),
                            repeating-linear-gradient(to right, transparent 0, transparent 40px, rgba(14,165,233,0.1) 40px, rgba(14,165,233,0.1) 41px),
                            repeating-linear-gradient(to bottom, transparent 0, transparent 40px, rgba(14,165,233,0.1) 40px, rgba(14,165,233,0.1) 41px)
                        `,
                        backgroundSize: '40px 40px, 100% 100%, 100% 100%'
                    }}
                >
                    {/* Abstract Continents (Glow Blobs) */}
                    <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-brand-primary/20 blur-xl rounded-full"></div>
                    <div className="absolute top-1/2 left-3/4 w-40 h-32 bg-brand-secondary/20 blur-xl rounded-full"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-brand-accent/20 blur-xl rounded-full"></div>
                </div>
                
                {/* Atmosphere Glow */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,243,255,0.5)]"></div>
            </div>

            {/* Floating Hotspots */}
            <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-white rounded-full animate-ping"></div>
            <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-brand-accent rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            
            {/* Orbital Label */}
            <div className="absolute -right-4 top-4 md:-right-10 md:top-10 bg-black/60 border border-brand-primary/50 px-3 py-1 rounded backdrop-blur-md animate-pulse">
                <span className="text-[8px] md:text-[10px] font-orbitron text-brand-primary">LIVE DATA FEED</span>
            </div>
        </div>
    );
};

export default ThreeDEarth;