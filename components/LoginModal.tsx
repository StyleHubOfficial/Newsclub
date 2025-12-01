
import React, { useState } from 'react';
import { CloseIcon, ShieldIcon, BoltIcon, UserIcon } from './icons';
import { loginWithGoogle } from '../services/firebase';

interface LoginModalProps {
    onClose: () => void;
    onLoginSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [domainError, setDomainError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        setDomainError(null);
        try {
            await loginWithGoogle();
            onLoginSuccess();
            onClose();
        } catch (e: any) {
            console.error("Login failed:", e);
            if (e.code === 'auth/unauthorized-domain') {
                setDomainError(window.location.hostname);
            } else {
                setError(e.message || "Authentication failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="
                w-full max-w-md bg-[#0a0a0a]/90 border border-brand-primary/30 
                rounded-[24px] shadow-[0_0_50px_rgba(58,190,254,0.15)] 
                relative overflow-hidden flex flex-col
                animate-card-enter
            ">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent animate-scan-line"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors z-20"
                >
                    <CloseIcon />
                </button>

                <div className="p-10 flex flex-col items-center text-center relative z-10">
                    <div className="w-20 h-20 rounded-full bg-brand-primary/5 border border-brand-primary/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(58,190,254,0.2)] animate-pulse-border">
                        <ShieldIcon className="w-10 h-10 text-brand-primary" />
                    </div>
                    
                    <h2 className="font-orbitron text-3xl text-white font-bold tracking-widest mb-2">
                        ACCESS CONTROL
                    </h2>
                    <p className="text-brand-text-muted text-xs font-orbitron tracking-wide mb-8">
                        IDENTITY VERIFICATION REQUIRED
                    </p>

                    {error && (
                        <div className="w-full bg-red-900/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-200 text-xs">
                            {error}
                        </div>
                    )}

                    {domainError ? (
                        <div className="w-full bg-black/60 border border-brand-secondary/50 rounded-xl p-4 text-left mb-6">
                            <p className="text-brand-secondary text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
                                <BoltIcon className="w-4 h-4"/> Security Protocol
                            </p>
                            <p className="text-gray-400 text-xs mb-2">Domain not authorized. Add this to Firebase:</p>
                            <code className="block w-full bg-black p-2 rounded text-brand-accent font-mono text-xs select-all border border-white/10 break-all">
                                {domainError}
                            </code>
                        </div>
                    ) : (
                        <div className="space-y-4 w-full">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="
                                    w-full py-4 rounded-xl 
                                    bg-white text-black font-orbitron font-bold tracking-widest
                                    shadow-[0_0_20px_rgba(255,255,255,0.3)]
                                    hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]
                                    active:scale-95 transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center justify-center gap-3
                                    relative overflow-hidden group
                                "
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">CONNECTING...</span>
                                ) : (
                                    <>
                                        <UserIcon className="w-5 h-5" />
                                        CONTINUE WITH GOOGLE
                                    </>
                                )}
                            </button>
                            
                            <p className="text-[10px] text-gray-500">
                                By accessing this system, you agree to our protocols.
                                <br/>New recruits will be redirected to profile setup.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
