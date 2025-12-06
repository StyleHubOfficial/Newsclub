
import React, { useState, useEffect, useRef } from 'react';
import { NewsArticle } from '../types';
import NewsCard from './NewsCard';
import RevealOnScroll from './RevealOnScroll';
import { 
    BoltIcon, 
    MicIcon, 
    SoundWaveIcon, 
    ImageIcon, 
    BrainIcon, 
    ReelsIcon, 
    ChartIcon,
    SearchIcon,
    ListIcon
} from './icons';
import NeonSignature from './NeonSignature';

interface HomeViewProps {
    articles: NewsArticle[];
    onArticleClick: (article: NewsArticle) => void;
    onToggleSave: (id: number) => void;
    savedArticles: Set<number>;
    onOpenChat: () => void;
    onOpenLive: () => void;
    onOpenAudio: () => void;
    onViewReels: () => void;
    onSearch: (query: string) => void;
    isUserLoggedIn: boolean;
    onTriggerLogin: () => void;
}

// --- FIX: SectionHeading manages its own animation state ---
const SectionHeading: React.FC<{ children: React.ReactNode, icon?: React.ReactNode, accent?: 'primary' | 'secondary' | 'accent' | 'white' }> = ({ children, icon, accent = 'primary' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const colorMap = {
        primary: 'from-brand-primary via-brand-accent',
        secondary: 'from-brand-secondary via-brand-primary',
        accent: 'from-brand-accent via-white',
        white: 'from-white via-brand-text-muted'
    };
    const shadowColor = {
            primary: '#3ABEFE',
            secondary: '#7B2FFF',
            accent: '#28FFD3',
            white: '#ffffff'
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Ensure it only runs ONCE
                }
            },
            { threshold: 0.2 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="group relative inline-block mb-8 transition-all duration-700">
            <div className={`flex items-center gap-3 relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {icon && <div className={`text-brand-${accent} drop-shadow-[0_0_5px_${shadowColor[accent]}] group-hover:scale-110 transition-transform duration-500`}>{icon}</div>}
                <h3 className="text-sm md:text-base font-orbitron font-bold text-white tracking-[0.25em] uppercase">
                    {children}
                </h3>
            </div>
            {/* Neon Underline - Only animates when isVisible is true */}
            <div className={`absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r ${colorMap[accent]} to-transparent shadow-[0_0_10px_${shadowColor[accent]}] origin-left transition-all duration-1000 ${isVisible ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
        </div>
    );
};

const HomeView: React.FC<HomeViewProps> = ({
    articles,
    onArticleClick,
    onToggleSave,
    savedArticles,
    onOpenChat,
    onOpenLive,
    onOpenAudio,
    onViewReels,
    onSearch,
    isUserLoggedIn,
    onTriggerLogin
}) => {
    // Trending Topics Data
    const trendingTopics = ["Artificial Intelligence", "Space Exploration", "Quantum Tech", "Biotech", "Cybersecurity", "Green Energy"];

    return (
        <div className="flex flex-col space-y-10 md:space-y-16 pb-24 animate-fade-in pt-8">
            
            {/* SECTION A: HERO SECTION */}
            <section className="px-4 md:px-6 text-center space-y-5">
                <RevealOnScroll animation="zoom-in">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse shadow-[0_0_5px_#28FFD3]"></span>
                        <span className="text-[10px] font-orbitron text-brand-text-muted tracking-widest uppercase">LIVE INTELLIGENCE FEED</span>
                    </div>
                </RevealOnScroll>
                
                <RevealOnScroll animation="fade-up" delay={200}>
                    <h1 className="text-4xl md:text-7xl font-syncopate font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-white to-brand-secondary drop-shadow-[0_0_25px_rgba(58,190,254,0.3)]">
                        NEWS CLUB
                    </h1>
                </RevealOnScroll>

                <RevealOnScroll animation="fade-up" delay={400}>
                    <p className="text-brand-text-muted text-sm md:text-base max-w-xl mx-auto font-orbitron tracking-wide font-light">
                        INTELLIGENCE • ANALYSIS • PREDICTION
                    </p>
                </RevealOnScroll>
                
                <RevealOnScroll animation="fade-up" delay={600}>
                    <div className="pt-4">
                        <button 
                            onClick={() => document.getElementById('daily-feed')?.scrollIntoView({ behavior: 'smooth' })}
                            className="
                                group relative px-8 py-3 rounded-full overflow-hidden
                                bg-white/5 border border-brand-primary/50 text-brand-primary 
                                font-orbitron text-xs font-bold uppercase tracking-[0.2em] 
                                backdrop-blur-md
                                transition-all duration-300 
                                hover:bg-brand-primary/10 hover:border-brand-primary hover:text-white hover:shadow-[0_0_30px_rgba(58,190,254,0.6)] 
                                hover:scale-105
                                active:scale-95 active:shadow-inner active:animate-ripple
                            "
                        >
                            <span className="relative z-10">Start Reading</span>
                             {/* Inner Shine Effect */}
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sheen skew-x-12 z-0"></div>
                        </button>
                    </div>
                </RevealOnScroll>
            </section>

            <div className="container mx-auto px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
            </div>

            {/* SECTION B: QUICK FEATURE PANELS */}
            <section className="px-4 md:px-6">
                <SectionHeading icon={<BoltIcon className="w-5 h-5"/>} accent="accent">Quick Access Modules</SectionHeading>
                
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    {[
                        { label: 'AI Audio', icon: <SoundWaveIcon className="w-6 h-6"/>, action: onOpenAudio, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', glow: 'shadow-[0_0_20px_rgba(123,47,255,0.4)]' },
                        { label: 'Live Agent', icon: <MicIcon className="w-6 h-6"/>, action: onOpenLive, color: 'text-brand-accent', bg: 'bg-brand-accent/10', glow: 'shadow-[0_0_20px_rgba(40,255,211,0.4)]' },
                        { label: 'AI Chat', icon: <BoltIcon className="w-6 h-6"/>, action: onOpenChat, color: 'text-brand-primary', bg: 'bg-brand-primary/10', glow: 'shadow-[0_0_20px_rgba(58,190,254,0.4)]' },
                        { label: 'Img Create', icon: <ImageIcon className="w-6 h-6"/>, action: () => onOpenChat(), color: 'text-green-400', bg: 'bg-green-400/10', glow: 'shadow-[0_0_20px_rgba(74,222,128,0.4)]' }, 
                        { label: 'Analyzer', icon: <BrainIcon className="w-6 h-6"/>, action: () => onSearch('Deep analysis of current global news trends'), color: 'text-yellow-400', bg: 'bg-yellow-400/10', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.4)]' },
                        { label: 'Reels Mode', icon: <ReelsIcon className="w-6 h-6"/>, action: onViewReels, color: 'text-pink-400', bg: 'bg-pink-400/10', glow: 'shadow-[0_0_20px_rgba(244,114,182,0.4)]' },
                    ].map((feature, idx) => (
                        <RevealOnScroll key={idx} animation="fade-up" delay={idx * 50}>
                            <button 
                                onClick={feature.action}
                                className="
                                    relative group overflow-hidden w-full h-full
                                    flex flex-col items-center justify-center gap-3 
                                    p-4 md:p-6 
                                    rounded-[22px] 
                                    bg-gradient-to-br from-white/10 via-[#0a0a0a]/40 to-transparent
                                    backdrop-blur-xl 
                                    border border-white/10 
                                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                                    
                                    /* Micro-Interactions */
                                    transition-all duration-300
                                    hover:border-brand-primary/40 
                                    hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)]
                                    hover:scale-[1.02]
                                    active:scale-95 active:animate-ripple
                                "
                            >
                                {/* Light Beam Micro-Interaction */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-sheen pointer-events-none z-0 skew-x-12"></div>

                                <div className={`
                                    p-3 rounded-2xl 
                                    ${feature.bg} border border-white/5 
                                    transition-transform duration-500 
                                    group-hover:scale-110 group-hover:rotate-12
                                    ${feature.color} group-hover:${feature.glow}
                                    shadow-inner
                                    drop-shadow-[0_0_5px_rgba(currentColor,0.5)]
                                    relative z-10
                                `}>
                                    <div className="group-hover:animate-pulse-once">
                                        {feature.icon}
                                    </div>
                                </div>
                                <span className="relative z-10 text-[9px] md:text-xs font-bold font-orbitron text-brand-text-muted group-hover:text-white text-center leading-tight tracking-wide">
                                    {feature.label}
                                </span>
                            </button>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            <div className="container mx-auto px-6">
                 <div className="h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
            </div>

            {/* SECTION C: DAILY NEWS FEED */}
            <section id="daily-feed" className="px-4 md:px-6">
                 <div className="flex justify-between items-end mb-8">
                    <SectionHeading icon={<ListIcon className="w-5 h-5"/>} accent="primary">Daily Intelligence</SectionHeading>
                    <span className="mb-8 text-[9px] font-orbitron text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full border border-brand-accent/30 animate-pulse shadow-[0_0_10px_rgba(40,255,211,0.2)]">LIVE UPDATES</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article, index) => (
                        <RevealOnScroll key={article.id} animation="slide-right" delay={index * 100} className="h-full">
                            <NewsCard 
                                article={article} 
                                onClick={onArticleClick} 
                                onToggleSave={onToggleSave}
                                isSaved={savedArticles.has(article.id)}
                            />
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            <div className="container mx-auto px-6">
                 <div className="h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
            </div>

            {/* SECTION D: TRENDING TOPICS */}
            <section id="trending-section" className="px-4 md:px-6">
                <SectionHeading icon={<ChartIcon className="w-5 h-5"/>} accent="secondary">Trending Vectors</SectionHeading>
                
                <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                    {trendingTopics.map((topic, idx) => (
                        <RevealOnScroll key={idx} animation="slide-right" delay={idx * 50}>
                            <button 
                                className="
                                    flex-shrink-0 px-6 py-3 
                                    rounded-full 
                                    border border-white/10 
                                    bg-transparent
                                    text-xs font-bold font-orbitron text-brand-text-muted 
                                    
                                    /* Micro-Interactions */
                                    transition-all duration-300
                                    hover:bg-brand-secondary/20 hover:text-white hover:border-brand-secondary/50 
                                    hover:shadow-[0_0_20px_rgba(123,47,255,0.3)] hover:scale-105
                                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                                    backdrop-blur-md active:scale-95 active:animate-ripple relative overflow-hidden
                                "
                                onClick={() => onSearch(topic)}
                            >
                                #{topic}
                            </button>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            <div className="container mx-auto px-6">
                 <div className="h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
            </div>

            {/* SECTION E: QUICK TOOLS */}
            <section className="px-4 md:px-6">
                <SectionHeading icon={<BoltIcon className="w-5 h-5"/>} accent="white">Utility Belt</SectionHeading>
                
                <div className="grid grid-cols-3 gap-4 md:gap-6">
                    {[
                        { title: 'Summarize', sub: 'Smart Briefs', icon: <ListIcon/>, action: () => onOpenChat(), color: 'primary' },
                        { title: 'Voice Search', sub: 'Hands-Free', icon: <MicIcon/>, action: () => onOpenLive(), color: 'accent' },
                        { title: 'Deep Dive', sub: 'Analytics', icon: <ChartIcon/>, action: () => onSearch('Analysis'), color: 'secondary' }
                    ].map((tool, idx) => (
                        <RevealOnScroll key={idx} animation="fade-up" delay={idx * 100}>
                            <button 
                                className="
                                    w-full
                                    flex flex-col items-center justify-center gap-3 
                                    px-4 py-6 
                                    bg-gradient-to-br from-white/10 via-[#050505]/40 to-transparent
                                    backdrop-blur-xl 
                                    border border-white/10 
                                    rounded-[22px] 
                                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                                    
                                    /* Micro-Interactions */
                                    transition-all duration-300
                                    hover:scale-[1.02]
                                    hover:border-brand-${tool.color}/50  
                                    hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]
                                    active:scale-95 active:animate-ripple
                                    group
                                "
                                onClick={tool.action}
                            >
                                <div className={`p-3 rounded-full bg-brand-${tool.color}/10 border border-white/5 text-brand-${tool.color} group-hover:bg-brand-${tool.color} group-hover:text-black transition-colors shadow-inner`}>
                                    <div className="group-hover:animate-pulse-once">{tool.icon}</div>
                                </div>
                                <div className="text-center">
                                    <span className={`block text-xs font-bold font-orbitron text-white group-hover:text-brand-${tool.color} transition-colors`}>{tool.title}</span>
                                    <span className="block text-[8px] text-gray-500 mt-1 uppercase tracking-wider">{tool.sub}</span>
                                </div>
                            </button>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            {/* SECTION F: FOOTER NOTE */}
            <footer className="mt-16 py-16 border-t border-brand-primary/10 bg-[#020202] text-center">
                <RevealOnScroll animation="fade-up">
                    <div className="flex flex-col items-center gap-6">
                        <p className="text-[9px] text-brand-text-muted font-orbitron tracking-[0.3em] uppercase opacity-50">
                            Architected & Designed By
                        </p>
                        <NeonSignature size="sm" />
                    </div>
                </RevealOnScroll>
            </footer>
        </div>
    );
};

export default React.memo(HomeView); // Correct memo usage for performance
