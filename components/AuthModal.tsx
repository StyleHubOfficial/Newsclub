import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { ShieldIcon, UserIcon, BoltIcon, LogOutIcon } from './icons';
import { verifyClubCredentials, createUserProfile } from '../services/dbService';
import { logoutUser } from '../services/firebase';
import { HexagonLoader } from './Loaders';

interface AuthModalProps {
    user: User;
    onComplete: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ user, onComplete }) => {
    const [name, setName] = useState(user.displayName || '');
    const [phone, setPhone] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [isClubMember, setIsClubMember] = useState(false);
    const [clubId, setClubId] = useState('');
    const [tempPass, setTempPass] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            let role: 'user' | 'member' = 'user';

            // Verification Logic
            if (isClubMember) {
                if (!clubId || !tempPass) {
                    throw new Error("Club ID and Temporary Password are required for members.");
                }
                const isValid = await verifyClubCredentials(clubId, tempPass);
                if (!isValid) {
                    throw new Error("Invalid Club Credentials. Please contact your coordinator.");
                }
                role = 'member';
            }

            // Create Profile
            await createUserProfile(user.uid, {
                displayName: name,
                phoneNumber: phone,
                studentClass: studentClass,
                email: user.email,
                role: role,
                uid: user.uid,
                clubId: isClubMember ? clubId : undefined
            });

            onComplete(); // Trigger app refresh
        } catch (err: any) {
            setError(err.message || "Failed to create profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        // The App component will detect auth state change and remove this modal
    };

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <div className="
                w-full max-w-md bg-[#0a0a0a]/90 border border-brand-primary/30 
                rounded-[24px] shadow-[0_0_50px_rgba(58,190,254,0.15)] 
                relative overflow-hidden flex flex-col
                animate-card-enter
            ">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent animate-scan-line"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

                {/* EXIT BUTTON */}
                <button 
                    onClick={handleLogout}
                    className="absolute top-4 right-4 text-brand-text-muted hover:text-red-400 transition-colors z-50 flex items-center gap-1 text-[10px] font-orbitron tracking-wider bg-black/40 px-2 py-1 rounded-full border border-white/10 hover:border-red-500/30"
                    title="Logout & Exit"
                >
                    EXIT <LogOutIcon className="w-3 h-3" />
                </button>

                <div className="p-8 relative z-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(58,190,254,0.3)]">
                            <UserIcon className="w-8 h-8 text-brand-primary" />
                        </div>
                        <h2 className="font-orbitron text-2xl text-white font-bold tracking-wider text-center">
                            PROFILE SETUP
                        </h2>
                        <p className="text-brand-text-muted text-xs mt-2 text-center max-w-xs">
                            Complete your registration for Sunrise International Public School
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Basic Info */}
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full Name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all outline-none font-light placeholder-white/20"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone Number"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all outline-none font-light placeholder-white/20"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={studentClass}
                                    onChange={(e) => setStudentClass(e.target.value)}
                                    placeholder="Class (e.g. 10-A)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all outline-none font-light placeholder-white/20"
                                />
                            </div>
                        </div>

                        {/* Club Toggle */}
                        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 transition-all">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isClubMember ? 'bg-brand-accent/20 text-brand-accent' : 'bg-white/5 text-gray-500'}`}>
                                        <ShieldIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-orbitron font-bold text-white group-hover:text-brand-accent transition-colors">News Club Member?</span>
                                        <span className="text-[10px] text-brand-text-muted">Exclusive access for reporters</span>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isClubMember ? 'bg-brand-accent' : 'bg-white/10'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isClubMember ? 'translate-x-6' : ''}`}></div>
                                </div>
                                <input type="checkbox" className="hidden" checked={isClubMember} onChange={(e) => setIsClubMember(e.target.checked)} />
                            </label>

                            {/* Club Fields */}
                            {isClubMember && (
                                <div className="mt-4 space-y-3 animate-slide-up">
                                    <input
                                        type="text"
                                        value={clubId}
                                        onChange={(e) => setClubId(e.target.value)}
                                        placeholder="Assigned Club ID"
                                        className="w-full bg-black/40 border border-brand-accent/30 rounded-lg px-3 py-2 text-sm text-brand-accent placeholder-brand-accent/30 focus:border-brand-accent outline-none"
                                    />
                                    <input
                                        type="password"
                                        value={tempPass}
                                        onChange={(e) => setTempPass(e.target.value)}
                                        placeholder="Temporary Password"
                                        className="w-full bg-black/40 border border-brand-accent/30 rounded-lg px-3 py-2 text-sm text-brand-accent placeholder-brand-accent/30 focus:border-brand-accent outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="
                                w-full py-4 rounded-xl 
                                bg-gradient-to-r from-brand-primary to-brand-secondary 
                                text-white font-orbitron font-bold tracking-widest
                                shadow-[0_0_20px_rgba(58,190,254,0.4)]
                                hover:shadow-[0_0_30px_rgba(58,190,254,0.6)] hover:scale-[1.02]
                                active:scale-95 transition-all
                                disabled:opacity-50 disabled:cursor-not-allowed
                                relative overflow-hidden group
                            "
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? 'VERIFYING...' : 'COMPLETE REGISTRATION'} 
                                {!isLoading && <BoltIcon className="w-4 h-4" />}
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;