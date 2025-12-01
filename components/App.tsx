
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
import ClubDashboard from './components/ClubDashboard';
import AdminPanel from './components/AdminPanel';
import ParticleBackground from './components/ParticleBackground';
import { searchWithGoogle, generateFuturisticArticles } from './services/geminiService';
import { BoltIcon, MicIcon, SoundWaveIcon } from './components/icons';
import { NewsArticle, UserProfile } from './types';
import { HolographicScanner } from './components/Loaders';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { toggleCloudSavedArticle, loadUserData, saveUserPreferences, getUserProfile, logUserLogin } from './services/dbService';

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
    content: 'After decades of research, the international ITER-X project has achieved the holy grail of energy: stable, net-positive nuclear fusion. The experimental tokamak reactor in Geneva maintained a plasma core at 200 million degrees Celsius for three full days, producing ten times more energy than it consumed. This breakthrough signals the end of the fossil fuel era and promises to solve the global climate crisis, offering a future powered by the same process that fuels the stars.',
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
    content: 'All eyes are on the "Odyssey," humanity\'s most advanced spacecraft, as it undergoes final checks before its four-year voyage to Europa. The mission\'s primary objective is to deploy a submersible probe that will drill through the moon\'s ice shell and explore the vast liquid ocean beneath, which is considered one of the most likely places to find life beyond Earth. The crew of six has been in cryogenic simulation training for two years, preparing for the immense physical and psychological challenges of the journey.',
    image: 'https://picsum.photos/seed/space4/600/400',
    category: 'Space Exploration',
    source: 'AstroLeap Journal'
  },
    // Page 2
  {
    id: 5,
    title: 'Quantum Computing Cracks RSA-2048 Encryption',
    summary: 'A landmark achievement in quantum computing has rendered one of the world\'s most common encryption standards vulnerable.',
    content: 'The global cybersecurity landscape was shaken today as researchers at the Zurich Quantum Institute announced they had factored a 2048-bit number using their "Helios" quantum computer. This effectively breaks RSA-2048 encryption, a cornerstone of secure online communication. While the current process is slow and requires laboratory conditions, the proof-of-concept means a new era of quantum-resistant cryptography is now urgently needed. Financial institutions and governments are racing to upgrade their systems before the technology becomes more widespread.',
    image: 'https://picsum.photos/seed/quantum5/600/400',
    category: 'Cybersecurity',
    source: 'Zurich Quantum Institute'
  },
  {
    id: 6,
    title: 'Bio-Printers Successfully 3D Print a Living Heart',
    summary: 'Medical science leaps forward as a fully functional, vascularized human heart is created using a patient\'s own cells.',
    content: 'Surgeons at the BioVascular Dynamics lab have successfully transplanted a 3D-printed heart into a primate test subject. The organ, printed using a biocompatible hydrogel scaffold and the patient\'s own stem cells, began beating spontaneously and has sustained full circulatory function for over a week. This revolutionary technique eliminates the risk of organ rejection and could one day end transplant waiting lists entirely. Human trials are projected to begin within the next five years, pending regulatory approval.',
    image: 'https://picsum.photos/seed/medical6/600/400',
    category: 'Biotechnology',
    source: 'BioVascular Dynamics'
  },
  // Page 3
  {
    id: 7,
    title: 'Global Satellite Internet Achieves Sub-10ms Latency',
    summary: 'Project StarWeaver completes its constellation, offering fiber-optic speeds to every corner of the globe.',
    content: 'With the successful deployment of its final 1,000 satellites, Project StarWeaver has activated its global, low-latency internet service. Using advanced laser communication links between satellites, the network achieves latency below 10 milliseconds, a speed previously only possible with terrestrial fiber. This development promises to eliminate the digital divide, bringing high-speed internet to remote and underserved regions, and enabling new technologies like remote surgery and global autonomous vehicle networks.',
    image: 'https://picsum.photos/seed/internet7/600/400',
    category: 'Telecommunications',
    source: 'StarWeaver Inc.'
  },
  {
    id: 8,
    title: 'Matter Synthesisers Enter Commercial Production',
    summary: 'The dream of Star Trek-style replicators is one step closer with the first commercially available molecular assemblers.',
    content: 'Atomix Corp. has begun shipping its "Genesis" matter synthesiser, a device capable of arranging molecules to create simple organic compounds and plastics. While it cannot yet create complex alloys or electronics, the machine can produce basic foodstuffs, medicines, and custom plastic components from a feedstock of carbon, hydrogen, and oxygen. The technology could revolutionize manufacturing and supply chains, but also raises concerns about economic disruption and the potential for misuse.',
    image: 'https://picsum.photos/seed/matter8/600/400',
    category: 'Nanotechnology',
    source: 'Atomix Corp.'
  },
];

