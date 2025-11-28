
import React, { useState } from 'react';
import { SearchIcon, SettingsIcon, BookmarkIcon } from './icons';

interface HeaderProps {
    onSearch: (query: string) => void;
    isSearching: boolean;
    onPersonalizeClick: () => void;
    viewMode: 'grid' | 'reels';
    onToggleViewMode: () => void;
    showSavedOnly: boolean;
    onToggleShowSaved: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onSearch, isSearching, onPersonalizeClick, 
    showSavedOnly, onToggleShowSaved 
}) => {
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <header className="bg-brand-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-brand-primary/20 shadow-lg">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                     {/* Designer Name Plate (Replaces G-News/Logo) */}
                     <div className="relative group cursor-default">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-pink rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-500 animate-pulse-glow"></div>
                        <div className="relative px-4 py-2 bg-brand-surface ring-1 ring-brand-primary/30 rounded-lg flex flex-col justify-center">
                            <span className="text-[10px] text-brand-text-muted font-orbitron tracking-widest uppercase leading-none mb-1">Created By</span>
                            <span className="font-syncopate font-bold text-sm md:text-base bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-white to-neon-pink bg-[length:200%_auto] animate-hologram drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
                                Lakshya Bhamu
                            </span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                         <div className="w-px h-8 bg-brand-text-muted/30"></div>
                         <h1 className="font-orbitron text-lg font-bold text-brand-text tracking-widest opacity-80">
                            NEWS CLUB
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     <form onSubmit={handleSearch} className="hidden md:block w-64 lg:w-96 relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search intelligence..."
                            className="w-full bg-brand-bg border border-brand-primary/30 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-primary focus:shadow-[0_0_10px_#0ea5e9] transition-all text-brand-text placeholder-brand-text-muted/50"
                            disabled={isSearching}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-primary">
                            <SearchIcon />
                        </div>
                         {isSearching && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                            </div>
                        )}
                    </form>

                     <button onClick={onPersonalizeClick} className="p-2 text-brand-text-muted hover:text-brand-primary transition-colors rounded-full hover:bg-brand-bg/50 border border-transparent hover:border-brand-primary/30" aria-label="Personalize Feed">
                        <SettingsIcon />
                    </button>
                    <button onClick={onToggleShowSaved} className={`p-2 transition-colors rounded-full hover:bg-brand-bg/50 border border-transparent hover:border-brand-primary/30 ${showSavedOnly ? 'text-brand-secondary shadow-[0_0_10px_#6366f1]' : 'text-brand-text-muted hover:text-brand-primary'}`} aria-label="Show Saved Articles">
                        <BookmarkIcon isSaved={showSavedOnly} />
                    </button>
                    {/* View Mode Toggle Removed as requested */}
                </div>
            </div>
        </header>
    );
};

export default Header;
