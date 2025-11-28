
import React, { useCallback, useRef } from 'react';
import { NewsArticle } from '../types';
import ReelCard from './ReelCard';
import { HolographicScanner } from './Loaders';

interface ReelsViewProps {
    articles: NewsArticle[];
    onCardClick: (article: NewsArticle) => void;
    onToggleSave: (articleId: number) => void;
    savedArticles: Set<number>;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
}

const ReelsView: React.FC<ReelsViewProps> = ({ 
    articles, 
    onCardClick, 
    onToggleSave, 
    savedArticles,
    onLoadMore,
    isLoadingMore 
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
            <div className="h-[calc(100vh-68px)] flex flex-col justify-center items-center text-center text-brand-text-muted p-4">
                 <h3 className="text-2xl font-orbitron">No articles found.</h3>
                <p className="mt-2">Try adjusting your selections or view your saved articles.</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-68px)] w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
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
                <div className="h-24 w-full flex items-center justify-center snap-end bg-black">
                     <HolographicScanner text="LOADING NEXT REEL" />
                </div>
            )}
        </div>
    );
};

export default ReelsView;
