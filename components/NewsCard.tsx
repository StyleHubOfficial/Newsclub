
import React from 'react';
import { NewsArticle } from '../types';
import { BookmarkIcon } from './icons';

interface NewsCardProps {
    article: NewsArticle;
    onClick: (article: NewsArticle) => void;
    onToggleSave: (articleId: number) => void;
    isSaved: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onClick, onToggleSave, isSaved }) => {
    
    const handleSaveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSave(article.id);
    };

    return (
        <div 
            className={`bg-brand-surface/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-brand-primary/20 group
                        transition-all duration-300 transform 
                        hover:-translate-y-2 hover:scale-[1.01] 
                        hover:shadow-[0_0_25px_rgba(14,165,233,0.25)] hover:border-brand-primary/60
                        cursor-pointer relative z-0
                        ${article.isSummaryLoading ? 'animate-pulse' : ''}`}
            onClick={() => onClick(article)}
        >
            {/* Holographic Overlay Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-primary/0 group-hover:border-brand-primary/80 transition-all duration-300 z-20"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-secondary/0 group-hover:border-brand-secondary/80 transition-all duration-300 z-20"></div>

            <div className="relative z-10">
                <div className="relative overflow-hidden h-56">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-transparent opacity-90"></div>
                    
                    <div className="absolute top-3 right-3 z-30">
                        <button 
                            onClick={handleSaveClick} 
                            className={`p-2 rounded-full transition-all backdrop-blur-md ${isSaved ? 'bg-brand-primary text-white shadow-[0_0_10px_#0ea5e9]' : 'bg-black/40 text-white hover:text-brand-primary hover:bg-white/10'}`}
                            aria-label={isSaved ? "Unsave article" : "Save article"}
                        >
                            <BookmarkIcon isSaved={isSaved} />
                        </button>
                    </div>

                    <div className="absolute bottom-0 left-0 p-5 w-full">
                        <span className="inline-block bg-brand-primary/90 text-brand-bg font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm shadow-[0_0_10px_rgba(14,165,233,0.5)] mb-2">
                            {article.category}
                        </span>
                        <h2 className="font-orbitron text-xl text-white group-hover:text-brand-primary transition-colors drop-shadow-md leading-tight">
                            {article.title}
                        </h2>
                    </div>
                </div>
                 <div className="p-5 h-[100px] flex items-center relative border-t border-brand-primary/10 bg-brand-bg/30">
                     {article.isSummaryLoading ? (
                        <div className="w-full">
                            <div className="space-y-3">
                                <div className="h-2 bg-brand-primary/20 rounded w-4/5 animate-pulse"></div>
                                <div className="h-2 bg-brand-primary/20 rounded animate-pulse"></div>
                                <div className="h-2 bg-brand-primary/20 rounded w-2/4 animate-pulse"></div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-brand-text-muted text-sm line-clamp-3 group-hover:text-brand-text transition-colors leading-relaxed">
                            {article.summary}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsCard;
