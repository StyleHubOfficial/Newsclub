
import React, { useState } from 'react';
import { CloseIcon, BoltIcon, UserIcon, LockIcon, MailIcon, EyeIcon, EyeOffIcon } from './icons';
import { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } from '../services/firebase';
import { HexagonLoader } from './Loaders';

interface LoginModalProps {
    onClose: () => void;
    onLoginSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState<'google' | 'standard'>('google');
    const [isStandardRegister, setIsStandardRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
            onLoginSuccess();
            onClose();
        } catch (e: any) {
            console.error("Login failed:", e);
            if (e.code === 'auth/unauthorized-domain') {
                setError(`Domain authorization required in Firebase Console. Please add this domain to Authorized Domains.`);
            } else {
                setError(e.message || "Authentication failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStandardAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (isStandardRegister) {
                await registerWithEmail(email, password);
            } else {
                await loginWithEmail(email, password);
            }
            onLoginSuccess();
            onClose();
        } catch (err: any) {
            if (err.code === 'auth/unauthorized-domain') {
                setError(`Domain authorization required in Firebase Console. Please add this domain to Authorized Domains.`);
            } else {
                setError(err.message || "Authentication failed.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await resetPassword(email);
            setSuccessMessage("Password reset email sent. Check your inbox.");
            setIsForgotPassword(false);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email.");
        } finally {
            setIsLoading(false);
        }
    };

    const TabButton = ({ id, label, icon }: { id: 'google' | 'standard', label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => { setActiveTab(id); setIsForgotPassword(false); setError(null); }}
            className={`
                flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-300
                ${activeTab === id 
                    ? 'bg-brand-primary/10 border border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(58,190,254,0.3)]' 
                    : 'bg-white/5 border border-transparent text-brand-text-muted hover:bg-white/10 hover:text-white'}
            `}
        >
            <div className={`${activeTab === id ? 'animate-pulse' : ''}`}>{icon}</div>
            <span className="text-[10px] font-orbitron font-bold tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="
                w-full max-w-md bg-[#0a0a0a]/90 border border-brand-primary/30 
                rounded-[24px] shadow-[0_0_50px_rgba(58,190,254,0.15)] 
                relative overflow-hidden flex flex-col
                animate-card-enter
            ">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors z-20 hover:rotate-90 duration-300"
                >
                    <CloseIcon />
                </button>

                <div className="p-8 relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="font-orbitron text-2xl text-white font-bold tracking-widest mb-1">
                            ACCESS PORTAL
                        </h2>
                        <p className="text-brand-primary text-xs font-bold tracking-wider animate-pulse mb-2">
                            LOGIN TO GET FULL ACCESS
                        </p>
                    </div>

                    <div className="flex gap-3 mb-8">
                        <TabButton id="google" label="QUICK" icon={<UserIcon className="w-5 h-5"/>} />
                        <TabButton id="standard" label="EMAIL" icon={<MailIcon className="w-5 h-5"/>} />
                    </div>

                    {/* CONTENT AREA */}
                    <div className="min-h-[250px] flex flex-col justify-center">
                        
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4">
                                <HexagonLoader size="md" text="AUTHENTICATING..." />
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center animate-shake">
                                        {error}
                                    </div>
                                )}
                                {successMessage && (
                                    <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg text-green-200 text-xs text-center">
                                        {successMessage}
                                    </div>
                                )}

                                {activeTab === 'google' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                                            <p className="text-sm text-gray-300 mb-6 font-light">
                                                Use your Google Account for instant, secure access to the News Club network.
                                            </p>
                                            <button
                                                onClick={handleGoogleLogin}
                                                className="
                                                    w-full py-4 rounded-xl 
                                                    bg-white text-black font-orbitron font-bold tracking-widest
                                                    shadow-[0_0_20px_rgba(255,255,255,0.3)]
                                                    hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]
                                                    active:scale-95 transition-all
                                                    flex items-center justify-center gap-3 group
                                                "
                                            >
                                                <BoltIcon className="w-5 h-5 group-hover:animate-spin-slow" />
                                                CONTINUE WITH GOOGLE
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'standard' && (
                                    <>
                                        {isForgotPassword ? (
                                            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 animate-fade-in">
                                                <h3 className="text-center text-white font-orbitron text-sm">RESET PASSWORD</h3>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <MailIcon className="h-5 w-5 text-gray-500 group-focus-within:text-brand-secondary transition-colors" />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        placeholder="Enter your email"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-secondary outline-none transition-all placeholder-gray-600"
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full py-3 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-secondary/80 transition-colors shadow-[0_0_20px_rgba(123,47,255,0.3)]"
                                                >
                                                    SEND RESET LINK
                                                </button>
                                                <div className="text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setIsForgotPassword(false); setError(null); }}
                                                        className="text-xs text-brand-primary hover:text-white transition-colors underline"
                                                    >
                                                        Back to Login
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleStandardAuth} className="space-y-4 animate-fade-in">
                                                <div className="space-y-4">
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <MailIcon className="h-5 w-5 text-gray-500 group-focus-within:text-brand-secondary transition-colors" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            placeholder="Email Address"
                                                            value={email}
                                                            onChange={e => setEmail(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-brand-secondary outline-none transition-all placeholder-gray-600"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <LockIcon className="h-5 w-5 text-gray-500 group-focus-within:text-brand-secondary transition-colors" />
                                                        </div>
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Password"
                                                            value={password}
                                                            onChange={e => setPassword(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white focus:border-brand-secondary outline-none transition-all placeholder-gray-600"
                                                            required
                                                        />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white">
                                                            {showPassword ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full py-3 bg-brand-secondary text-white font-bold rounded-xl hover:bg-brand-secondary/80 transition-colors shadow-[0_0_20px_rgba(123,47,255,0.3)] mt-2"
                                                >
                                                    {isStandardRegister ? 'CREATE ACCOUNT' : 'LOGIN'}
                                                </button>
                                                
                                                <div className="flex flex-col items-center gap-2">
                                                    {!isStandardRegister && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => setIsForgotPassword(true)}
                                                            className="text-xs text-brand-text-muted hover:text-white transition-colors"
                                                        >
                                                            Forgot Password?
                                                        </button>
                                                    )}
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsStandardRegister(!isStandardRegister)}
                                                        className="text-xs text-brand-primary hover:text-white transition-colors underline decoration-brand-primary/50"
                                                    >
                                                        {isStandardRegister ? 'Already have an account? Login' : 'New user? Create Account'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
