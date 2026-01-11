
import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { updateUserProfile, uploadProfilePicture, getUserProfile, saveUserPreferences } from '../services/dbService';
import { deleteUserAccount, logoutUser } from '../services/firebase';
import { CloseIcon, UserIcon, CameraIcon, AwardIcon, LogOutIcon, TrashIcon, SettingsIcon, ChartIcon, BoltIcon, EditIcon } from './icons';
import { HexagonLoader } from './Loaders';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onOpenPersonalization: () => void;
}

const THEMES = [
    { id: 'cyan', name: 'Ocean Blue', color: '#3ABEFE', class: 'brand-primary' },
    { id: 'purple', name: 'Royal Purple', color: '#7B2FFF', class: 'brand-secondary' },
    { id: 'green', name: 'Emerald', color: '#28FFD3', class: 'brand-accent' },
    { id: 'orange', name: 'Sunset', color: '#F97316', class: 'orange-500' },
];

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onOpenPersonalization }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'activity'>('profile');
    
    // Edit States
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
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
            const updates = {
                displayName: formData.displayName,
                bio: formData.bio,
                phoneNumber: formData.phoneNumber
            };

            await updateUserProfile(user.uid, JSON.parse(JSON.stringify(updates)));
            await saveUserPreferences(user.uid, { theme: selectedTheme });
            await loadProfile();
        } catch (error) {
            console.error("Update failed", error);
            alert("Could not update profile. Please try again.");
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
            alert("Failed to update profile picture.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
            try {
                await deleteUserAccount(user);
                onClose();
            } catch (error) {
                alert("For security, please log out and log in again before deleting your account.");
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
                <div className="text-white font-sans text-sm tracking-wider">Loading Profile...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="
                    bg-[#121212] w-full max-w-4xl h-[90vh] md:h-[80vh]
                    rounded-3xl border border-white/10
                    shadow-2xl flex flex-col md:flex-row overflow-hidden
                "
                onClick={e => e.stopPropagation()}
            >
                {/* --- LEFT SIDEBAR (Premium Look) --- */}
                <div className="w-full md:w-80 bg-[#0a0a0a] border-r border-white/5 p-8 flex flex-col items-center relative">
                    {/* Soft Gradient Top */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/10 to-transparent"></div>
                    
                    {/* Avatar */}
                    <div className="relative group cursor-pointer mb-4 z-10" onClick={() => !isSaving && fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full p-1 border-2 border-white/10 group-hover:border-brand-primary transition-colors">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                {profile?.photoURL ? (
                                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                                        <UserIcon className="w-12 h-12 opacity-50" />
                                    </div>
                                )}
                                {/* Edit Overlay */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CameraIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <h2 className="text-xl font-bold text-white text-center mb-1">{profile?.displayName || 'User'}</h2>
                    <p className="text-xs text-gray-400 mb-6">{profile?.email}</p>

                    {/* Simple Badge */}
                    <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-[10px] uppercase font-bold tracking-wider text-brand-primary mb-8">
                        {profile?.role === 'admin' ? 'Administrator' : 'Premium Member'}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 w-full border-t border-b border-white/5 py-6 mb-auto">
                        <div className="text-center">
                            <span className="block text-lg font-bold text-white">{(profile as any)?.savedArticles?.length || 0}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Saved</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-lg font-bold text-white">12</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Reads</span>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors mt-4">
                        <LogOutIcon className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                {/* --- RIGHT CONTENT AREA --- */}
                <div className="flex-1 flex flex-col bg-[#121212]">
                    {/* Modern Tabs */}
                    <div className="flex border-b border-white/5 px-8 pt-6">
                        {[
                            { id: 'profile', label: 'My Profile' },
                            { id: 'settings', label: 'Settings' },
                            { id: 'activity', label: 'My Activity' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    pb-4 px-4 text-sm font-medium transition-all relative
                                    ${activeTab === tab.id ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-300'}
                                `}
                            >
                                {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-primary rounded-t-full"></div>}
                            </button>
                        ))}
                        <div className="flex-grow flex justify-end">
                             <button onClick={onClose} className="text-gray-500 hover:text-white pb-4"><CloseIcon /></button>
                        </div>
                    </div>

                    {/* Content Scrollable */}
                    <div className="flex-grow p-8 overflow-y-auto">
                        
                        {/* 1. MY PROFILE */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 max-w-xl animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Personal Information</h3>
                                    <p className="text-xs text-gray-500">Update your personal details here.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400">Full Name</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                            <input 
                                                type="text" 
                                                value={formData.displayName}
                                                onChange={e => setFormData({...formData, displayName: e.target.value})}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-10 py-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder-gray-600"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400">Phone Number</label>
                                        <div className="relative">
                                            <BoltIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                            <input 
                                                type="text" 
                                                value={formData.phoneNumber}
                                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-10 py-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder-gray-600"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400">Bio</label>
                                    <textarea 
                                        value={formData.bio}
                                        onChange={e => setFormData({...formData, bio: e.target.value})}
                                        className="w-full h-32 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all resize-none placeholder-gray-600"
                                        placeholder="Tell us a little about yourself..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. SETTINGS */}
                        {activeTab === 'settings' && (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4">App Appearance</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {THEMES.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSelectedTheme(theme.id)}
                                                className={`
                                                    p-4 rounded-xl border flex flex-col items-center gap-3 transition-all
                                                    ${selectedTheme === theme.id 
                                                        ? 'bg-white/10 border-brand-primary' 
                                                        : 'bg-[#1a1a1a] border-white/5 hover:border-white/20'}
                                                `}
                                            >
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color }}></div>
                                                <span className={`text-xs font-medium ${selectedTheme === theme.id ? 'text-white' : 'text-gray-500'}`}>{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-4">Account Management</h3>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => { onClose(); onOpenPersonalization(); }}
                                            className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <SettingsIcon className="w-5 h-5 text-gray-400" />
                                                <div className="text-left">
                                                    <span className="block text-sm text-white">Feed Preferences</span>
                                                    <span className="block text-xs text-gray-500">Customize your news topics and sources</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-brand-primary font-bold">Edit</span>
                                        </button>

                                        <button 
                                            onClick={handleDeleteAccount}
                                            className="w-full flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/10 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <TrashIcon className="w-5 h-5 text-red-500" />
                                                <div className="text-left">
                                                    <span className="block text-sm text-red-200">Delete Account</span>
                                                    <span className="block text-xs text-red-500/60">Permanently remove your data</span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. ACTIVITY */}
                        {activeTab === 'activity' && (
                            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in text-center py-10">
                                <div className="w-24 h-24 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                                    <AwardIcon className="w-12 h-12 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Starter Badge</h3>
                                    <p className="text-sm text-gray-500 mt-1">You've just started your journey!</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-8 w-full max-w-sm mt-8 p-6 bg-[#1a1a1a] rounded-2xl border border-white/5">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white mb-1">0</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Articles Read</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-brand-primary mb-1">0%</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Consistency</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#121212]">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="
                                px-8 py-2.5 rounded-lg 
                                bg-brand-primary text-black font-bold text-sm
                                shadow-lg shadow-brand-primary/20
                                hover:shadow-brand-primary/40 hover:scale-[1.02]
                                active:scale-95 transition-all
                                flex items-center gap-2
                            "
                        >
                            {isSaving ? <HexagonLoader size="sm" /> : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
