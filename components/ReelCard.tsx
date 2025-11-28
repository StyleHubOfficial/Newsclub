
import React from 'react';
import { NewsArticle } from '../types';
import { BookmarkIcon } from './icons';

interface ReelCardProps {
    article: NewsArticle;
    onClick: (article: NewsArticle) => void;
    onToggleSave: (articleId: number) => void;
    isSaved: boolean;
}

const ReelCard: React.FC<ReelCardProps> = ({ article, onClick, onToggleSave, isSaved }) => {
    
    const handleSaveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSave(article.id);
    };

    return (
        <div
            className="h-full w-full flex-shrink-0 relative flex flex-col justify-end p-6 md:p-12 text-white overflow-hidden group snap-start"
        >
            <div className="absolute inset-0 z-0">
                <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/40 to-transparent opacity-60 mix-blend-overlay"></div>
            </div>

            <div className="absolute top-20 right-6 md:right-12 z-30">
                <button 
                    onClick={handleSaveClick} 
                    className={`p-3 rounded-full transition-all backdrop-blur-xl border border-white/10 ${isSaved ? 'bg-brand-primary text-white shadow-[0_0_20px_#0ea5e9]' : 'bg-black/30 text-white hover:text-brand-primary hover:bg-black/50'}`}
                    aria-label={isSaved ? "Unsave article" : "Save article"}
                >
                    <BookmarkIcon isSaved={isSaved} className="h-6 w-6 md:h-8 md:w-8" />
                </button>
            </div>
            
            <div className="relative z-20 animate-slide-up space-y-4 max-w-3xl mb-16 md:mb-0">
                <div className="flex items-center gap-3">
                    <span className="inline-block bg-brand-primary text-brand-bg font-bold text-xs uppercase px-3 py-1 rounded-sm shadow-[0_0_15px_rgba(14,165,233,0.6)]">
                        {article.category}
                    </span>
                    <span className="text-xs font-orbitron text-brand-text-muted tracking-widest">{article.source}</span>
                </div>
                
                <h2 className="font-orbitron text-3xl md:text-5xl lg:text-6xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-text to-brand-text-muted">
                    {article.title}
                </h2>
                
                <div className="w-24 h-1 bg-gradient-to-r from-brand-secondary to-transparent rounded-full"></div>
                
                <p className="text-brand-text/90 text-sm md:text-lg lg:text-xl drop-shadow-md line-clamp-3 max-w-2xl leading-relaxed">
                    {article.isSummaryLoading ? 'Decoding transmission stream...' : article.summary}
                </p>
                
                 <button 
                    onClick={() => onClick(article)}
                    className="mt-6 bg-brand-bg/30 hover:bg-brand-secondary/90 text-white backdrop-blur-md font-orbitron font-bold py-3 px-8 rounded-full border border-brand-secondary/50 hover:border-brand-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all transform hover:translate-x-1 group-active:scale-95 flex items-center gap-2"
                >
                    ACCESS DATA
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>
        </div>
    );
};

export default ReelCard;
