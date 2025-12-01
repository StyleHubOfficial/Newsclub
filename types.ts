
export interface NewsArticle {
    id: number;
    title: string;
    summary: string;
    content: string;
    image: string;
    category: string;
    source: string;
    url?: string; // Optional URL for sharing
    isSummaryLoading?: boolean;
    dataPoints?: { label: string; value: number }[];
    visualizationTitle?: string;
}

export interface ChatMessage {
    id: string;
    text?: string;
    sender: 'user' | 'bot';
    isLoading?: boolean;
    imageUrl?: string;
    isError?: boolean;
}

export interface SearchResult {
    text: string;
    sources: {
        uri: string;
        title: string;
    }[];
}

export type AnalysisResult = {
    title: string;
    content: string;
};

export type UserRole = 'user' | 'member' | 'admin';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string;
    phoneNumber?: string;
    studentClass?: string;
    role: UserRole;
    clubId?: string;
    createdAt: any;
    lastLogin?: any;
    // Admin Flags
    isPinned?: boolean;
    isStarred?: boolean;
    groups?: string[]; // Group IDs
}

export interface AIFeedback {
    pronunciationScore: number;
    speedScore: number; // 0-100 (50 is ideal)
    confidenceScore: number;
    clarityScore: number;
    tips: string[];
    mistakes: string[];
    strengths: string[];
}

export interface ClubSubmission {
    id?: string;
    userId: string;
    weekNo: number;
    uploadTime: any; // Firestore Timestamp
    videoUrl: string;
    feedback?: AIFeedback;
    status: 'pending' | 'analyzed';
}

// --- ADMIN SYSTEM TYPES ---

export interface UserGroup {
    id: string;
    name: string;
    memberIds: string[];
    createdBy: string;
}

export interface AdminMessage {
    id?: string;
    senderId: string;
    senderName: string;
    recipients: string[]; // List of User UIDs
    targetType: 'user' | 'group' | 'all' | 'club'; // For UI display purposes
    content: string;
    attachments?: string[];
    channels: ('app' | 'whatsapp' | 'sms')[];
    scheduledFor?: any; // Timestamp or null
    createdAt: any;
    readBy: string[]; // UIDs who have opened it
}
