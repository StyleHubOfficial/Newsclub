
import React, { useEffect, useState } from 'react';
import { AdminMessage } from '../types';
import { getUserMessages, markMessageRead } from '../services/dbService';
import { CloseIcon, BellIcon, BoltIcon } from './icons';
import { HolographicScanner } from './Loaders';

interface NotificationsModalProps {
    userId: string;
    onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ userId, onClose }) => {
    const [messages, setMessages] = useState<AdminMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const msgs = await getUserMessages(userId);
            setMessages(msgs);
            setLoading(false);
            
            // Mark unread as read
            msgs.forEach(msg => {
                if (!msg.readBy?.includes(userId) && msg.id) {
                    markMessageRead(msg.id, userId);
                }
            });
        };
        fetch();
    }, [userId]);

    return (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-[#0a0a0a]/90 w-full max-w-md h-[70vh] rounded-[24px] border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] flex flex-col relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/10 rounded-full text-brand-primary">
                            <BellIcon className="h-5 w-5" />
                        </div>
                        <h2 className="font-orbitron text-lg text-white">NOTIFICATIONS</h2>
                    </div>
                    <button onClick={onClose}><CloseIcon className="text-gray-400 hover:text-white" /></button>
                </header>

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {loading ? <div className="pt-10"><HolographicScanner text="DECRYPTING" /></div> : 
                     messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20 text-sm">No new transmissions.</div>
                     ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-slide-up relative overflow-hidden group hover:border-brand-primary/30 transition-all">
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-brand-primary text-xs font-bold font-orbitron flex items-center gap-1">
                                        <BoltIcon className="w-3 h-3" /> ADMIN
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-200 leading-relaxed font-light">{msg.content}</p>
                            </div>
                        ))
                     )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsModal;
