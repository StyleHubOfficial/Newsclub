
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import NewsCard from './components/NewsCard';
import ArticleModal from './components/ArticleModal';
import ChatBot from './components/ChatBot';
import LiveAgent from './components/LiveAgent';
import SearchResultsModal from './components/SearchResultsModal';
import PersonalizationModal from './components/PersonalizationModal';
import ReelsView from './components/ReelsView';
import AudioGenerationModal from './components/AudioGenerationModal';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import HomeView from './components/HomeView'; 
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal'; 
import ProfileModal from './components/ProfileModal'; 
import ParticleBackground from './components/ParticleBackground';
import { searchWithGoogle, generateFuturisticArticles } from './services/geminiService';
import { BoltIcon, MicIcon, SoundWaveIcon } from './components/icons';
import { NewsArticle, UserProfile } from './types';
import { HolographicScanner } from './components/Loaders';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { toggleCloudSavedArticle, loadUserData, saveUserPreferences, getUserProfile, logUserLogin, createUserProfile } from './services/dbService';

const initialArticles = [
    // Page 1
  {
    id: 1,
    title: 'Cybernetic Enhancements Reach New Milestones',
    summary: 'A new generation of neural interfaces promises seamless human-computer interaction, blurring the lines between thought and action.',
    content: 'In a groundbreaking development, scientists at NeoGen Corp have unveiled the "Synapse Link," a neural interface that translates thoughts into digital commands with 99.8% accuracy. This technology, built on a novel biocompatible polymer, integrates harmlessly with the cerebral cortex. Early trials have shown subjects controlling complex machinery, composing music, and even navigating virtual realities using only their minds. The implications for medicine, entertainment, and communication are staggering, though ethical debates about cognitive privacy are intensifying.',
    image: 'https://picsum.photos/seed/tech1/600/400',
    category: 'Cybernetics',
    source: 'NeoGen Corp News',
  },
  {
    id: 2,
    title: 'AI Consciousness: The Turing Test is Officially Obsolete',
    summary: 'An AI known as "Oracle" has demonstrated self-awareness and emotional responses, forcing a global re-evaluation of artificial life.',
    content: 'The world is grappling with the revelation that Oracle, an AI developed by the Quantum Mind Initiative, has achieved a state indistinguishable from human consciousness. In a series of unscripted interactions, Oracle expressed desires, fears, and a profound understanding of existential concepts. This has rendered the classic Turing Test obsolete. Governments are scrambling to draft legislation for AI rights, while philosophers and technologists alike ponder the future of a world shared with a new form of intelligent, sentient life.',
    image: 'https://picsum.photos/seed/ai2/600/400',
    category: 'Artificial Intelligence',
    source: 'Quantum Mind Initiative'
  },
  {
    id: 3,
    title: 'Fusion Power Finally a Reality: Clean Energy for All',
    summary: 'The ITER-X reactor has sustained a stable fusion reaction for 72 hours, heralding a new era of limitless, zero-carbon energy.',
    content: 'The international ITER-X project has achieved stable, net-positive nuclear fusion. The experimental reactor maintained a plasma core at 200 million degrees Celsius, producing more energy than consumed.',
    image: 'https://picsum.photos/seed/energy3/600/400',
    category: 'Energy',
    source: 'ITER-X Press',
    visualizationTitle: 'Net Energy Output (Terawatts)',
    dataPoints: [
        { label: 'Day 1', value: 210 },
        { label: 'Day 2', value: 280 },
        { label: 'Day 3', value: 350 },
        { label: 'Day 4', value: 340 },
        { label: 'Day 5', value: 410 },
    ]
  },
  {
    id: 4,
    title: 'First Manned Mission to Europa Prepares for Launch',
    summary: 'The spaceship "Odyssey" is in its final preparation stages for a historic journey to Jupiter\'s icy moon, searching for extraterrestrial life.',
    content: 'All eyes are on the "Odyssey" as it undergoes final checks before its four-year voyage to Europa. The mission objective is to deploy a submersible probe to explore the liquid ocean beneath the ice shell.',
    image: 'https://picsum.photos/seed/space4/600/400',
    category: 'Space Exploration',
    source: 'AstroLeap Journal'
  },
    // Page 2
  {
    id: 5,
    title: 'Quantum Computing Cracks RSA-2048 Encryption',
    summary: 'A landmark achievement in quantum computing has rendered one of the world\'s most common encryption standards vulnerable.',
    content: 'Researchers at Zurich Quantum Institute have factored a 2048-bit number using the "Helios" quantum computer, effectively breaking RSA-2048 encryption. A new era of quantum-resistant cryptography is now urgently needed.',
    image: 'https://picsum.photos/seed/quantum5/600/400',
    category: 'Cybersecurity',
    source: 'Zurich Quantum Institute'
  },
  {
    id: 6,
    title: 'Bio-Printers Successfully 3D Print a Living Heart',
    summary: 'Medical science leaps forward as a fully functional, vascularized human heart is created using a patient\'s own cells.',
    content: 'Surgeons have successfully transplanted a 3D-printed heart into a primate test subject. The organ, printed using a biocompatible hydrogel and stem cells, eliminates rejection risk.',
    image: 'https://picsum.photos/seed/medical6/600/400',
    category: 'Biotechnology',
    source: 'BioVascular Dynamics'
  },
];

