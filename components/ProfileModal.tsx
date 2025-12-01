
import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { updateUserProfile, uploadProfilePicture, getUserProfile } from '../services/dbService';
import { deleteUserAccount, logoutUser } from '../services/firebase';
import { CloseIcon, UserIcon, EditIcon, CameraIcon, AwardIcon, LogOutIcon, TrashIcon, ShieldIcon } from './icons';
import { HexagonLoader } from './Loaders';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onOpenPersonalization: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onOpenPersonalization }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editClass, setEditClass] = useState('');
    const [editPhone, setEditPhone] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProfile();
    }, [user.uid]);

    const loadProfile = async () => {
        setIsLoading(true);
        const data = await getUserProfile(user.uid);
        if (data) {
            setProfile(data);
            setEditName(data.displayName || '');
            setEditBio(data.bio || '');
            setEditClass(data.studentClass || '');
            setEditPhone(data.phoneNumber || '');
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUserProfile(user.uid, {
                displayName: editName,
                bio: editBio,
                studentClass: editClass,
                phoneNumber: editPhone
            });
            await loadProfile();
            setIsEditing(false);
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true); // Reuse saving state for upload spinner
        try {
            const url = await uploadProfilePicture(user.uid, file);
            await updateUserProfile(user.uid, { photoURL: url });
            await loadProfile();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure? This action cannot be undone and all your data will be lost.")) {
            try {
                await deleteUserAccount(user);
                onClose();
            } catch (error) {
                alert("Please re-login to delete your account for security reasons.");
            }
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        onClose();
    };

    if (isLoading) return null; // Or a loader

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-[80] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="
                    bg-[#0a0a0a]/90 w-full max-w-2xl h-[85vh] 
                    rounded-[30px] border border-white/10 
                    shadow-[0_0_60px_rgba(58,190,254,0.1)] 
                    flex flex-col relative overflow-hidden animate-scale-in
                "
                onClick={e => e.stopPropagation()}
            >
                {/* Background Decor */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-brand-primary/20 to-transparent pointer-events-none"></div>
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-secondary/20 rounded-full blur-[80px]"></div>

                {/* Close */}
                <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 bg-black/40 rounded-full hover:bg-white/10 transition-colors border border-white/5">
                    <CloseIcon className="text-gray-400" />
                </button>

                {/* Content */}
                <div className="flex-grow overflow-y-auto pb-6 relative z-10 scrollbar-hide">
                    
                    {/* Header Section */}
                    <div className="flex flex-col items-center pt-12 pb-8 px-6">
                        <div className="relative group cursor-pointer" onClick={() => !isSaving && fileInputRef.current?.click()}>
                            <div className="w-32 h-32 rounded-full border-4 border-[#0a0a0a] shadow-[0_0_30px_rgba(58,190,254,0.3)] overflow-hidden bg-brand-surface relative">
                                {profile?.photoURL ? (
                                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-16 h-16 text-gray-600 m-auto mt-8" />
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CameraIcon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 p-2 bg-brand-primary rounded-full border-4 border-[#0a0a0a]">
                                <EditIcon className="w-3 h-3 text-black" />
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>

                        <div className="mt-4 text-center">
                            {isEditing ? (
                                <input 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xl font-bold font-orbitron text-center text-white focus:border-brand-primary outline-none"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold font-orbitron text-white">{profile?.displayName || 'News Agent'}</h2>
                            )}
                            
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${profile?.role === 'admin' ? 'border-red-500 text-red-400 bg-red-500/10' : profile?.role === 'member' ? 'border-brand-accent text-brand-accent bg-brand-accent/10' : 'border-gray-600 text-gray-400'}`}>
                                    {profile?.role === 'member' ? 'CLUB MEMBER' : profile?.role === 'admin' ? 'ADMINISTRATOR' : 'USER'}
                                </span>
                                {profile?.clubId && <span className="text-xs text-gray-500 font-mono">ID: {profile.clubId}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Stats / Badges */}
                    <div className="grid grid-cols-3 gap-4 px-6 mb-8">
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5">
                            <span className="text-2xl font-bold text-white mb-1">{(profile as any)?.savedArticles?.length || 0}</span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Saved</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5">
                            <AwardIcon className="w-6 h-6 text-yellow-500 mb-1" />
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Badges</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5">
                            <span className="text-2xl font-bold text-brand-primary mb-1">Lvl 1</span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Rank</span>
                        </div>
                    </div>

                    {/* Details Form */}
                    <div className="px-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <h3 className="text-sm font-bold text-brand-text-muted uppercase tracking-wider">Identity Matrix</h3>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="text-brand-primary text-xs hover:underline flex items-center gap-1">
                                    <EditIcon className="w-3 h-3"/> Edit
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Bio / Mission Statement</label>
                                {isEditing ? (
                                    <textarea 
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary outline-none resize-none h-24"
                                        placeholder="Enter your bio..."
                                    />
                                ) : (
                                    <p className="text-sm text-gray-300 italic">"{profile?.bio || 'No bio set.'}"</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Class / Division</label>
                                    {isEditing ? (
                                        <input 
                                            value={editClass}
                                            onChange={e => setEditClass(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary outline-none"
                                        />
                                    ) : (
                                        <div className="p-3 bg-white/5 rounded-xl text-sm text-white">{profile?.studentClass || 'N/A'}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Contact Link</label>
                                    {isEditing ? (
                                        <input 
                                            value={editPhone}
                                            onChange={e => setEditPhone(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary outline-none"
                                        />
                                    ) : (
                                        <div className="p-3 bg-white/5 rounded-xl text-sm text-white">{profile?.phoneNumber || 'N/A'}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="flex-1 bg-brand-primary text-black font-bold py-3 rounded-xl hover:bg-brand-primary/90 transition-colors flex justify-center"
                                >
                                    {isSaving ? <HexagonLoader size="sm" /> : 'SAVE CHANGES'}
                                </button>
                                <button 
                                    onClick={() => { setIsEditing(false); loadProfile(); }} 
                                    className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Shortcuts */}
                        <div className="pt-6 border-t border-white/10">
                            <h3 className="text-sm font-bold text-brand-text-muted uppercase tracking-wider mb-4">System Controls</h3>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => { onClose(); onOpenPersonalization(); }}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-brand-secondary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-secondary/20 rounded-lg text-brand-secondary group-hover:text-white transition-colors">
                                            <ShieldIcon className="w-5 h-5"/>
                                        </div>
                                        <span className="text-sm font-bold text-white">Feed Calibration</span>
                                    </div>
                                    <span className="text-xs text-gray-500">Configure</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <footer className="p-6 border-t border-white/10 bg-[#0a0a0a] flex justify-between items-center relative z-20">
                    <button 
                        onClick={handleDeleteAccount}
                        className="flex items-center gap-2 text-xs text-red-500 hover:text-red-400 transition-colors opacity-70 hover:opacity-100"
                    >
                        <TrashIcon className="w-4 h-4" /> Delete Account
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white hover:bg-white/10 hover:border-white/30 transition-all"
                    >
                        <LogOutIcon className="w-4 h-4" /> LOGOUT
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ProfileModal;
