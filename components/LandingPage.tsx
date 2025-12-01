import React, { useRef } from 'react';
import { BoltIcon, MicIcon, SoundWaveIcon, BrainIcon, ImageIcon, ChartIcon } from './icons';
import ThreeDEarth from './ThreeDEarth';
import NeonSignature from './NeonSignature';
import RevealOnScroll from './RevealOnScroll';

interface LandingPageProps {
    onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const featureSectionRef = useRef<HTMLElement>(null);

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-brand-text overflow-x-hidden relative selection:bg-brand-primary selection:text-black">
            
            {/* Background Parallax Elements - Updated Colors */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-brand-primary/10 rounded-full blur-[100px] animate-pulse-glow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-brand-secondary/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[40%] left-[30%] w-[200px] h-[200px] bg-brand-accent/5 rounded-full blur-[80px] animate-float"></div>
            </div>

            {/* SECTION A: HERO */}
            <section className="relative min-h-[100dvh] flex flex-col md:flex-row items-center justify-center container mx-auto px-4 md:px-6 pt-safe-top pb-20 z-10 gap-6 md:gap-0">
                
                {/* Right Content */}
                <div className="w-full md:w-1/2 flex items-center justify-center relative order-1 md:order-2 animate-slide-in-right mt-12 md:mt-0">
                    <ThreeDEarth />
                </div>

                {/* Left Content */}
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start space-y-6 md:space-y-10 animate-slide-up relative z-20 text-center md:text-left order-2 md:order-1">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 backdrop-blur-md shadow-[0_0_15px_rgba(40,255,211,0.1)]">
                        <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping"></span>
                        <span className="text-[10px] md:text-xs font-orbitron text-brand-accent tracking-[0.2em]">SYSTEM ONLINE v3.0</span>
                    </div>

                    <h1 className="text-3xl md:text-7xl font-syncopate font-bold leading-tight">
                        NEXT GEN <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-white to-brand-secondary animate-text-shimmer drop-shadow-[0_0_10px_rgba(58,190,254,0.5)]">
                            INTELLIGENCE
                        </span>
                    </h1>

                    <p className="text-xs md:text-lg text-brand-text-muted max-w-lg leading-relaxed border-l-0 md:border-l-2 border-brand-primary/30 md:pl-6 mx-auto md:mx-0 font-light">
                         News Club is a sentient information hub. Voice, audio, and vision integrated into one seamless glass interface.
                    </p>

                    <div className="flex justify-center md:justify-start transform scale-90 md:scale-100 origin-center md:origin-left">
                         <NeonSignature />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4 md:pt-6 items-center md:items-start w-full md:w-auto">
                        <button 
                            onClick={onEnterApp}
                            className="
                                group relative px-10 py-4 overflow-hidden rounded-full 
                                bg-white/5 border border-brand-primary/50 text-white font-orbitron tracking-[0.2em] 
                                transition-all duration-300 
                                hover:bg-brand-primary/20 hover:border-brand-primary hover:shadow-[0_0_40px_rgba(58,190,254,0.6)] 
                                hover:scale-105
                                active:scale-95 active:shadow-inner w-full md:w-auto backdrop-blur-md
                            "
                        >
                             <span className="relative flex items-center justify-center gap-3 font-bold text-sm md:text-base z-10">
                                ENTER SYSTEM <BoltIcon />
                            </span>
                            {/* Inner Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sheen skew-x-12 z-0"></div>
                        </button>
                    </div>
                </div>
            </section>


            {/* SECTION B: FEATURE CAROUSEL */}
            <section ref={featureSectionRef} className="py-20 relative z-10 border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 md:px-6 mb-8 text-center">
                    <RevealOnScroll animation="zoom-in">
                        <div className="relative inline-block mb-12">
                            <h2 className="text-2xl md:text-4xl font-orbitron font-bold text-white tracking-[0.25em] uppercase relative z-10 animate-text-shimmer bg-[length:200%_auto]">
                                <span className="text-brand-secondary mr-3">///</span> Advanced Modules
                            </h2>
                            {/* Neon Underline & Light Beam Trail */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-brand-secondary to-transparent shadow-[0_0_15px_#7B2FFF] animate-draw-line"></div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/4 h-[2px] bg-white blur-[2px] animate-pulse"></div>
                        </div>
                    </RevealOnScroll>
                    
                    <div className="flex overflow-x-auto gap-5 md:gap-8 pb-8 snap-x snap-mandatory scrollbar-hide px-2">
                        {[
                            { title: 'Live Agent', icon: <MicIcon />, desc: 'Real-time voice conversation with neural intelligence.', color: 'from-brand-primary to-brand-accent' },
                            { title: 'Audio Studio', icon: <SoundWaveIcon />, desc: 'Text-to-speech synthesis with multi-speaker capabilities.', color: 'from-brand-secondary to-pink-500' },
                            { title: 'Visual Gen', icon: <ImageIcon />, desc: 'Generate imagery from context using Neural Vision.', color: 'from-brand-accent to-green-400' },
                            { title: 'Deep Analysis', icon: <BrainIcon />, desc: 'Complex reasoning on articles to find hidden insights.', color: 'from-orange-500 to-brand-secondary' },
                            { title: 'Data Viz', icon: <ChartIcon />, desc: 'Interactive charts generated from news data points.', color: 'from-yellow-400 to-brand-primary' }
                        ].map((feature, idx) => (
                            <div 
                                key={idx}
                                className="
                                    min-w-[260px] md:min-w-[320px] snap-center flex-shrink-0 relative overflow-hidden group
                                    rounded-[24px] 
                                    bg-gradient-to-br from-white/10 via-[#0a0a0a]/50 to-transparent
                                    backdrop-blur-md 
                                    border border-white/10 
                                    p-8 
                                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                                    
                                    /* Micro-Interactions */
                                    animate-card-enter
                                    transition-all duration-300
                                    hover:scale-[1.02]
                                    hover:border-brand-primary/40 
                                    hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)] 
                                "
                            >
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color}`}></div>
                                <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                                    <div className="text-white group-hover:animate-pulse-once">
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-orbitron font-bold mb-3 text-white group-hover:text-brand-primary transition-colors">{feature.title}</h3>
                                <p className="text-brand-text-muted text-sm leading-relaxed font-light">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* SECTION D: AI POWER STRIP */}
            <section className="py-10 bg-brand-primary/5 border-y border-brand-primary/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]"></div>
                <div className="flex w-[300%] md:w-[200%] animate-marquee relative z-10">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex-1 flex justify-around items-center whitespace-nowrap px-10 gap-12">
                            <span className="text-3xl md:text-6xl font-syncopate font-bold text-transparent bg-clip-text bg-gradient-to-b from-white/30 to-transparent">
                                GENERATIVE AI
                            </span>
                            <SoundWaveIcon className="w-8 h-8 md:w-16 md:h-16 text-brand-secondary/40" />
                            <span className="text-3xl md:text-6xl font-syncopate font-bold text-transparent bg-clip-text bg-gradient-to-b from-white/30 to-transparent">
                                REAL-TIME
                            </span>
                             <BoltIcon className="w-8 h-8 md:w-16 md:h-16 text-brand-accent/40" />
                        </div>
                    ))}
                </div>
            </section>


            {/* SECTION E: COMPARISON GRID */}
            <section className="py-20 container mx-auto px-4 md:px-6">
                 <div className="text-center mb-16 relative inline-block w-full">
                    <RevealOnScroll animation="zoom-in">
                        <div className="relative inline-block">
                            <h2 className="text-2xl md:text-4xl font-orbitron font-bold text-white tracking-[0.25em] uppercase relative z-10 animate-text-shimmer bg-[length:200%_auto]">
                                <span className="text-brand-accent mr-3">///</span> Why News Club?
                            </h2>
                             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent shadow-[0_0_15px_#28FFD3] animate-draw-line"></div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/4 h-[2px] bg-white blur-[2px] animate-pulse"></div>
                        </div>
                    </RevealOnScroll>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { title: 'Standard Apps', text: 'Static text, cluttered ads.', positive: false },
                        { title: 'News Club', text: 'AI Summaries, Zero Ads.', positive: true },
                        { title: 'Interaction', text: 'Passive reading only.', positive: false },
                        { title: 'Conversation', text: 'Two-way voice chat.', positive: true },
                        { title: 'Updates', text: 'Manual refreshes.', positive: false },
                        { title: 'Live Stream', text: 'Real-time WebSocket data.', positive: true },
                    ].map((item, idx) => (
                        <div key={idx} className={`
                            p-8 rounded-[22px] backdrop-blur-md transition-all border
                            shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]
                            
                            /* Micro-Interactions */
                            animate-card-enter
                            hover:scale-[1.02]
                            hover:-translate-y-1
                            
                            ${item.positive 
                                ? 'bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/30 shadow-[0_0_20px_rgba(58,190,254,0.05)] hover:border-brand-primary/50' 
                                : 'bg-gradient-to-br from-white/5 to-transparent border-white/5 grayscale opacity-60 hover:opacity-100 hover:border-white/20'}
                        `}>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className={`font-orbitron text-lg ${item.positive ? 'text-brand-primary' : 'text-gray-500'}`}>{item.title}</h4>
                                {item.positive && <div className="text-brand-accent drop-shadow-[0_0_5px_#28FFD3]"><BoltIcon /></div>}
                            </div>
                            <p className="text-sm text-gray-400 font-light">{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECTION G: CTA */}
            <section className="py-32 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 to-[#050505] z-0"></div>
                <div className="relative z-10 text-center space-y-8 px-4">
                     <div className="inline-block p-4 rounded-full bg-[#050505] border border-brand-accent shadow-[0_0_50px_#28FFD3] animate-pulse-glow mb-4">
                        <BoltIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl md:text-7xl font-syncopate font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">READY?</h2>
                    <p className="text-brand-text-muted max-w-xl mx-auto text-base font-light">Access the full power of advanced neural networks combined with real-time global intelligence.</p>
                    
                    <button 
                        onClick={onEnterApp}
                        className="
                            group relative w-full md:w-auto px-12 py-5 rounded-full overflow-hidden
                            bg-white/5 border border-brand-accent/50
                            text-white font-orbitron font-bold text-xl tracking-[0.2em] 
                            backdrop-blur-md
                            
                            /* Micro-Interactions */
                            transition-all duration-300 transform 
                            hover:bg-brand-accent/20 hover:border-brand-accent
                            hover:shadow-[0_0_80px_rgba(40,255,211,0.6)] 
                            hover:scale-105 
                            active:scale-95 active:shadow-inner
                        "
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            LAUNCH APP <BoltIcon />
                        </span>
                         {/* Inner Shine Effect */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-sheen skew-x-12 z-0"></div>
                    </button>
                    
                    <div className="pt-16 opacity-80 hover:opacity-100 transition-opacity">
                         <NeonSignature size="sm" />
                    </div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;