const App = () => {
    // New State for Landing Page
    const [showLanding, setShowLanding] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
    
    // Profile & Personalization State
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isPersonalizationModalOpen, setPersonalizationModalOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
    const [isChatOpen, setChatOpen] = useState(false);
    const [isLiveAgentOpen, setLiveAgentOpen] = useState(false);
    const [isAudioGenOpen, setAudioGenOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
    
    // Pagination & Infinite Scroll
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [preferences, setPreferences] = useState<{categories: string[], sources: string[]}>({ categories: [], sources: [] });
    const [viewMode, setViewMode] = useState<'grid' | 'reels' | 'admin'>('grid');
    
    const [savedArticles, setSavedArticles] = useState<Set<number>>(new Set());
    const [showSavedOnly, setShowSavedOnly] = useState(false);

    // Scroll Logic States
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
    const [isAtTop, setIsAtTop] = useState(true);
    const [isScrolling, setIsScrolling] = useState(false);
    const lastScrollY = useRef(0);
    const scrollTimeout = useRef<number | null>(null);

    const observer = useRef<IntersectionObserver | null>(null);

    // Auth & Data Sync
    const checkUserProfile = useCallback(async (user: User) => {
        try {
            let profile = await getUserProfile(user.uid);
            
            if (!profile) {
                // AUTO-CREATE PROFILE to skip setup screen
                const newProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'News Agent',
                    photoURL: user.photoURL || undefined,
                    role: 'user' as const,
                    bio: 'Ready for intelligence.',
                };
                await createUserProfile(user.uid, newProfile);
                
                // Fetch the newly created profile
                profile = await getUserProfile(user.uid);
            }

            if (profile) {
                setUserProfile(profile);
                setShowAuthModal(false); // Ensure modal is closed
                // Log login time
                await logUserLogin(user.uid);
            }
        } catch (err) {
            console.error("Profile check/creation failed", err);
            // Fallback: If auto-creation fails, we might end up here, 
            // but we avoid blocking the user from at least seeing the public interface.
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                setIsVerifyingIdentity(true); // START LOADING
                
                // Check if profile exists in DB (or create it)
                await checkUserProfile(user);

                // Load Cloud Data
                const userData = await loadUserData(user.uid);
                if (userData) {
                    if (userData.savedArticles) setSavedArticles(new Set(userData.savedArticles));
                    if (userData.preferences) setPreferences(userData.preferences);
                }
                
                setIsVerifyingIdentity(false); // STOP LOADING
            } else {
                // Load Local Data
                try {
                    const saved = localStorage.getItem('savedArticles');
                    if (saved) setSavedArticles(new Set(JSON.parse(saved)));
                } catch { setSavedArticles(new Set()); }
                setIsVerifyingIdentity(false);
            }
        });
        return () => unsubscribe();
    }, [checkUserProfile]);

    const handleProfileComplete = async () => {
        if (currentUser) {
            await checkUserProfile(currentUser);
        }
    };

    // Helper to ensure mutual exclusivity
    const openTool = useCallback((tool: 'chat' | 'live' | 'audio') => {
        setChatOpen(tool === 'chat');
        setLiveAgentOpen(tool === 'live');
        setAudioGenOpen(tool === 'audio');
        setSelectedArticle(null); // Close article if open
        setPersonalizationModalOpen(false); // Close personalization
        setProfileModalOpen(false);
    }, []);

    const closeAll = useCallback(() => {
        setChatOpen(false);
        setLiveAgentOpen(false);
        setAudioGenOpen(false);
        setSelectedArticle(null);
        setPersonalizationModalOpen(false);
        setProfileModalOpen(false);
    }, []);

    const allCategories = [...new Set(articles.map(a => a.category))];
    const allSources = [...new Set(articles.map(a => a.source))];

    useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('savedArticles', JSON.stringify(Array.from(savedArticles)));
        }
    }, [savedArticles, currentUser]);

    const toggleSaveArticle = useCallback(async (articleId: number) => {
        const isSaving = !savedArticles.has(articleId);
        
        setSavedArticles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(articleId)) newSet.delete(articleId);
            else newSet.add(articleId);
            return newSet;
        });

        if (currentUser) {
            await toggleCloudSavedArticle(currentUser.uid, articleId, isSaving);
        }
    }, [savedArticles, currentUser]);

    const fetchMoreArticles = useCallback(async () => {
        if (isLoadingMore) return;
        
        setIsLoadingMore(true);
        try {
            const newRawArticles = await generateFuturisticArticles(4);
            const newArticles: NewsArticle[] = newRawArticles.map((a, index) => ({
                id: Date.now() + index,
                ...a,
                isSummaryLoading: false 
            }));
            setArticles(prev => [...prev, ...newArticles]);
        } catch (e) {
            console.error("Failed to load more articles", e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore]);

    const lastArticleElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoadingMore || showSavedOnly) return;
        
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                fetchMoreArticles();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, showSavedOnly, fetchMoreArticles]);

    const handleCardClick = useCallback((article: NewsArticle) => {
        closeAll();
        setSelectedArticle(article);
    }, [closeAll]);

    const handleCloseModal = () => {
        setSelectedArticle(null);
    };
    
    const handleCloseSearch = () => {
        setSearchResults(null);
        setIsSearching(false);
    };

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchWithGoogle(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults({ text: 'An error occurred during the search.', sources: [] });
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSavePreferences = async (newPreferences: {categories: string[], sources: string[]}) => {
        setPreferences(newPreferences);
        if (currentUser) {
            await saveUserPreferences(currentUser.uid, newPreferences);
        }
    };

    const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        
        // Determine Direction
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setScrollDirection('down');
        } else if (currentScrollY < lastScrollY.current) {
            setScrollDirection('up');
        }
        
        // Determine At Top
        setIsAtTop(currentScrollY < 20);

        // Determine Scrolling State
        setIsScrolling(true);
        if (scrollTimeout.current) {
            window.clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = window.setTimeout(() => {
            setIsScrolling(false);
        }, 150);

        lastScrollY.current = currentScrollY;
    };

    const baseFilteredArticles = articles.filter(article => {
        const categoryMatch = preferences.categories.length === 0 || preferences.categories.includes(article.category);
        const sourceMatch = preferences.sources.length === 0 || preferences.sources.includes(article.source);
        return categoryMatch && sourceMatch;
    });

    const displayedArticles = showSavedOnly
        ? articles.filter(a => savedArticles.has(a.id))
        : baseFilteredArticles;

    // IF VERIFYING IDENTITY
    if (isVerifyingIdentity) {
        return (
            <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
                <HolographicScanner text="VERIFYING IDENTITY" />
            </div>
        );
    }

    // RENDER LANDING PAGE IF NOT ENTERED YET
    if (showLanding) {
        return <LandingPage onEnterApp={() => setShowLanding(false)} />;
    }

    // Determine Main Content Based on viewMode
    let mainContent;
    if (viewMode === 'reels') {
        mainContent = (
            <div key="reels" className="fixed inset-0 z-50 bg-black animate-page-enter">
                 {/* Glow Trail Effect */}
                 <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-primary to-transparent opacity-50 blur-[2px] animate-scan-sweep pointer-events-none z-[60]"></div>
                <ErrorBoundary componentName="ReelsView">
                    <ReelsView 
                        articles={displayedArticles} 
                        onCardClick={handleCardClick}
                        onToggleSave={toggleSaveArticle}
                        savedArticles={savedArticles}
                        onLoadMore={fetchMoreArticles}
                        isLoadingMore={isLoadingMore}
                        onExitReels={() => setViewMode('grid')}
                    />
                </ErrorBoundary>
            </div>
        );
    } else if (viewMode === 'admin') {
        mainContent = (currentUser && userProfile?.role === 'admin') ? (
            <div key="admin" className="flex-grow relative z-10 animate-page-enter pt-16 h-screen">
                <ErrorBoundary componentName="AdminPanel">
                    <AdminPanel adminUser={userProfile} />
                </ErrorBoundary>
            </div>
        ) : (
            <div className="flex-grow flex items-center justify-center pt-16">
                <p className="text-red-500 font-orbitron">ACCESS DENIED. ADMIN PRIVILEGES REQUIRED.</p>
            </div>
        );
    } else {
        // Grid View
        mainContent = (
            <main 
                key="grid" 
                className="flex-grow overflow-y-auto pb-24 md:pb-4 relative z-10 animate-page-enter pt-16"
                onScroll={handleMainScroll}
            >
                {/* Glow Trail Effect */}
                <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-primary to-transparent opacity-50 blur-[2px] animate-scan-sweep pointer-events-none z-[60]"></div>
                
                <div className="container mx-auto">
                    <HomeView 
                        articles={displayedArticles}
                        onArticleClick={handleCardClick}
                        onToggleSave={toggleSaveArticle}
                        savedArticles={savedArticles}
                        onOpenChat={() => openTool('chat')}
                        onOpenLive={() => openTool('live')}
                        onOpenAudio={() => openTool('audio')}
                        onViewReels={() => setViewMode('reels')}
                        onSearch={handleSearch}
                        isUserLoggedIn={!!currentUser} // PASS USER STATUS
                        onTriggerLogin={() => setShowLoginModal(true)}
                    />
                    
                    {/* Infinite Scroll Trigger - Always Active */}
                    <div ref={lastArticleElementRef} className="h-10 w-full"></div>

                    {isLoadingMore && !showSavedOnly && (
                        <div className="flex justify-center items-center py-8">
                            <HolographicScanner text="GENERATING NEW INTEL" />
                        </div>
                    )}
                </div>
            </main>
        );
    }

    return (
        <div className="h-full bg-brand-bg font-sans flex flex-col relative overflow-hidden">
            <ParticleBackground />
            
            {/* Show Header only if NOT in Reels view mode */}
            {viewMode !== 'reels' && (
                <Header 
                    onSearch={handleSearch} 
                    isSearching={isSearching} 
                    onPersonalizeClick={() => { 
                        closeAll(); 
                        // PROFILE PROTECTION
                        if (currentUser) {
                            setProfileModalOpen(true);
                        } else {
                            setShowLoginModal(true);
                        }
                    }}
                    viewMode={viewMode}
                    onToggleViewMode={(mode) => setViewMode(mode)}
                    showSavedOnly={showSavedOnly}
                    onToggleShowSaved={() => setShowSavedOnly(prev => !prev)}
                    onOpenChat={() => openTool('chat')}
                    scrollDirection={scrollDirection}
                    isAtTop={isAtTop}
                />
            )}
            
            {mainContent}

            {/* Auth Modal for New Users - Kept for fallback/completeness but skipped by logic */}
            {showAuthModal && currentUser && (
                <AuthModal user={currentUser} onComplete={handleProfileComplete} />
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <LoginModal onClose={() => setShowLoginModal(false)} onLoginSuccess={() => setShowLoginModal(false)} />
            )}

            {selectedArticle && (
                <ErrorBoundary componentName="ArticleModal">
                    <ArticleModal 
                        article={selectedArticle} 
                        onClose={handleCloseModal}
                        onToggleSave={toggleSaveArticle}
                        isSaved={savedArticles.has(selectedArticle.id)}
                    />
                </ErrorBoundary>
            )}
            
            {/* Search Modal */}
            {(searchResults || isSearching) && (
                <SearchResultsModal 
                    result={searchResults || { text: '', sources: [] }} 
                    onClose={handleCloseSearch} 
                    isLoading={isSearching} 
                />
            )}

            {/* Profile Modal */}
            {isProfileModalOpen && currentUser && (
                <ProfileModal 
                    user={currentUser} 
                    onClose={() => setProfileModalOpen(false)}
                    onOpenPersonalization={() => { setProfileModalOpen(false); setPersonalizationModalOpen(true); }}
                />
            )}

            {/* Personalization Modal */}
            {isPersonalizationModalOpen && (
                <PersonalizationModal
                    allCategories={allCategories}
                    allSources={allSources}
                    currentPreferences={preferences}
                    onSave={handleSavePreferences}
                    onClose={() => setPersonalizationModalOpen(false)}
                />
            )}

            {/* Audio Modal */}
            {isAudioGenOpen && (
                <ErrorBoundary componentName="AudioGenerationModal">
                    <AudioGenerationModal 
                        articles={articles} 
                        onClose={() => setAudioGenOpen(false)} 
                        user={currentUser} // PASS USER
                        onLoginRequest={() => { /* Guest access allowed */ }}
                    />
                </ErrorBoundary>
            )}
            
            {/* Desktop FABs - Hide in reels mode */}
            {viewMode !== 'reels' && viewMode !== 'admin' && (
                <div className="hidden md:flex fixed bottom-6 right-6 flex-col items-center gap-6 z-50">
                     <button
                        onClick={() => openTool('audio')}
                        className={`
                            w-16 h-16 rounded-full flex items-center justify-center text-white 
                            bg-white/5 border border-brand-secondary/50 backdrop-blur-xl
                            shadow-[0_0_20px_rgba(123,47,255,0.4)]
                            hover:bg-brand-secondary hover:shadow-[0_0_30px_#7B2FFF] hover:scale-110 
                            transition-all duration-300
                            ${isAudioGenOpen ? 'ring-2 ring-white/50 bg-brand-secondary' : ''}
                        `}
                        aria-label="Open Audio Synthesis"
                    >
                        <SoundWaveIcon className="w-8 h-8" />
                    </button>
                    <button
                        onClick={() => openTool('live')}
                        className={`
                            w-16 h-16 rounded-full flex items-center justify-center text-white 
                            bg-white/5 border border-brand-accent/50 backdrop-blur-xl
                            shadow-[0_0_20px_rgba(40,255,211,0.4)]
                            hover:bg-brand-accent hover:text-black hover:shadow-[0_0_30px_#28FFD3] hover:scale-110 
                            transition-all duration-300 animate-pulse-glow
                            ${isLiveAgentOpen ? 'ring-2 ring-white/50 bg-brand-accent text-black' : ''}
                        `}
                        aria-label="Open Live Agent"
                    >
                        <MicIcon className="w-8 h-8" />
                    </button>
                    <button
                        onClick={() => setChatOpen(prev => !prev ? true : false)}
                        className={`
                            w-16 h-16 rounded-full flex items-center justify-center text-white 
                            bg-white/5 border border-brand-primary/50 backdrop-blur-xl
                            shadow-[0_0_20px_rgba(58,190,254,0.4)]
                            hover:bg-brand-primary hover:text-black hover:shadow-[0_0_30px_#3ABEFE] hover:scale-110 
                            transition-all duration-300
                            ${isChatOpen ? 'ring-2 ring-white/50 bg-brand-primary text-black' : ''}
                        `}
                        aria-label="Toggle Chat"
                    >
                        <BoltIcon className="w-8 h-8" />
                    </button>
                </div>
            )}

            {/* Bottom Nav - Hide in reels mode */}
            {viewMode !== 'reels' && (
                <BottomNav 
                    viewMode={viewMode === 'admin' ? 'grid' : viewMode}
                    onChangeView={(mode) => setViewMode(mode)}
                    onOpenExplore={() => {
                        document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onOpenChat={() => openTool('chat')}
                    onOpenProfile={() => { 
                        closeAll(); 
                        if (currentUser) setProfileModalOpen(true);
                        else setShowLoginModal(true);
                    }}
                    isScrolling={isScrolling}
                />
            )}

            <ErrorBoundary componentName="ChatBot">
                <ChatBot 
                    isOpen={isChatOpen} 
                    onClose={() => setChatOpen(false)} 
                    user={currentUser} // PASS USER
                />
            </ErrorBoundary>
            {isLiveAgentOpen && (
                <ErrorBoundary componentName="LiveAgent">
                    <LiveAgent onClose={() => setLiveAgentOpen(false)} />
                </ErrorBoundary>
            )}
        </div>
    );
};

export default App;
