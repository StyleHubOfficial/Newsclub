
import React, { useState, useEffect } from 'react';
import { SearchIcon, LogoIcon, HomeIcon, CompassIcon, BoltIcon, ReelsIcon, UserIcon, CloseIcon, MessageSquareIcon, ShieldIcon, BellIcon } from './icons';
import { logoutUser, auth } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserProfile, getUserMessages } from '../services/dbService';
import { UserRole } from '../types';
import NotificationsModal from './NotificationsModal';
import LoginModal from './LoginModal';

interface HeaderProps {
    onSearch: (query: string) => void;
    isSearching: boolean;
    onPersonalizeClick: () => void;
    viewMode: 'grid' | 'reels' | 'club' | 'admin';
    onToggleViewMode: (mode: 'grid' | 'reels' | 'club' | 'admin') => void;
    showSavedOnly: boolean;
    onToggleShowSaved: () => void;
    onOpenChat: () => void;
    scrollDirection?: 'up' | 'down';
    isAtTop?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    onSearch, 
    isSearching, 
    onPersonalizeClick, 
    viewMode, 
    onToggleViewMode,
    onOpenChat,
    scrollDirection = 'up',
    isAtTop = true
}) => {
    const [query, setQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole>('user');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const profile = await getUserProfile(currentUser.uid);
                if (profile) setUserRole(profile.role);
                
                // Check Notifications
                const msgs = await getUserMessages(currentUser.uid);
                const unread = msgs.filter(m => !m.readBy?.includes(currentUser.uid)).length;
                setUnreadCount(unread);
            } else {
                setUserRole('user');
            }
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

    // Helper for button styles
    const navButtonStyle = (isActive: boolean, activeColorClass: string, activeShadowClass: string) => `
        flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border overflow-hidden relative
        font-orbitron text-[10px] font-bold tracking-wider
        ${isActive 
            ? `bg-${activeColorClass}/10 text-${activeColorClass} border-${activeColorClass}/50 shadow-[0_0_15px_${activeShadowClass}]` 
            : 'border-transparent text-brand-text-muted hover:text-white hover:bg-white/5 hover:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'
        }
        active:scale-95 active:animate-ripple
    `;

    const isVisible = scrollDirection === 'up' || isAtTop;
    const glassStyle = isAtTop ? 'bg-[#050505]/60 backdrop-blur-lg' : 'bg-[#050505]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]';

    return (
        <>
            {/* Top Bar: Fixed Glassmorphic Style with Scroll Transitions */}
            <header 
                className={`
                    fixed top-0 left-0 right-0 z-40 
                    border-b border-white/5 
                    transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
                    ${glassStyle}
                    ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
                `}
            >
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

                    {/* CENTRAL NAVIGATION (Desktop) */}
                    <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full px-2 py-1.5 border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
                        
                        <button 
                            onClick={() => onToggleViewMode('grid')}
                            className={navButtonStyle(viewMode === 'grid', 'brand-primary', 'rgba(58,190,254,0.2)')}
                        >
                            <HomeIcon className="h-4 w-4" />
                            <span>HOME</span>
                        </button>

                        <div className="relative">
                            <button 
                                onClick={toggleSearch}
                                className={navButtonStyle(isSearchExpanded, 'brand-accent', 'rgba(40,255,211,0.2)')}
                            >
                                <CompassIcon className="h-4 w-4" />
                                <span>EXPLORE</span>
                            </button>
                            
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

                        <button 
                            onClick={onOpenChat}
                            className={navButtonStyle(false, 'brand-primary', '')}
                        >
                            <BoltIcon className="h-4 w-4" />
                            <span>AI CHAT</span>
                        </button>

                        <button 
                            onClick={() => onToggleViewMode('reels')}
                            className={navButtonStyle(viewMode === 'reels', 'brand-secondary', 'rgba(123,47,255,0.2)')}
                        >
                            <ReelsIcon className="h-4 w-4" />
                            <span>REELS</span>
                        </button>

                        {(userRole === 'member' || userRole === 'admin') && (
                            <button
                                onClick={() => onToggleViewMode('club')}
                                className={navButtonStyle(viewMode === 'club', 'brand-accent', 'rgba(40,255,211,0.3)')}
                            >
                                <ShieldIcon className="h-4 w-4" />
                                <span>CLUB</span>
                            </button>
                        )}

                        {userRole === 'admin' && (
                            <button
                                onClick={() => onToggleViewMode('admin')}
                                className={navButtonStyle(viewMode === 'admin', 'red-500', 'rgba(239,68,68,0.3)')}
                            >
                                <BoltIcon className="h-4 w-4" />
                                <span>ADMIN</span>
                            </button>
                        )}
                    </nav>

                    {/* RIGHT SIDE (Mobile Icons + Profile) */}
                    <div className="flex items-center gap-3">
                        
                        {user && (
                            <button 
                                onClick={() => setShowNotifications(true)}
                                className="p-2 text-brand-text-muted hover:text-white transition-colors hover:bg-white/5 rounded-full relative"
                            >
                                <BellIcon className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-primary rounded-full animate-pulse border border-black"></span>
                                )}
                            </button>
                        )}

                        <button className="p-2 text-brand-text-muted hover:text-brand-accent transition-colors hidden sm:block hover:bg-white/5 rounded-full relative overflow-hidden active:animate-ripple" title="Feedback">
                             <MessageSquareIcon className="h-5 w-5" />
                        </button>

                        <button onClick={toggleSearch} className="md:hidden p-2 text-brand-text-muted hover:text-brand-accent transition-colors hover:bg-white/5 rounded-full relative overflow-hidden active:animate-ripple">
                            <CompassIcon className="h-6 w-6" />
                        </button>

                        {/* 6. PROFILE / LOGIN */}
                        {user ? (
                             <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                                 <button 
                                    onClick={onPersonalizeClick}
                                    className="w-9 h-9 rounded-full overflow-hidden border border-brand-primary/30 hover:border-brand-primary hover:shadow-[0_0_15px_#3ABEFE] transition-all relative active:scale-95 bg-brand-surface"
                                >
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-5 w-5 m-2 text-brand-text" />
                                    )}
                                </button>
                             </div>
                        ) : (
                             <button 
                                onClick={() => window.location.href = 'https://newsclub-app.vercel.app'}
                                className="
                                    group relative flex items-center justify-center gap-2 px-5 py-2 rounded-full overflow-hidden
                                    bg-white/5 border border-brand-primary/50 
                                    text-brand-primary font-orbitron text-[10px] font-bold tracking-wider 
                                    transition-all duration-300 
                                    hover:bg-brand-primary/10 hover:border-brand-primary hover:text-white hover:shadow-[0_0_20px_rgba(58,190,254,0.6)] 
                                    backdrop-blur-sm active:scale-95 active:animate-ripple
                                "
                            >
                                <UserIcon className="h-4 w-4 relative z-10" />
                                <span className="relative z-10">LOGIN</span>
                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent -translate-x-full group-hover:animate-sheen skew-x-12 z-0"></div>
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

            {/* LOGIN PORTAL MODAL */}
            {showLoginModal && (
                <LoginModal onClose={() => setShowLoginModal(false)} onLoginSuccess={() => setShowLoginModal(false)} />
            )}

            {/* NOTIFICATIONS MODAL */}
            {showNotifications && user && (
                <NotificationsModal userId={user.uid} onClose={() => { setShowNotifications(false); setUnreadCount(0); }} />
            )}
        </>
    );
};

export default Header;
