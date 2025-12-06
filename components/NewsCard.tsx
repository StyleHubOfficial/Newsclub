
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
            className={`
                relative z-0 group cursor-pointer overflow-hidden
                rounded-[24px] 
                bg-gradient-to-br from-white/10 via-[#050505]/40 to-transparent
                backdrop-blur-xl 
                border border-white/10
                shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]
                shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]
                
                /* Micro-Interactions */
                animate-card-enter
                transition-all duration-300 
                hover:scale-[1.02] 
                hover:shadow-[0_20px_50px_-12px_rgba(58,190,254,0.3)]
                hover:border-brand-primary/40
                
                ${article.isSummaryLoading ? 'animate-pulse' : ''}
            `}
            onClick={() => onClick(article)}
        >
            {/* Holographic Overlay Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
            
            {/* Sheen Micro-Interaction */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-sheen pointer-events-none z-20 w-1/2 h-full skew-x-12"></div>

            {/* Corner Accents - Hi-Tech Brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/20 rounded-tl-[24px] group-hover:border-brand-primary group-hover:w-12 group-hover:h-12 transition-all duration-500 z-20"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/20 rounded-br-[24px] group-hover:border-brand-accent group-hover:w-12 group-hover:h-12 transition-all duration-500 z-20"></div>

            <div className="relative z-10">
                <div className="relative overflow-hidden h-52">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-90 group-hover:brightness-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90"></div>
                    
                    <div className="absolute top-3 right-3 z-30">
                        {/* Neon Circular Action Icon */}
                        <button 
                            onClick={handleSaveClick} 
                            className={`
                                group/icon relative overflow-hidden
                                p-2.5 rounded-full transition-all duration-300 backdrop-blur-xl border 
                                ${isSaved 
                                    ? 'bg-brand-primary text-[#050505] shadow-[0_0_15px_#3ABEFE] border-brand-primary' 
                                    : 'bg-black/40 text-white border-white/10 hover:text-brand-primary hover:bg-black/60 hover:border-brand-primary/50'
                                }
                                hover:scale-110 hover:rotate-12
                                active:scale-95 active:animate-ripple
                            `}
                            aria-label={isSaved ? "Unsave article" : "Save article"}
                        >
                            {/* Inner Hologram Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity"></div>
                            <BookmarkIcon isSaved={isSaved} className="w-5 h-5 relative z-10" />
                        </button>
                    </div>

                    <div className="absolute bottom-0 left-0 p-5 w-full">
                        <span className="inline-block bg-brand-primary/10 border border-brand-primary/30 text-brand-primary font-bold text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-[0_0_15px_rgba(58,190,254,0.1)] mb-3 backdrop-blur-md">
                            {article.category}
                        </span>
                        <h2 className="font-orbitron text-lg md:text-xl text-white group-hover:text-brand-primary transition-colors drop-shadow-lg leading-tight">
                            {article.title}
                        </h2>
                    </div>
                </div>
                 <div className="p-5 h-[110px] flex items-center relative border-t border-white/5 bg-white/5 backdrop-blur-sm">
                     {article.isSummaryLoading ? (
                        <div className="w-full space-y-3">
                            <div className="h-1.5 bg-brand-primary/20 rounded w-3/4 animate-pulse"></div>
                            <div className="h-1.5 bg-brand-primary/10 rounded w-full animate-pulse"></div>
                            <div className="h-1.5 bg-brand-primary/20 rounded w-1/2 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className="text-brand-text-muted text-sm line-clamp-3 group-hover:text-white transition-colors leading-relaxed font-light tracking-wide">
                            {article.summary}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsCard;