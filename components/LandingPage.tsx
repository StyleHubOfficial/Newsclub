
import React, { useEffect, useState, useRef } from 'react';
import { BoltIcon, MicIcon, SoundWaveIcon, BrainIcon, ImageIcon, ChartIcon } from './icons';
import ThreeDEarth from './ThreeDEarth';
import NeonSignature from './NeonSignature';

interface LandingPageProps {
    onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const featureSectionRef = useRef<HTMLElement>(null);

    // Scroll-to-Enter Logic
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const triggerHeight = window.innerHeight * 0.35; // Trigger after scrolling 35% of view

            // Optional: Uncomment this if you want AUTOMATIC entry on scroll
            // if (scrollPosition > triggerHeight) {
            //    onEnterApp();
            // }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [onEnterApp]);

    const scrollToFeatures = () => {
        if (featureSectionRef.current) {
            featureSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text overflow-x-hidden relative selection:bg-brand-primary selection:text-white">
            
            {/* Background Parallax Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-brand-primary/10 rounded-full blur-[80px] md:blur-[100px] animate-pulse-glow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-brand-secondary/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* SECTION A: HERO */}
            {/* Changed flex direction for mobile to flex-col-reverse (Earth on top visually, or text on top) - Sticking to Text Top for clarity */}
            <section className="relative min-h-screen flex flex-col md:flex-row items-center justify-center container mx-auto px-4 md:px-6 pt-12 pb-20 z-10">
                
                {/* Left Content */}
                <div className="w-full md:w-1/2 space-y-6 md:space-y-8 animate-slide-up relative z-20 text-center md:text-left mt-8 md:mt-0 order-2 md:order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/5 backdrop-blur-md justify-center md:justify-start">
                        <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping"></span>
                        <span className="text-[10px] md:text-xs font-orbitron text-brand-primary tracking-widest">SYSTEM ONLINE v2.5</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-syncopate font-bold leading-tight">
                        NEXT GEN <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-pink animate-text-shimmer">
                            INTELLIGENCE
                        </span>
                    </h1>

                    <p className="text-sm md:text-lg text-brand-text-muted max-w-lg leading-relaxed border-l-0 md:border-l-2 border-brand-accent/50 md:pl-6 mx-auto md:mx-0">
                         News Club is not just a news app. It's a sentient information hub. Voice, audio, and vision integrated into one seamless experience.
                    </p>

                    <div className="flex justify-center md:justify-start">
                         <NeonSignature />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4 items-center md:items-start">
                        <button 
                            onClick={onEnterApp}
                            className="group relative px-8 py-4 bg-brand-primary/20 overflow-hidden rounded-full border border-brand-primary text-brand-text font-orbitron tracking-widest transition-all hover:bg-brand-primary/40 hover:shadow-[0_0_30px_rgba(14,165,233,0.4)] w-full md:w-auto"
                        >
                             <span className="relative flex items-center justify-center gap-3 font-bold">
                                ENTER SYSTEM <BoltIcon />
                            </span>
                        </button>
                    </div>
                </div>

                {/* Right Content - 3D Earth */}
                {/* Adjusted order to be visually balanced on mobile */}
                <div className="w-full md:w-1/2 flex items-center justify-center relative order-1 md:order-2 animate-slide-in-right">
                    <ThreeDEarth />
                </div>

                {/* Scroll Hint */}
                <button 
                    onClick={scrollToFeatures}
                    className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce cursor-pointer z-30"
                >
                    <span className="text-[10px] font-orbitron tracking-[0.3em]">SCROLL TO EXPLORE</span>
                    <div className="w-px h-8 md:h-12 bg-gradient-to-b from-brand-primary to-transparent"></div>
                </button>
            </section>


            {/* SECTION B: FEATURE CAROUSEL */}
            <section ref={featureSectionRef} className="py-16 md:py-20 relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-4 md:px-6 mb-8">
                     <h2 className="text-2xl md:text-4xl font-orbitron text-center mb-12">
                        <span className="text-brand-primary">///</span> ADVANCED MODULES
                    </h2>
                    
                    {/* Improved mobile scrolling */}
                    <div className="flex overflow-x-auto gap-4 md:gap-8 pb-8 snap-x snap-mandatory scrollbar-hide px-2">
                        {[
                            { title: 'Live Agent', icon: <MicIcon />, desc: 'Real-time voice conversation with neural intelligence.', color: 'from-blue-500 to-cyan-500' },
                            { title: 'Audio Studio', icon: <SoundWaveIcon />, desc: 'Text-to-speech synthesis with multi-speaker capabilities.', color: 'from-purple-500 to-pink-500' },
                            { title: 'Visual Gen', icon: <ImageIcon />, desc: 'Generate imagery from context using Neural Vision.', color: 'from-green-500 to-emerald-500' },
                            { title: 'Deep Analysis', icon: <BrainIcon />, desc: 'Complex reasoning on articles to find hidden insights.', color: 'from-orange-500 to-red-500' },
                            { title: 'Data Viz', icon: <ChartIcon />, desc: 'Interactive charts generated from news data points.', color: 'from-yellow-500 to-amber-500' }
                        ].map((feature, idx) => (
                            <div 
                                key={idx}
                                className="min-w-[260px] md:min-w-[300px] snap-center bg-brand-surface/60 border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-brand-surface/80 transition-all duration-300 relative overflow-hidden flex-shrink-0"
                            >
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color}`}></div>
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-bg border border-white/10 flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                    <div className="text-brand-text">
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg md:text-xl font-orbitron font-bold mb-2 md:mb-3">{feature.title}</h3>
                                <p className="text-brand-text-muted text-xs md:text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* SECTION D: AI POWER STRIP */}
            <section className="py-8 md:py-12 bg-brand-primary/5 border-y border-brand-primary/20 overflow-hidden">
                <div className="flex w-[300%] md:w-[200%] animate-marquee">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex-1 flex justify-around items-center whitespace-nowrap px-4 md:px-10 gap-8">
                            <span className="text-2xl md:text-6xl font-syncopate font-bold text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent">
                                GENERATIVE AI
                            </span>
                            <SoundWaveIcon className="w-8 h-8 md:w-12 md:h-12 text-brand-primary/30" />
                            <span className="text-2xl md:text-6xl font-syncopate font-bold text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent">
                                REAL-TIME
                            </span>
                             <BoltIcon className="w-8 h-8 md:w-12 md:h-12 text-brand-accent/30" />
                        </div>
                    ))}
                </div>
            </section>


            {/* SECTION E: COMPARISON GRID */}
            <section className="py-16 md:py-20 container mx-auto px-4 md:px-6">
                <h2 className="text-2xl md:text-4xl font-orbitron text-center mb-12">
                    <span className="text-brand-accent">///</span> WHY NEWS CLUB?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[
                        { title: 'Standard Apps', text: 'Static text, cluttered ads.', positive: false },
                        { title: 'News Club', text: 'AI Summaries, Zero Ads.', positive: true },
                        { title: 'Interaction', text: 'Passive reading only.', positive: false },
                        { title: 'Conversation', text: 'Two-way voice chat.', positive: true },
                        { title: 'Updates', text: 'Manual refreshes.', positive: false },
                        { title: 'Live Stream', text: 'Real-time WebSocket data.', positive: true },
                    ].map((item, idx) => (
                        <div key={idx} className={`p-4 md:p-6 border rounded-xl backdrop-blur-sm ${item.positive ? 'bg-brand-primary/5 border-brand-primary/30' : 'bg-red-900/5 border-red-500/20 grayscale opacity-70'}`}>
                            <div className="flex justify-between items-start mb-2 md:mb-4">
                                <h4 className={`font-orbitron text-sm md:text-lg ${item.positive ? 'text-brand-primary' : 'text-brand-text-muted'}`}>{item.title}</h4>
                                {item.positive && <div className="text-brand-primary"><BoltIcon /></div>}
                            </div>
                            <p className="text-xs md:text-sm text-brand-text-muted">{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECTION G: CTA */}
            <section className="py-24 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 to-brand-bg z-0"></div>
                <div className="relative z-10 text-center space-y-6 md:space-y-8 px-4">
                     <div className="inline-block p-3 md:p-4 rounded-full bg-brand-bg border border-brand-primary shadow-[0_0_50px_#0ea5e9] animate-pulse-glow mb-2">
                        <BoltIcon />
                    </div>
                    <h2 className="text-3xl md:text-6xl font-syncopate font-bold">READY?</h2>
                    <p className="text-brand-text-muted max-w-xl mx-auto text-sm md:text-base">Access the full power of advanced neural networks combined with real-time global intelligence.</p>
                    
                    <button 
                        onClick={onEnterApp}
                        className="w-full md:w-auto px-10 py-5 bg-brand-primary text-white font-orbitron font-bold text-lg md:text-xl tracking-widest rounded-full shadow-[0_0_40px_rgba(14,165,233,0.6)] hover:shadow-[0_0_80px_rgba(14,165,233,0.8)] transition-all"
                    >
                        LAUNCH APP
                    </button>
                    
                    <div className="pt-8 md:pt-12">
                         <NeonSignature size="sm" />
                    </div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
