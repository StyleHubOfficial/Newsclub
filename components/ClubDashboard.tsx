import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { ShieldIcon, UploadIcon, ChartIcon, BrainIcon } from './icons';
import { analyzeStudentVideo } from '../services/geminiService';
import { uploadClubVideo, saveClubSubmission, getStudentHistory, getWeeklyTask } from '../services/dbService';
import { HexagonLoader, HolographicScanner } from './Loaders';
import InteractiveChart from './InteractiveChart';
import { ClubSubmission, AIFeedback } from '../types';

interface ClubDashboardProps {
    user: User;
}

const ClubDashboard: React.FC<ClubDashboardProps> = ({ user }) => {
    // Determine current week number (Simple calc based on year start)
    const currentWeekNo = Math.ceil(((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    const isSunday = new Date().getDay() === 0;

    const [task, setTask] = useState<any>(null);
    const [history, setHistory] = useState<ClubSubmission[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [currentFeedback, setCurrentFeedback] = useState<AIFeedback | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadData = async () => {
            const t = await getWeeklyTask(currentWeekNo);
            setTask(t);
            const h = await getStudentHistory(user.uid);
            setHistory(h);
            
            // Check if already submitted this week
            const thisWeekSubmission = h.find(s => s.weekNo === currentWeekNo);
            if (thisWeekSubmission && thisWeekSubmission.feedback) {
                setCurrentFeedback(thisWeekSubmission.feedback);
            }
        };
        loadData();
    }, [user.uid, currentWeekNo]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset
        setError(null);
        setIsUploading(true);
        setUploadProgress('INITIALIZING UPLINK');

        try {
            // 1. Validation
            if (!isSunday) {
               // throw new Error("Upload Portal is only active on Sundays (00:00 - 23:59).");
            }
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                throw new Error("File too large. Please compress video to under 50MB.");
            }

            // 2. AI Analysis
            setUploadProgress('NEURAL ANALYSIS IN PROGRESS...');
            const feedback = await analyzeStudentVideo(file);
            
            // 3. Storage Upload
            setUploadProgress('ARCHIVING TO SECURE VAULT...');
            const url = await uploadClubVideo(user.uid, currentWeekNo, file);
            
            // 4. Save Metadata
            setUploadProgress('FINALIZING REPORT...');
            await saveClubSubmission(user.uid, currentWeekNo, url, feedback);

            // 5. Update State
            setCurrentFeedback(feedback);
            const newHistory = await getStudentHistory(user.uid);
            setHistory(newHistory);

        } catch (err: any) {
            setError(err.message || "Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const renderFeedback = (fb: AIFeedback) => (
        <div className="space-y-6 animate-fade-in">
            {/* Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pronunciation', val: fb.pronunciationScore, color: 'text-brand-primary' },
                    { label: 'Confidence', val: fb.confidenceScore, color: 'text-brand-secondary' },
                    { label: 'Clarity', val: fb.clarityScore, color: 'text-brand-accent' },
                    { label: 'Pacing', val: fb.speedScore, color: 'text-white' } // 50 is ideal
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
                        <div className={`text-2xl font-orbitron font-bold ${stat.color}`}>{stat.val}</div>
                        <div className="text-[10px] text-brand-text-muted uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Analysis Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-5">
                    <h4 className="font-orbitron text-green-400 text-sm mb-3 flex items-center gap-2">
                        <ShieldIcon className="w-4 h-4"/> STRENGTHS
                    </h4>
                    <ul className="space-y-2">
                        {fb.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-brand-text-muted flex gap-2">
                                <span className="text-green-500">✓</span> {s}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-brand-secondary/10 border border-brand-secondary/30 rounded-xl p-5">
                    <h4 className="font-orbitron text-brand-secondary text-sm mb-3 flex items-center gap-2">
                        <BrainIcon className="w-4 h-4"/> COACHING TIPS
                    </h4>
                    <ul className="space-y-2">
                        {fb.tips.map((t, i) => (
                            <li key={i} className="text-xs text-brand-text-muted flex gap-2">
                                <span className="text-brand-secondary">➜</span> {t}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    // Prepare Chart Data
    const chartData = history
        .sort((a, b) => a.weekNo - b.weekNo)
        .map(h => ({
            label: `W${h.weekNo}`,
            value: h.feedback ? (h.feedback.pronunciationScore + h.feedback.confidenceScore) / 2 : 0
        }));

    return (
        <div className="flex-grow p-4 md:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-10">
                
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <div className="p-4 bg-brand-accent/10 rounded-full border border-brand-accent/50 shadow-[0_0_20px_rgba(40,255,211,0.2)]">
                        <ShieldIcon className="w-10 h-10 text-brand-accent" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-orbitron font-bold text-white tracking-wider">CLUB <span className="text-brand-accent">DASHBOARD</span></h1>
                        <p className="text-brand-text-muted text-sm">Sunrise International Public School • News Reporters</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Col: Task & Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Weekly Task */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[22px] p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="text-[10px] font-orbitron bg-brand-primary/20 text-brand-primary px-2 py-1 rounded border border-brand-primary/30">
                                    WEEK {currentWeekNo}
                                </span>
                            </div>
                            <h3 className="font-orbitron text-lg text-white mb-2">{task?.title || 'Loading Mission...'}</h3>
                            <p className="text-sm text-brand-text-muted font-light leading-relaxed mb-4">
                                {task?.description}
                            </p>
                            <div className="text-xs text-red-400 font-mono border-t border-white/5 pt-3">
                                DEADLINE: {task?.deadline}
                            </div>
                        </div>

                        {/* Upload Zone */}
                        <div className={`
                            border-2 border-dashed rounded-[22px] p-8 flex flex-col items-center justify-center text-center transition-all
                            ${isSunday 
                                ? 'border-brand-accent/50 bg-brand-accent/5 hover:bg-brand-accent/10 cursor-pointer' 
                                : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'}
                        `} onClick={() => isSunday && !isUploading && fileInputRef.current?.click()}>
                            
                            {isUploading ? (
                                <HexagonLoader size="sm" text={uploadProgress} />
                            ) : (
                                <>
                                    <div className={`p-4 rounded-full mb-4 ${isSunday ? 'bg-brand-accent text-black' : 'bg-gray-800 text-gray-500'}`}>
                                        <UploadIcon className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-orbitron text-white text-sm mb-1">
                                        {isSunday ? 'UPLOAD ASSIGNMENT' : 'PORTAL CLOSED'}
                                    </h4>
                                    <p className="text-[10px] text-brand-text-muted max-w-[200px]">
                                        {isSunday 
                                            ? 'Drag video file or click to browse. Max 50MB.' 
                                            : 'Uploads are only accepted on Sundays (00:00 - 23:59).'}
                                    </p>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="video/*" 
                                        onChange={handleFileUpload}
                                        disabled={!isSunday}
                                    />
                                </>
                            )}
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right Col: Analysis & History */}
                    <div className="lg:col-span-2 space-y-8">
                        {currentFeedback ? (
                            <div className="bg-[#0a0a0a] border border-brand-secondary/30 rounded-[22px] p-6 shadow-[0_0_30px_rgba(123,47,255,0.1)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-accent"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-orbitron text-xl text-white">AI ANALYSIS REPORT</h3>
                                    <span className="text-xs text-brand-text-muted">Week {currentWeekNo} Submission</span>
                                </div>
                                {renderFeedback(currentFeedback)}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center border border-white/5 rounded-[22px] bg-white/5">
                                <HolographicScanner text="NO ACTIVE SUBMISSION FOUND" />
                                <p className="text-xs text-brand-text-muted mt-4">Upload a video to generate performance metrics.</p>
                            </div>
                        )}

                        {/* Progress Chart */}
                        {history.length > 0 && (
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-[22px] p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ChartIcon className="text-brand-primary w-5 h-5" />
                                    <h3 className="font-orbitron text-sm text-brand-primary tracking-widest">PERFORMANCE TRAJECTORY</h3>
                                </div>
                                <InteractiveChart data={chartData} title="" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubDashboard;