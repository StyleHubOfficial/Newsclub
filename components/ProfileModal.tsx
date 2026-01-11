
import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { updateUserProfile, uploadProfilePicture, getUserProfile, saveUserPreferences } from '../services/dbService';
import { deleteUserAccount, logoutUser } from '../services/firebase';
import { CloseIcon, UserIcon, EditIcon, CameraIcon, AwardIcon, LogOutIcon, TrashIcon, ShieldIcon, SettingsIcon, ChartIcon, BoltIcon } from './icons';
import { HexagonLoader, HolographicScanner } from './Loaders';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onOpenPersonalization: () => void;
}

const THEMES = [
    { id: 'cyan', name: 'Neon Cyan', color: '#3ABEFE', class: 'brand-primary' },
    { id: 'purple', name: 'Cyber Purple', color: '#7B2FFF', class: 'brand-secondary' },
    { id: 'green', name: 'Bio Green', color: '#28FFD3', class: 'brand-accent' },
    { id: 'orange', name: 'Solar Orange', color: '#F97316', class: 'orange-500' },
];

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onOpenPersonalization }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'config' | 'stats'>('identity');
    
    // Edit States
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        studentClass: '',
        phoneNumber: ''
    });

    const [selectedTheme, setSelectedTheme] = useState('cyan');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProfile();
    }, [user.uid]);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const data = await getUserProfile(user.uid);
            if (data) {
                setProfile(data);
                setFormData({
                    displayName: data.displayName || '',
                    bio: data.bio || '',
                    studentClass: data.studentClass || '',
                    phoneNumber: data.phoneNumber || ''
                });
            }
        } catch (e) {
            console.error("Failed to load profile", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Sanitize and prepare update object
            const updates = {
                displayName: formData.displayName,
                bio: formData.bio,
                studentClass: formData.studentClass,
                phoneNumber: formData.phoneNumber
            };

            // Remove empty strings if strictly necessary, but Firestore handles strings fine.
            // Critical: Avoid passing 'undefined'
            await updateUserProfile(user.uid, JSON.parse(JSON.stringify(updates)));
            
            // Save Theme Preference
            await saveUserPreferences(user.uid, { theme: selectedTheme });

            await loadProfile();
            // Optional: Success feedback could go here
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        try {
            const url = await uploadProfilePicture(user.uid, file);
            await updateUserProfile(user.uid, { photoURL: url });
            await loadProfile();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload biometric image.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("WARNING: TERMINATING IDENTITY RECORD. THIS ACTION IS IRREVERSIBLE. PROCEED?")) {
            try {
                await deleteUserAccount(user);
                onClose();
            } catch (error) {
                alert("Security Protocol: Please re-login to verify identity before deletion.");
            }
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        onClose();
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[80]">
                <HolographicScanner text="DECRYPTING IDENTITY" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center z-[80] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="
                    bg-[#0a0a0a]/95 w-full max-w-4xl h-[90vh] md:h-[80vh]
                    rounded-[24px] border border-brand-primary/20
                    shadow-[0_0_80px_rgba(58,190,254,0.15)] 
                    flex flex-col md:flex-row relative overflow-hidden animate-scale-in
                "
                onClick={e => e.stopPropagation()}
            >
                {/* GLOBAL FX */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-primary to-transparent animate-scan-line z-50"></div>

                {/* --- SIDEBAR: AVATAR & BIOMETRICS --- */}
                <div className="w-full md:w-1/3 bg-black/40 border-r border-white/10 p-6 flex flex-col items-center relative">
                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-brand-primary/10 to-transparent"></div>
                    
                    {/* AVATAR MODULE */}
                    <div className="relative group cursor-pointer mt-8 mb-6" onClick={() => !isSaving && fileInputRef.current?.click()}>
                        <div className="w-40 h-40 rounded-full border-2 border-brand-primary/30 p-1 relative">
                            {/* Rotating Scanner Ring */}
                            <div className="absolute inset-0 rounded-full border border-brand-accent/50 border-dashed animate-spin-slow"></div>
                            
                            <div className="w-full h-full rounded-full overflow-hidden bg-brand-surface relative z-10">
                                {profile?.photoURL ? (
                                    <img src={profile.photoURL} alt="Identity" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <UserIcon className="w-16 h-16 text-white/20" />
                                    </div>
                                )}
                                {/* Upload Overlay */}
                                <div className="absolute inset-0 bg-brand-primary/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <CameraIcon className="w-8 h-8 text-black mb-2" />
                                    <span className="text-[10px] font-bold text-black font-orbitron">UPDATE VISUAL</span>
                                </div>
                            </div>
                        </div>
                        {isSaving && <div className="absolute inset-0 flex items-center justify-center z-20"><HexagonLoader size="sm" /></div>}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <h2 className="text-2xl font-bold font-orbitron text-white text-center mb-1">{profile?.displayName || 'UNKNOWN AGENT'}</h2>
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`w-2 h-2 rounded-full ${profile?.role === 'admin' ? 'bg-red-500' : 'bg-brand-accent'} animate-pulse`}></div>
                        <span className="text-xs font-mono text-brand-text-muted tracking-widest uppercase">
                            {profile?.role === 'admin' ? 'ADMINISTRATOR' : 'OPERATIVE'}
                        </span>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full mb-auto">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                            <span className="block text-xl font-bold text-brand-primary font-orbitron">{(profile as any)?.savedArticles?.length || 0}</span>
                            <span className="text-[9px] text-gray-500 uppercase">Intel Saved</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                            <span className="block text-xl font-bold text-brand-secondary font-orbitron">LVL 1</span>
                            <span className="text-[9px] text-gray-500 uppercase">Clearance</span>
                        </div>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="w-full pt-6 border-t border-white/10 flex flex-col gap-3">
                        <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-lg text-xs font-bold transition-all group">
                            <LogOutIcon className="w-4 h-4 group-hover:rotate-180 transition-transform" /> TERMINATE SESSION
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="w-full md:w-2/3 flex flex-col bg-[#050505]">
                    {/* Header Tabs */}
                    <div className="flex border-b border-white/10 bg-white/5 backdrop-blur-md">
                        {[
                            { id: 'identity', label: 'IDENTITY', icon: <UserIcon className="w-4 h-4"/> },
                            { id: 'config', label: 'CONFIG', icon: <SettingsIcon className="w-4 h-4"/> },
                            { id: 'stats', label: 'STATS', icon: <ChartIcon className="w-4 h-4"/> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold font-orbitron tracking-wider transition-all relative
                                    ${activeTab === tab.id 
                                        ? 'text-brand-primary bg-brand-primary/5' 
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                {tab.icon} {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-primary shadow-[0_0_10px_#3ABEFE]"></div>}
                            </button>
                        ))}
                        <button onClick={onClose} className="px-6 border-l border-white/10 text-gray-500 hover:text-white hover:bg-red-500/20 transition-colors">
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-grow p-8 overflow-y-auto relative">
                        
                        {/* 1. IDENTITY TAB */}
                        {activeTab === 'identity' && (
                            <div className="space-y-6 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-brand-primary tracking-widest ml-1">Codename / Name</label>
                                        <input 
                                            type="text" 
                                            value={formData.displayName}
                                            onChange={e => setFormData({...formData, displayName: e.target.value})}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:shadow-[0_0_15px_rgba(58,190,254,0.1)] outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-brand-primary tracking-widest ml-1">Frequency / Phone</label>
                                        <input 
                                            type="text" 
                                            value={formData.phoneNumber}
                                            onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:shadow-[0_0_15px_rgba(58,190,254,0.1)] outline-none transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-brand-primary tracking-widest ml-1">Sector / Class</label>
                                    <input 
                                        type="text" 
                                        value={formData.studentClass}
                                        onChange={e => setFormData({...formData, studentClass: e.target.value})}
                                        placeholder="e.g. Grade 12 - Science Block A"
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:shadow-[0_0_15px_rgba(58,190,254,0.1)] outline-none transition-all font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-brand-primary tracking-widest ml-1">Mission Statement / Bio</label>
                                    <textarea 
                                        value={formData.bio}
                                        onChange={e => setFormData({...formData, bio: e.target.value})}
                                        className="w-full h-32 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-primary focus:shadow-[0_0_15px_rgba(58,190,254,0.1)] outline-none transition-all font-mono text-sm resize-none"
                                        placeholder="Enter operational directive..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. CONFIG TAB */}
                        {activeTab === 'config' && (
                            <div className="space-y-8 animate-slide-up">
                                <div>
                                    <h3 className="font-orbitron text-sm text-white mb-4 flex items-center gap-2">
                                        <BoltIcon className="w-4 h-4 text-brand-accent"/> SYSTEM ACCENT CALIBRATION
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {THEMES.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSelectedTheme(theme.id)}
                                                className={`
                                                    p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                                    ${selectedTheme === theme.id 
                                                        ? `border-${theme.class} bg-${theme.class}/10 shadow-[0_0_20px_${theme.color}40]` 
                                                        : 'border-white/10 bg-[#0a0a0a] hover:border-white/30'}
                                                `}
                                            >
                                                <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: theme.color, backgroundColor: selectedTheme === theme.id ? theme.color : 'transparent' }}></div>
                                                <span className="text-[10px] font-bold uppercase text-gray-400">{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <h3 className="font-orbitron text-sm text-white mb-4 flex items-center gap-2">
                                        <ShieldIcon className="w-4 h-4 text-red-500"/> DANGER ZONE
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => { onClose(); onOpenPersonalization(); }}
                                            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <span className="text-sm font-mono text-gray-300">Feed Algorithm Tuning</span>
                                            <span className="text-[10px] bg-black px-2 py-1 rounded border border-white/10">CONFIGURE</span>
                                        </button>
                                        <button 
                                            onClick={handleDeleteAccount}
                                            className="w-full flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors group"
                                        >
                                            <span className="text-sm font-mono text-red-400">Permanently Erase Identity</span>
                                            <TrashIcon className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. STATS TAB */}
                        {activeTab === 'stats' && (
                            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-slide-up text-center">
                                <div className="relative">
                                    <div className="w-40 h-40 rounded-full border-4 border-white/5 flex items-center justify-center">
                                        <AwardIcon className="w-16 h-16 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                                    </div>
                                    <div className="absolute -bottom-3 bg-yellow-500/10 border border-yellow-500/50 px-4 py-1 rounded-full text-yellow-500 font-bold text-xs font-orbitron backdrop-blur-md">
                                        LVL 1 RECRUIT
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-8 w-full max-w-md mt-8">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-white font-orbitron mb-1">0</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Articles Analyzed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-brand-primary font-orbitron mb-1">0%</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Neural Sync Rate</div>
                                    </div>
                                </div>
                                
                                <div className="w-full bg-white/5 rounded-full h-1.5 mt-8 max-w-xs relative overflow-hidden">
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-primary to-brand-accent w-[10%] shadow-[0_0_10px_#28FFD3]"></div>
                                </div>
                                <span className="text-[9px] text-gray-600 font-mono">100 XP to next clearance level</span>
                            </div>
                        )}
                    </div>

                    {/* Main Footer Actions */}
                    <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-[#0a0a0a] relative z-10">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-lg border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            CANCEL
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="
                                px-8 py-3 rounded-lg 
                                bg-brand-primary text-black font-bold font-orbitron tracking-wider text-xs
                                shadow-[0_0_20px_rgba(58,190,254,0.3)]
                                hover:shadow-[0_0_30px_rgba(58,190,254,0.5)] hover:scale-105
                                active:scale-95 transition-all
                                flex items-center gap-2
                            "
                        >
                            {isSaving ? <HexagonLoader size="sm" /> : 'SYNCHRONIZE DATA'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
