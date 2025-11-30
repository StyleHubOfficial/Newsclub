
import React from 'react';
import { NewsArticle } from '../types';
import NewsCard from './NewsCard';
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
}

const HomeView: React.FC<HomeViewProps> = ({
    articles,
    onArticleClick,
    onToggleSave,
    savedArticles,
    onOpenChat,
    onOpenLive,
    onOpenAudio,
    onViewReels,
    onSearch
}) => {
    // Trending Topics Data
    const trendingTopics = ["Artificial Intelligence", "Space Exploration", "Quantum Tech", "Biotech", "Cybersecurity", "Green Energy"];

    // Reusable Section Heading Component
    const SectionHeading: React.FC<{ children: React.ReactNode, icon?: React.ReactNode, accent?: 'primary' | 'secondary' | 'accent' | 'white' }> = ({ children, icon, accent = 'primary' }) => {
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

        return (
            <div className="relative inline-block mb-8">
                <div className="flex items-center gap-3 relative z-10">
                    {icon && <div className={`text-brand-${accent} drop-shadow-[0_0_5px_${shadowColor[accent]}]`}>{icon}</div>}
                    <h3 className="text-sm md:text-base font-orbitron font-bold text-white tracking-[0.25em] uppercase">
                        {children}
                    </h3>
                </div>
                {/* Neon Underline & Light Beam Trail */}
                <div className={`absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r ${colorMap[accent]} to-transparent shadow-[0_0_10px_${shadowColor[accent]}]`}></div>
                <div className="absolute -bottom-2 left-0 w-1/3 h-[2px] bg-white blur-[2px] animate-pulse"></div>
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-10 md:space-y-16 pb-24 animate-fade-in pt-8">
            
            {/* SECTION A: HERO SECTION */}
            <section className="px-4 md:px-6 text-center space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse shadow-[0_0_5px_#28FFD3]"></span>
                    <span className="text-[10px] font-orbitron text-brand-text-muted tracking-widest uppercase">LIVE INTELLIGENCE FEED</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-syncopate font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-white to-brand-secondary drop-shadow-[0_0_25px_rgba(58,190,254,0.3)]">
                    NEWS CLUB
                </h1>
                <p className="text-brand-text-muted text-sm md:text-base max-w-xl mx-auto font-orbitron tracking-wide font-light">
                    INTELLIGENCE • ANALYSIS • PREDICTION
                </p>
                <div className="pt-4">
                    <button 
                        onClick={() => document.getElementById('daily-feed')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-3 bg-white/5 border border-brand-primary/50 text-brand-primary rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_20px_rgba(58,190,254,0.15)] hover:bg-brand-primary hover:text-[#050505] hover:shadow-[0_0_30px_rgba(58,190,254,0.6)] active:scale-95 active:shadow-inner backdrop-blur-md"
                    >
                        Start Reading
                    </button>
                </div>
            </section>

            <div className="container mx-auto px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
            </div>

            {/* SECTION B: QUICK FEATURE PANELS (Glass Cards) */}
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
                        <button 
                            key={idx}
                            onClick={feature.action}
                            className="
                                relative group overflow-hidden
                                flex flex-col items-center justify-center gap-3 
                                p-4 md:p-6 
                                rounded-[22px] 
                                bg-gradient-to-br from-white/10 via-[#0a0a0a]/40 to-transparent
                                backdrop-blur-xl 
                                border border-white/10 
                                shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                                hover:border-brand-primary/40 
                                transition-all duration-300
                                hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)]
                                hover:-translate-y-1
                                active:scale-95
                            "
                        >
                            <div className={`
                                p-3 rounded-2xl 
                                ${feature.bg} border border-white/5 
                                group-hover:scale-110 transition-transform duration-500 
                                ${feature.color} group-hover:${feature.glow}
                                shadow-inner
                                drop-shadow-[0_0_5px_rgba(currentColor,0.5)]
                            `}>
                                {feature.icon}
                            </div>
                            <span className="text-[9px] md:text-xs font-bold font-orbitron text-brand-text-muted group-hover:text-white text-center leading-tight tracking-wide">
                                {feature.label}
                            </span>
                        </button>
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
                    {articles.map((article) => (
                        <NewsCard 
                            key={article.id} 
                            article={article} 
                            onClick={onArticleClick} 
                            onToggleSave={onToggleSave}
                            isSaved={savedArticles.has(article.id)}
                        />
                    ))}
                </div>
            </section>

            <div className="container mx-auto px-6">
                 <div className="h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
            </div>

            {/* SECTION D: TRENDING TOPICS ROW */}
            <section id="trending-section" className="px-4 md:px-6">
                <SectionHeading icon={<ChartIcon className="w-5 h-5"/>} accent="secondary">Trending Vectors</SectionHeading>
                
                <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                    {trendingTopics.map((topic, idx) => (
                        <button 
                            key={idx}
                            className="
                                flex-shrink-0 px-6 py-3 
                                rounded-full 
                                bg-gradient-to-r from-white/10 to-transparent
                                border border-white/10 
                                text-xs font-bold font-orbitron text-brand-text-muted 
                                hover:bg-brand-secondary/20 hover:text-white hover:border-brand-secondary/50 
                                hover:shadow-[0_0_20px_rgba(123,47,255,0.3)] 
                                shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                                transition-all backdrop-blur-md active:scale-95
                            "
                            onClick={() => onSearch(topic)}
                        >
                            #{topic}
                        </button>
                    ))}
                </div>
            </section>

            <div className="container mx-auto px-6">
                 <div className="h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>
            </div>

            {/* SECTION E: QUICK TOOLS ROW (Glass Utility Belt) */}
            <section className="px-4 md:px-6">
                <SectionHeading icon={<BoltIcon className="w-5 h-5"/>} accent="white">Utility Belt</SectionHeading>
                
                <div className="grid grid-cols-3 gap-4 md:gap-6">
                    <button 
                        className="
                            flex flex-col items-center justify-center gap-3 
                            px-4 py-6 
                            bg-gradient-to-br from-white/10 via-[#050505]/40 to-transparent
                            backdrop-blur-xl 
                            border border-white/10 
                            rounded-[22px] 
                            shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                            hover:border-brand-primary/50 transition-all group 
                            hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]
                            hover:-translate-y-1 active:scale-95
                        "
                        onClick={() => onOpenChat()}
                    >
                        <div className="p-3 rounded-full bg-brand-primary/10 border border-white/5 text-brand-primary group-hover:bg-brand-primary group-hover:text-black transition-colors shadow-inner drop-shadow-[0_0_5px_rgba(58,190,254,0.6)]">
                            <ListIcon />
                        </div>
                        <div className="text-center">
                            <span className="block text-xs font-bold font-orbitron text-white group-hover:text-brand-primary transition-colors">Summarize</span>
                            <span className="block text-[8px] text-gray-500 mt-1 uppercase tracking-wider">Smart Briefs</span>
                        </div>
                    </button>
                    
                    <button 
                        className="
                            flex flex-col items-center justify-center gap-3 
                            px-4 py-6 
                            bg-gradient-to-br from-white/10 via-[#050505]/40 to-transparent
                            backdrop-blur-xl 
                            border border-white/10 
                            rounded-[22px] 
                            shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                            hover:border-brand-accent/50 transition-all group 
                            hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]
                            hover:-translate-y-1 active:scale-95
                        "
                        onClick={() => onOpenLive()}
                    >
                        <div className="p-3 rounded-full bg-brand-accent/10 border border-white/5 text-brand-accent group-hover:bg-brand-accent group-hover:text-black transition-colors shadow-inner drop-shadow-[0_0_5px_rgba(40,255,211,0.6)]">
                            <MicIcon />
                        </div>
                        <div className="text-center">
                            <span className="block text-xs font-bold font-orbitron text-white group-hover:text-brand-accent transition-colors">Voice Search</span>
                            <span className="block text-[8px] text-gray-500 mt-1 uppercase tracking-wider">Hands-Free</span>
                        </div>
                    </button>

                    <button 
                        className="
                            flex flex-col items-center justify-center gap-3 
                            px-4 py-6 
                            bg-gradient-to-br from-white/10 via-[#050505]/40 to-transparent
                            backdrop-blur-xl 
                            border border-white/10 
                            rounded-[22px] 
                            shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
                            hover:border-brand-secondary/50 transition-all group 
                            hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]
                            hover:-translate-y-1 active:scale-95
                        "
                        onClick={() => onSearch('Analysis')}
                    >
                        <div className="p-3 rounded-full bg-brand-secondary/10 border border-white/5 text-brand-secondary group-hover:bg-brand-secondary group-hover:text-black transition-colors shadow-inner drop-shadow-[0_0_5px_rgba(123,47,255,0.6)]">
                             <ChartIcon />
                        </div>
                        <div className="text-center">
                            <span className="block text-xs font-bold font-orbitron text-white group-hover:text-brand-secondary transition-colors">Deep Dive</span>
                            <span className="block text-[8px] text-gray-500 mt-1 uppercase tracking-wider">Analytics</span>
                        </div>
                    </button>
                </div>
            </section>


            {/* SECTION F: FOOTER NOTE */}
            <footer className="mt-16 py-16 border-t border-brand-primary/10 bg-[#020202] text-center">
                <div className="flex flex-col items-center gap-6">
                    <p className="text-[9px] text-brand-text-muted font-orbitron tracking-[0.3em] uppercase opacity-50">
                        Architected & Designed By
                    </p>
                    <NeonSignature size="sm" />
                </div>
            </footer>
        </div>
    );
};

export default HomeView;
