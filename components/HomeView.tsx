
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

    return (
        <div className="flex flex-col space-y-8 md:space-y-12 pb-24 animate-fade-in">
            
            {/* SECTION A: HERO SECTION */}
            <section className="px-4 md:px-6 pt-6 text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-syncopate font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-white to-brand-secondary drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                    NEWS CLUB
                </h1>
                <p className="text-brand-text-muted text-sm md:text-base max-w-lg mx-auto font-orbitron tracking-wide">
                    INTELLIGENCE • ANALYSIS • PREDICTION
                </p>
                <div className="pt-2">
                    <button 
                        onClick={() => document.getElementById('daily-feed')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-3 bg-brand-primary/10 border border-brand-primary text-brand-primary rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-[0_0_20px_rgba(14,165,233,0.2)]"
                    >
                        Start Reading News
                    </button>
                </div>
            </section>

            <div className="container mx-auto px-6">
                <hr className="border-brand-primary/10" />
            </div>

            {/* SECTION B: QUICK FEATURE PANELS (3-in-a-row) */}
            <section className="px-4 md:px-6">
                <h3 className="text-xs font-orbitron text-brand-text-muted mb-6 pl-1 border-l-2 border-brand-accent tracking-wider">QUICK ACCESS MODULES</h3>
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    {[
                        { label: 'AI Audio', icon: <SoundWaveIcon className="w-6 h-6"/>, action: onOpenAudio, color: 'text-purple-400' },
                        { label: 'Live Agent', icon: <MicIcon className="w-6 h-6"/>, action: onOpenLive, color: 'text-red-400' },
                        { label: 'AI Chat', icon: <BoltIcon className="w-6 h-6"/>, action: onOpenChat, color: 'text-cyan-400' },
                        { label: 'Img Create', icon: <ImageIcon className="w-6 h-6"/>, action: () => onOpenChat(), color: 'text-green-400' }, // Opens chat for image gen
                        { label: 'Analyzer', icon: <BrainIcon className="w-6 h-6"/>, action: () => onSearch('Deep analysis of current global news trends'), color: 'text-yellow-400' },
                        { label: 'Reels Mode', icon: <ReelsIcon className="w-6 h-6"/>, action: onViewReels, color: 'text-blue-400' },
                    ].map((feature, idx) => (
                        <button 
                            key={idx}
                            onClick={feature.action}
                            className="bg-brand-surface border border-brand-primary/20 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-3 hover:bg-brand-surface/80 hover:border-brand-primary/50 transition-all group shadow-lg"
                        >
                            <div className={`p-3 rounded-full bg-brand-bg/50 group-hover:scale-110 transition-transform ${feature.color} shadow-inner`}>
                                {feature.icon}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold font-orbitron text-brand-text-muted group-hover:text-brand-text text-center leading-tight">
                                {feature.label}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <div className="container mx-auto px-6">
                <hr className="border-brand-primary/10" />
            </div>

            {/* SECTION C: DAILY NEWS FEED */}
            <section id="daily-feed" className="px-4 md:px-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-orbitron text-brand-text-muted pl-1 border-l-2 border-brand-primary tracking-wider">DAILY INTELLIGENCE FEED</h3>
                    <span className="text-[10px] text-brand-text-muted bg-brand-surface px-2 py-1 rounded border border-brand-primary/10 animate-pulse">LIVE UPDATES</span>
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
                <hr className="border-brand-primary/10" />
            </div>

            {/* SECTION D: TRENDING TOPICS ROW */}
            <section id="trending-section" className="px-4 md:px-6">
                <h3 className="text-xs font-orbitron text-brand-text-muted mb-6 pl-1 border-l-2 border-brand-secondary tracking-wider">TRENDING VECTORS</h3>
                <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                    {trendingTopics.map((topic, idx) => (
                        <button 
                            key={idx}
                            className="flex-shrink-0 px-6 py-2 bg-brand-surface/50 border border-brand-primary/20 rounded-full text-xs font-bold text-brand-text hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm"
                            onClick={() => onSearch(topic)}
                        >
                            #{topic}
                        </button>
                    ))}
                </div>
            </section>

            <div className="container mx-auto px-6">
                <hr className="border-brand-primary/10" />
            </div>

            {/* SECTION E: QUICK TOOLS ROW (UTILITY BELT) */}
            <section className="px-4 md:px-6">
                <h3 className="text-xs font-orbitron text-brand-text-muted mb-6 pl-1 border-l-2 border-brand-accent tracking-wider">UTILITY BELT</h3>
                
                <div className="grid grid-cols-3 gap-4 md:gap-6">
                    <button 
                        className="flex flex-col items-center justify-center gap-3 px-4 py-5 bg-gradient-to-br from-brand-surface to-brand-bg border border-brand-primary/30 rounded-2xl hover:border-brand-primary transition-all group"
                        onClick={() => onOpenChat()}
                    >
                        <div className="p-2 rounded-full bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                            <ListIcon />
                        </div>
                        <div className="text-center">
                            <span className="block text-xs font-bold text-brand-text group-hover:text-brand-primary transition-colors">Summarize</span>
                            <span className="block text-[9px] text-brand-text-muted mt-0.5">Smart Briefs</span>
                        </div>
                    </button>
                    
                    <button 
                        className="flex flex-col items-center justify-center gap-3 px-4 py-5 bg-gradient-to-br from-brand-surface to-brand-bg border border-brand-primary/30 rounded-2xl hover:border-brand-primary transition-all group"
                        onClick={() => onOpenLive()}
                    >
                        <div className="p-2 rounded-full bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-colors">
                            <MicIcon />
                        </div>
                        <div className="text-center">
                            <span className="block text-xs font-bold text-brand-text group-hover:text-brand-accent transition-colors">Voice Search</span>
                            <span className="block text-[9px] text-brand-text-muted mt-0.5">Hands-Free</span>
                        </div>
                    </button>

                    <button 
                        className="flex flex-col items-center justify-center gap-3 px-4 py-5 bg-gradient-to-br from-brand-surface to-brand-bg border border-brand-primary/30 rounded-2xl hover:border-brand-primary transition-all group"
                        onClick={() => onSearch('Analysis')}
                    >
                        <div className="p-2 rounded-full bg-brand-secondary/10 text-brand-secondary group-hover:bg-brand-secondary group-hover:text-white transition-colors">
                             <ChartIcon />
                        </div>
                        <div className="text-center">
                            <span className="block text-xs font-bold text-brand-text group-hover:text-brand-secondary transition-colors">Deep Dive</span>
                            <span className="block text-[9px] text-brand-text-muted mt-0.5">Analytics</span>
                        </div>
                    </button>
                </div>
            </section>


            {/* SECTION F: FOOTER NOTE */}
            <footer className="mt-12 py-16 border-t border-brand-primary/10 bg-black/40 text-center">
                <div className="flex flex-col items-center gap-6">
                    <p className="text-[10px] text-brand-text-muted font-orbitron tracking-widest uppercase opacity-60">
                        Designed & Architected By
                    </p>
                    <NeonSignature size="sm" />
                </div>
            </footer>
        </div>
    );
};

export default HomeView;
