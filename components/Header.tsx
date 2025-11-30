
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
    const [authDomainError, setAuthDomainError] = useState<string | null>(null);

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
        setAuthDomainError(null);
        try {
            await loginWithGoogle();
        } catch (e: any) {
            console.error("Login error:", e);
            if (e.code === 'auth/unauthorized-domain') {
                setAuthDomainError(window.location.hostname);
            } else {
                alert("Login failed: " + (e.message || "Unknown error"));
            }
        }
    };

    const handleLogout = async () => {
        await logoutUser();
    };

    // Helper for button styles
    const navButtonStyle = (isActive: boolean, activeColorClass: string, activeShadowClass: string) => `
        flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border
        font-orbitron text-[10px] font-bold tracking-wider
        ${isActive 
            ? `bg-${activeColorClass}/10 text-${activeColorClass} border-${activeColorClass}/30 shadow-[0_0_15px_${activeShadowClass}]` 
            : 'border-transparent text-brand-text-muted hover:text-white hover:bg-white/5 hover:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'
        }
        active:scale-95
    `;

    return (
        <>
            {/* Top Bar: Glassmorphic Style */}
            <header className="sticky top-0 z-40 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] animate-slide-up">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    
                    {/* 1. NEWS CLUB LOGO */}
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onToggleViewMode('grid')}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-primary/20 blur-lg rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                            <LogoIcon className="h-9 w-9 text-brand-primary relative z-10 drop-shadow-[0_0_8px_rgba(58,190,254,0.6)]" />
                        </div>
                        <span className="font-orbitron font-bold text-lg md:text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-white to-brand-accent group-hover:to-white transition-all">
                            NEWS CLUB
                        </span>
                    </div>

                    {/* CENTRAL NAVIGATION (Desktop) - Glass Pill */}
                    <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full px-2 py-1.5 border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
                        
                        {/* 2. HOME */}
                        <button 
                            onClick={() => onToggleViewMode('grid')}
                            className={navButtonStyle(viewMode === 'grid', 'brand-primary', 'rgba(58,190,254,0.2)')}
                        >
                            <HomeIcon className="h-4 w-4" />
                            <span>HOME</span>
                        </button>

                        {/* 3. EXPLORE (Search) */}
                        <div className="relative">
                            <button 
                                onClick={toggleSearch}
                                className={navButtonStyle(isSearchExpanded, 'brand-accent', 'rgba(40,255,211,0.2)')}
                            >
                                <CompassIcon className="h-4 w-4" />
                                <span>EXPLORE</span>
                            </button>
                            
                            {/* Desktop Search Dropdown */}
                            {isSearchExpanded && (
                                <form 
                                    onSubmit={handleSearch}
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-80 bg-[#050505]/90 backdrop-blur-2xl border border-white/10 rounded-xl p-2 shadow-[0_0_30px_rgba(40,255,211,0.15)] flex items-center gap-2 z-50 animate-scale-in"
                                >
                                    <SearchIcon className="h-5 w-5 text-brand-accent ml-2" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Access Global Intelligence..."
                                        className="bg-transparent border-none focus:ring-0 text-sm text-white w-full placeholder-white/30 font-orbitron"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setIsSearchExpanded(false)} className="p-1 hover:text-brand-accent transition-colors">
                                        <CloseIcon className="h-4 w-4" />
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* 4. AI CHAT */}
                        <button 
                            onClick={onOpenChat}
                            className={navButtonStyle(false, 'brand-primary', '')}
                        >
                            <BoltIcon className="h-4 w-4" />
                            <span>AI CHAT</span>
                        </button>

                        {/* 5. REELS */}
                        <button 
                            onClick={() => onToggleViewMode('reels')}
                            className={navButtonStyle(viewMode === 'reels', 'brand-secondary', 'rgba(123,47,255,0.2)')}
                        >
                            <ReelsIcon className="h-4 w-4" />
                            <span>REELS</span>
                        </button>
                    </nav>

                    {/* RIGHT SIDE (Mobile Icons + Profile) */}
                    <div className="flex items-center gap-3">
                        
                        {/* Feedback Button */}
                        <button className="p-2 text-brand-text-muted hover:text-brand-accent transition-colors hidden sm:block hover:bg-white/5 rounded-full" title="Feedback">
                             <MessageSquareIcon className="h-5 w-5" />
                        </button>

                        {/* Mobile Search Icon */}
                        <button onClick={toggleSearch} className="md:hidden p-2 text-brand-text-muted hover:text-brand-accent transition-colors hover:bg-white/5 rounded-full">
                            <CompassIcon className="h-6 w-6" />
                        </button>

                        {/* 6. PROFILE / LOGIN */}
                        {user ? (
                             <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                                 <button 
                                    onClick={onPersonalizeClick}
                                    className="w-9 h-9 rounded-full overflow-hidden border border-brand-primary/30 hover:border-brand-primary hover:shadow-[0_0_15px_#3ABEFE] transition-all"
                                >
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-5 w-5 m-2 text-brand-text" />
                                    )}
                                </button>
                                <button onClick={handleLogout} className="hidden md:block text-[10px] font-orbitron text-brand-text-muted hover:text-brand-primary transition-colors">
                                    LOGOUT
                                </button>
                             </div>
                        ) : (
                             <button 
                                onClick={handleLogin}
                                className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-brand-primary/50 text-brand-primary font-orbitron text-[10px] font-bold tracking-wider hover:bg-brand-primary hover:text-[#050505] transition-all duration-300 shadow-[0_0_10px_rgba(58,190,254,0.1)] hover:shadow-[0_0_20px_rgba(58,190,254,0.6)] backdrop-blur-sm active:scale-95"
                            >
                                <UserIcon className="h-4 w-4" />
                                <span>LOGIN</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Search Overlay */}
                {isSearchExpanded && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-[#050505]/95 backdrop-blur-2xl border-b border-brand-primary/20 p-4 animate-slide-up shadow-2xl z-50">
                        <form onSubmit={handleSearch} className="flex items-center gap-3 bg-white/5 border border-brand-accent/30 rounded-full px-4 py-3 shadow-inner">
                            <SearchIcon className="h-5 w-5 text-brand-accent" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search intelligence..."
                                className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-white/30 text-sm font-orbitron"
                                autoFocus
                            />
                            <button type="button" onClick={() => setIsSearchExpanded(false)}>
                                <CloseIcon className="h-5 w-5 text-brand-text-muted hover:text-white" />
                            </button>
                        </form>
                    </div>
                )}
            </header>

            {/* FIREBASE DOMAIN ERROR MODAL */}
            {authDomainError && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-[#050505] border border-brand-secondary rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_rgba(123,47,255,0.3)] relative">
                        <button 
                            onClick={() => setAuthDomainError(null)}
                            className="absolute top-4 right-4 text-brand-text-muted hover:text-white"
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-brand-secondary/10 flex items-center justify-center border border-brand-secondary animate-pulse">
                                <BoltIcon className="h-8 w-8 text-brand-secondary" />
                            </div>
                            
                            <h3 className="text-2xl font-orbitron font-bold text-white tracking-widest">ACCESS DENIED</h3>
                            
                            <p className="text-brand-text-muted text-sm">
                                Security Protocol Violation: Unauthorized Domain
                            </p>

                            <div className="w-full bg-black border border-brand-primary/20 rounded-lg p-4 text-left">
                                <p className="text-[10px] text-brand-primary uppercase tracking-widest mb-2">Required Action</p>
                                <code className="block w-full bg-[#111] p-2 rounded text-brand-accent font-mono text-xs break-all select-all border border-white/5">
                                    {authDomainError}
                                </code>
                            </div>

                            <button 
                                onClick={() => setAuthDomainError(null)}
                                className="w-full py-3 bg-brand-secondary hover:bg-brand-secondary/80 text-white font-bold rounded-lg transition-colors mt-4 font-orbitron tracking-widest text-xs shadow-[0_0_20px_rgba(123,47,255,0.4)]"
                            >
                                ACKNOWLEDGE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
