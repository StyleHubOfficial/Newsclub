
import React, { useCallback, useRef } from 'react';
import { NewsArticle } from '../types';
import ReelCard from './ReelCard';
import { HolographicScanner } from './Loaders';
import { HomeIcon } from './icons';

interface ReelsViewProps {
    articles: NewsArticle[];
    onCardClick: (article: NewsArticle) => void;
    onToggleSave: (articleId: number) => void;
    savedArticles: Set<number>;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    onExitReels?: () => void;
}

const ReelsView: React.FC<ReelsViewProps> = ({ 
    articles, 
    onCardClick, 
    onToggleSave, 
    savedArticles,
    onLoadMore,
    isLoadingMore,
    onExitReels
}) => {
    const observer = useRef<IntersectionObserver | null>(null);

    const lastReelRef = useCallback((node: HTMLDivElement) => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && onLoadMore) {
                onLoadMore();
            }
        });
        
        if (node) observer.current.observe(node);
    }, [isLoadingMore, onLoadMore]);

    if (articles.length === 0) {
        return (
            <div className="h-screen w-full flex flex-col justify-center items-center text-center text-brand-text-muted p-4 bg-black">
                 <h3 className="text-2xl font-orbitron">No articles found.</h3>
                <p className="mt-2">Try adjusting your selections or view your saved articles.</p>
                 {onExitReels && (
                    <button onClick={onExitReels} className="mt-8 px-6 py-2 border border-brand-primary text-brand-primary rounded-full hover:bg-brand-primary/10 transition-colors">
                        Return to Grid
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-black">
            {/* Go Back / Exit Button - Adjusted for Mobile Notch/Status Bar */}
            {onExitReels && (
                <div className="absolute top-10 md:top-6 left-6 z-50">
                    <button 
                        onClick={onExitReels}
                        className="
                            p-3 rounded-full 
                            bg-white/5 backdrop-blur-md 
                            border border-white/20 
                            text-white 
                            shadow-[0_0_15px_rgba(0,0,0,0.5)]
                            hover:bg-brand-primary/10 hover:border-brand-primary hover:shadow-[0_0_20px_rgba(58,190,254,0.3)]
                            active:scale-95
                            transition-all duration-300 group
                        "
                        aria-label="Exit Reels"
                    >
                        <div className="transform group-hover:-translate-x-1 transition-transform">
                            <HomeIcon className="h-6 w-6" />
                        </div>
                    </button>
                </div>
            )}

            <div className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-hide">
                {articles.map((article, index) => (
                    <div 
                        key={article.id} 
                        ref={index === articles.length - 1 ? lastReelRef : null}
                        className="h-full w-full snap-start"
                    >
                        <ReelCard 
                            article={article} 
                            onClick={onCardClick} 
                            onToggleSave={onToggleSave}
                            isSaved={savedArticles.has(article.id)}
                        />
                    </div>
                ))}
                 {isLoadingMore && (
                    <div className="h-24 w-full flex items-center justify-center snap-end bg-black absolute bottom-0">
                         <HolographicScanner text="LOADING NEXT REEL" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReelsView;