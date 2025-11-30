
import React, { useState, useEffect } from 'react';
import { SearchIcon, LogoIcon, HomeIcon, CompassIcon, BoltIcon, ReelsIcon, UserIcon, CloseIcon, MessageSquareIcon } from './icons';
import { loginWithGoogle, logoutUser, auth } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface HeaderProps {
    onSearch: (query: string) => void;
    isSearching: boolean;
    onPersonalizeClick: () => void;
    viewMode: 'grid' | 'reels';
    onToggleViewMode: (mode: 'grid' | 'reels') => void;
    showSavedOnly: boolean;
    onToggleShowSaved: () => void;
    onOpenChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onSearch, 
    isSearching, 
    onPersonalizeClick, 
    viewMode, 
    onToggleViewMode,
    onOpenChat
}) => {
    const [query, setQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
        setIsSearchExpanded(false);
    };

    const toggleSearch = () => {
        setIsSearchExpanded(!isSearchExpanded);
    };

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (e: any) {
            console.error("Login error:", e);
            if (e.code === 'auth/unauthorized-domain') {
                const domain = window.location.hostname;
                alert(`⚠️ LOGIN BLOCKED: DOMAIN NOT AUTHORIZED\n\nFirebase does not recognize this domain (${domain}).\n\nTO FIX:\n1. Go to Firebase Console > Authentication > Settings > Authorized Domains.\n2. Click "Add Domain".\n3. Paste: ${domain}`);
            } else if (e.code === 'auth/popup-closed-by-user') {
                // User closed popup, ignore
            } else {
                alert("Login failed: " + (e.message || "Unknown error"));
            }
        }
    };

    const handleLogout = async () => {
        await logoutUser();
    };

    return (
        <header className="sticky top-0 z-40 bg-brand-surface/80 backdrop-blur-md border-b border-brand-primary/20 shadow-lg animate-slide-up">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                
                {/* 1. NEWS CLUB LOGO */}
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onToggleViewMode('grid')}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-primary/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <LogoIcon className="h-8 w-8 text-brand-primary relative z-10" />
                    </div>
                    <span className="font-orbitron font-bold text-lg md:text-xl tracking-widest text-brand-text group-hover:text-brand-primary transition-colors">
                        NEWS CLUB
                    </span>
                </div>

                {/* CENTRAL NAVIGATION (Desktop) */}
                <nav className="hidden md:flex items-center gap-1 bg-brand-bg/50 rounded-full px-2 py-1 border border-brand-primary/10">
                    
                    {/* 2. HOME */}
                    <button 
                        onClick={() => onToggleViewMode('grid')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${viewMode === 'grid' ? 'bg-brand-primary/20 text-brand-primary shadow-[0_0_10px_rgba(14,165,233,0.3)]' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-primary/5'}`}
                    >
                        <HomeIcon className="h-5 w-5" />
                        <span className="font-orbitron text-xs font-bold">HOME</span>
                    </button>

                    {/* 3. EXPLORE (Search) */}
                    <div className="relative">
                        <button 
                            onClick={toggleSearch}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isSearchExpanded ? 'bg-brand-accent/20 text-brand-accent shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-primary/5'}`}
                        >
                            <CompassIcon className="h-5 w-5" />
                            <span className="font-orbitron text-xs font-bold">EXPLORE</span>
                        </button>
                        
                        {/* Desktop Search Dropdown */}
                        {isSearchExpanded && (
                            <form 
                                onSubmit={handleSearch}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-brand-surface border border-brand-primary/30 rounded-xl p-2 shadow-2xl flex items-center gap-2 z-50 animate-scale-in"
                            >
                                <SearchIcon className="h-5 w-5 text-brand-primary ml-2" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search intelligence..."
                                    className="bg-transparent border-none focus:ring-0 text-sm text-brand-text w-full placeholder-brand-text-muted/50"
                                    autoFocus
                                />
                                <button type="button" onClick={() => setIsSearchExpanded(false)} className="p-1 hover:text-brand-accent">
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </form>
                        )}
                    </div>

                    {/* 4. AI CHAT */}
                    <button 
                        onClick={onOpenChat}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-brand-text-muted hover:text-brand-text hover:bg-brand-primary/5 transition-all duration-300"
                    >
                        <BoltIcon className="h-5 w-5" />
                        <span className="font-orbitron text-xs font-bold">AI CHAT</span>
                    </button>

                    {/* 5. REELS */}
                    <button 
                        onClick={() => onToggleViewMode('reels')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${viewMode === 'reels' ? 'bg-brand-secondary/20 text-brand-secondary shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-primary/5'}`}
                    >
                        <ReelsIcon className="h-5 w-5" />
                        <span className="font-orbitron text-xs font-bold">REELS</span>
                    </button>
                </nav>

                {/* RIGHT SIDE (Mobile Icons + Profile) */}
                <div className="flex items-center gap-3">
                    
                    {/* Feedback Button */}
                    <button className="p-2 text-brand-text-muted hover:text-brand-primary transition-colors hidden sm:block" title="Feedback">
                         <MessageSquareIcon className="h-5 w-5" />
                    </button>

                    {/* Mobile Search Icon */}
                    <button onClick={toggleSearch} className="md:hidden p-2 text-brand-text-muted hover:text-brand-primary">
                        <CompassIcon className="h-6 w-6" />
                    </button>

                    {/* 6. PROFILE / LOGIN */}
                    {user ? (
                         <div className="flex items-center gap-2">
                             <button 
                                onClick={onPersonalizeClick}
                                className="w-10 h-10 rounded-full overflow-hidden border border-brand-primary/50 hover:shadow-[0_0_15px_#0ea5e9] transition-all"
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="h-6 w-6 m-2 text-brand-text" />
                                )}
                            </button>
                            <button onClick={handleLogout} className="text-[10px] font-orbitron text-red-400 hover:text-red-300">
                                LOGOUT
                            </button>
                         </div>
                    ) : (
                         <button 
                            onClick={handleLogin}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300"
                        >
                            <UserIcon className="h-4 w-4" />
                            <span className="font-orbitron text-xs font-bold">LOGIN</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Search Overlay */}
            {isSearchExpanded && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-brand-surface/95 backdrop-blur-xl border-b border-brand-primary/20 p-4 animate-slide-up shadow-xl">
                    <form onSubmit={handleSearch} className="flex items-center gap-3 bg-brand-bg/50 border border-brand-primary/30 rounded-full px-4 py-2">
                        <SearchIcon className="h-5 w-5 text-brand-primary" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search..."
                            className="bg-transparent border-none focus:ring-0 text-brand-text w-full placeholder-brand-text-muted"
                            autoFocus
                        />
                        <button type="button" onClick={() => setIsSearchExpanded(false)}>
                            <CloseIcon className="h-5 w-5 text-brand-text-muted" />
                        </button>
                    </form>
                </div>
            )}
        </header>
    );
};

export default Header;