const App = () => {
    // New State for Landing Page
    const [showLanding, setShowLanding] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);

    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
    const [isChatOpen, setChatOpen] = useState(false);
    const [isLiveAgentOpen, setLiveAgentOpen] = useState(false);
    const [isAudioGenOpen, setAudioGenOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
    
    // Pagination & Infinite Scroll
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isPersonalizationModalOpen, setPersonalizationModalOpen] = useState(false);
    const [preferences, setPreferences] = useState<{categories: string[], sources: string[]}>({ categories: [], sources: [] });
    const [viewMode, setViewMode] = useState<'grid' | 'reels' | 'club' | 'admin'>('grid');
    
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
        const profile = await getUserProfile(user.uid);
        if (profile) {
            setUserProfile(profile);
            setShowAuthModal(false);
            // Log login time
            await logUserLogin(user.uid);
        } else {
            // Profile doesn't exist - Trigger signup flow
            setShowAuthModal(true);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                setIsVerifyingIdentity(true); // START LOADING
                
                // Check if profile exists in DB
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
    const openTool = (tool: 'chat' | 'live' | 'audio') => {
        setChatOpen(tool === 'chat');
        setLiveAgentOpen(tool === 'live');
        setAudioGenOpen(tool === 'audio');
        setSelectedArticle(null); // Close article if open
        setPersonalizationModalOpen(false); // Close personalization
    };

    const closeAll = () => {
        setChatOpen(false);
        setLiveAgentOpen(false);
        setAudioGenOpen(false);
        setSelectedArticle(null);
        setPersonalizationModalOpen(false);
    };

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

    const handleCardClick = (article: NewsArticle) => {
        closeAll();
        setSelectedArticle(article);
    };

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
    } else if (viewMode === 'club') {
        mainContent = currentUser ? (
            <div key="club" className="flex-grow relative z-10 animate-page-enter pt-16">
                <ErrorBoundary componentName="ClubDashboard">
                    <ClubDashboard user={currentUser} />
                </ErrorBoundary>
            </div>
        ) : (
            <div className="flex-grow flex items-center justify-center pt-16">
                <p className="text-white">Please Login to access Club Features.</p>
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
                    />
                    
                    {/* Infinite Scroll Trigger */}
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
                    onPersonalizeClick={() => { closeAll(); setPersonalizationModalOpen(true); }}
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

            {/* Auth Modal for New Users */}
            {showAuthModal && currentUser && (
                <AuthModal user={currentUser} onComplete={handleProfileComplete} />
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
            
            {/* Render SearchResultsModal if we have results OR if we are currently searching */}
            {(searchResults || isSearching) && (
                <SearchResultsModal 
                    result={searchResults || { text: '', sources: [] }} 
                    onClose={handleCloseSearch} 
                    isLoading={isSearching} 
                />
            )}
            {isPersonalizationModalOpen && (
                <PersonalizationModal
                    allCategories={allCategories}
                    allSources={allSources}
                    currentPreferences={preferences}
                    onSave={handleSavePreferences}
                    onClose={() => setPersonalizationModalOpen(false)}
                />
            )}
            {isAudioGenOpen && (
                <ErrorBoundary componentName="AudioGenerationModal">
                    <AudioGenerationModal articles={articles} onClose={() => setAudioGenOpen(false)} />
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
                    viewMode={(viewMode === 'club' || viewMode === 'admin') ? 'grid' : viewMode} // Fallback visually for mobile nav
                    onChangeView={(mode) => setViewMode(mode)}
                    onOpenExplore={() => {
                        document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onOpenChat={() => openTool('chat')}
                    onOpenProfile={() => { closeAll(); setPersonalizationModalOpen(true); }}
                    isScrolling={isScrolling}
                />
            )}

            <ErrorBoundary componentName="ChatBot">
                <ChatBot 
                    isOpen={isChatOpen} 
                    onClose={() => setChatOpen(false)} 
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
