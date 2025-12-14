
import React, { useState, useEffect } from 'react';
import { UserProfile, AdminMessage } from '../types';
import { getAllUsers, toggleUserStatus, sendAdminMessage } from '../services/dbService';
import { PinIcon, StarIcon, SearchIcon, FilterIcon, MailIcon, WhatsAppIcon, BoltIcon, PaperclipIcon, SendIcon } from './icons';
import { HexagonLoader, HolographicScanner } from './Loaders';

const AdminPanel: React.FC<{ adminUser: UserProfile }> = ({ adminUser }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'messages'>('users');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'user'>('all');

    // Message State
    const [messageText, setMessageText] = useState('');
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [channels, setChannels] = useState<{app: boolean, whatsapp: boolean, sms: boolean}>({ app: true, whatsapp: false, sms: false });
    const [targetType, setTargetType] = useState<'specific' | 'all'>('specific');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setIsLoading(false);
    };

    const handleUserAction = async (uid: string, action: 'pin' | 'star', currentValue: boolean) => {
        const field = action === 'pin' ? 'isPinned' : 'isStarred';
        // Optimistic update
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, [field]: !currentValue } : u));
        await toggleUserStatus(uid, field, !currentValue);
    };

    const toggleRecipient = (uid: string) => {
        if (targetType !== 'specific') setTargetType('specific');
        setSelectedRecipients(prev => 
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        
        setIsSending(true);
        let finalRecipients = selectedRecipients;
        
        // Logic for bulk selection
        if (targetType === 'all') {
            finalRecipients = users.map(u => u.uid);
        }

        const msg: AdminMessage = {
            senderId: adminUser.uid,
            senderName: adminUser.displayName,
            recipients: finalRecipients,
            targetType: targetType === 'specific' ? 'user' : targetType,
            content: messageText,
            channels: Object.keys(channels).filter(k => (channels as any)[k]) as any,
            createdAt: new Date(),
            readBy: []
        };

        await sendAdminMessage(msg);
        
        // Reset
        setIsSending(false);
        setMessageText('');
        alert(`Message sent to ${finalRecipients.length} users via ${msg.channels.join(', ')}`);
    };

    // Filter Logic
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
    }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)); // Pinned first

    return (
        <div className="h-full bg-black/90 text-white overflow-hidden flex flex-col animate-fade-in relative z-10">
            {/* Header */}
            <header className="p-6 border-b border-brand-secondary/30 flex justify-between items-center bg-[#0a0a0a]">
                <h1 className="text-2xl font-orbitron font-bold text-brand-secondary tracking-widest flex items-center gap-3">
                    <BoltIcon className="text-brand-secondary" /> ADMIN COMMAND
                </h1>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('users')} 
                        className={`px-6 py-2 rounded-full font-bold font-orbitron transition-all ${activeTab === 'users' ? 'bg-brand-secondary text-white shadow-[0_0_15px_#7B2FFF]' : 'text-gray-500 hover:text-white'}`}
                    >
                        USER DATABASE
                    </button>
                    <button 
                        onClick={() => setActiveTab('messages')} 
                        className={`px-6 py-2 rounded-full font-bold font-orbitron transition-all ${activeTab === 'messages' ? 'bg-brand-primary text-white shadow-[0_0_15px_#3ABEFE]' : 'text-gray-500 hover:text-white'}`}
                    >
                        COMMS CENTER
                    </button>
                </div>
            </header>

            <div className="flex-grow p-6 overflow-hidden flex flex-col">
                
                {/* TAB: USERS */}
                {activeTab === 'users' && (
                    <div className="h-full flex flex-col space-y-4">
                        {/* Filters */}
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-grow max-w-md">
                                <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search agents..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 focus:border-brand-secondary outline-none text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 border border-white/10">
                                <FilterIcon className="h-4 w-4 text-gray-400" />
                                <select 
                                    value={filterRole} 
                                    onChange={(e: any) => setFilterRole(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-gray-300"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Users</option>
                                </select>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {isLoading ? <div className="col-span-full flex justify-center"><HolographicScanner text="RETRIEVING IDENTITIES" /></div> : 
                             filteredUsers.map(user => (
                                <div key={user.uid} className={`
                                    relative p-5 rounded-[20px] border transition-all duration-300 group
                                    ${user.isPinned ? 'border-brand-secondary bg-brand-secondary/5 shadow-[0_0_15px_rgba(123,47,255,0.1)]' : 'border-white/10 bg-white/5 hover:border-white/20'}
                                `}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/10 flex items-center justify-center">
                                                <span className="font-bold text-sm">{user.displayName.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-white leading-tight">{user.displayName}</h3>
                                                <p className="text-[10px] text-brand-text-muted">{user.role.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleUserAction(user.uid, 'pin', !!user.isPinned)} className={`p-1.5 rounded hover:bg-white/10 ${user.isPinned ? 'text-brand-secondary' : 'text-gray-600'}`}>
                                                <PinIcon className="h-4 w-4" filled={user.isPinned} />
                                            </button>
                                            <button onClick={() => handleUserAction(user.uid, 'star', !!user.isStarred)} className={`p-1.5 rounded hover:bg-white/10 ${user.isStarred ? 'text-yellow-400' : 'text-gray-600'}`}>
                                                <StarIcon className="h-4 w-4" filled={user.isStarred} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-xs text-gray-400 mb-4">
                                        {user.phoneNumber && <p>Phone: {user.phoneNumber}</p>}
                                        <p>Last Active: {user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => { toggleRecipient(user.uid); setActiveTab('messages'); }}
                                            className="flex-1 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-lg text-brand-primary hover:bg-brand-primary hover:text-black transition-colors font-bold text-[10px] font-orbitron"
                                        >
                                            MESSAGE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: MESSAGES */}
                {activeTab === 'messages' && (
                    <div className="h-full flex gap-6">
                        {/* Left: Composer */}
                        <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-[24px] p-6 relative overflow-hidden">
                            {/* Decorative */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-[50px]"></div>

                            <h2 className="text-xl font-orbitron text-white mb-6 flex items-center gap-2">
                                <MailIcon className="text-brand-primary" /> NEW TRANSMISSION
                            </h2>

                            {/* Recipient Selector */}
                            <div className="mb-6 space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Audience</label>
                                <div className="flex gap-3">
                                    {['specific', 'all'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setTargetType(type as any)}
                                            className={`
                                                px-4 py-2 rounded-lg text-xs font-bold border transition-all
                                                ${targetType === type 
                                                    ? 'bg-brand-primary text-black border-brand-primary' 
                                                    : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30'}
                                            `}
                                        >
                                            {type === 'specific' ? `Selected (${selectedRecipients.length})` : 'All Users'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Channels */}
                            <div className="mb-6 space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Channels</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.app ? 'bg-brand-primary border-brand-primary' : 'border-gray-500'}`}>
                                            {channels.app && <div className="w-3 h-3 bg-black rounded-sm"></div>}
                                        </div>
                                        <span className="text-sm group-hover:text-white transition-colors">In-App</span>
                                        <input type="checkbox" className="hidden" checked={channels.app} onChange={e => setChannels({...channels, app: e.target.checked})} />
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.whatsapp ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                            {channels.whatsapp && <div className="w-3 h-3 bg-black rounded-sm"></div>}
                                        </div>
                                        <span className="text-sm group-hover:text-green-400 transition-colors flex items-center gap-1"><WhatsAppIcon className="w-4 h-4"/> WhatsApp</span>
                                        <input type="checkbox" className="hidden" checked={channels.whatsapp} onChange={e => setChannels({...channels, whatsapp: e.target.checked})} />
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.sms ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                            {channels.sms && <div className="w-3 h-3 bg-black rounded-sm"></div>}
                                        </div>
                                        <span className="text-sm group-hover:text-blue-400 transition-colors">SMS</span>
                                        <input type="checkbox" className="hidden" checked={channels.sms} onChange={e => setChannels({...channels, sms: e.target.checked})} />
                                    </label>
                                </div>
                            </div>

                            {/* Editor */}
                            <div className="flex-grow flex flex-col gap-2">
                                <textarea 
                                    className="flex-grow bg-black/30 border border-white/10 rounded-xl p-4 resize-none focus:border-brand-primary outline-none transition-colors font-light text-sm"
                                    placeholder="Type your secure message here..."
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                ></textarea>
                                <div className="flex justify-between items-center px-2">
                                    <button className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs">
                                        <PaperclipIcon className="w-4 h-4" /> Add Attachment
                                    </button>
                                    <span className="text-xs text-gray-600">{messageText.length} chars</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleSendMessage}
                                disabled={isSending || !messageText}
                                className="mt-6 w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl font-bold text-white font-orbitron tracking-widest shadow-[0_0_20px_rgba(58,190,254,0.4)] hover:shadow-[0_0_30px_rgba(58,190,254,0.6)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSending ? <HexagonLoader size="sm" /> : <><SendIcon /> TRANSMIT MESSAGE</>}
                            </button>
                        </div>

                        {/* Right: History (Mockup for UI) */}
                        <div className="w-1/3 bg-white/5 border border-white/10 rounded-[24px] p-6 overflow-hidden flex flex-col hidden lg:flex">
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Transmission Log</h3>
                            <div className="space-y-4 overflow-y-auto pr-2">
                                <div className="p-3 rounded-lg bg-white/5 border-l-2 border-green-500">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-white font-bold">Meeting Reminder</span>
                                        <span className="text-gray-500">10m ago</span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">Club meeting at 5 PM in the main hall.</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[9px] rounded">WA</span>
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] rounded">App</span>
                                    </div>
                                </div>
                                {/* More logs... */}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
