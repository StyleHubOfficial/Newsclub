
export interface NewsArticle {
    id: number;
    title: string;
    summary: string;
    content: string;
    image: string;
    category: string;
    source: string;
    url?: string;
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
    bio?: string;
    photoURL?: string;
    role: UserRole;
    clubId?: string;
    createdAt: any;
    lastLogin?: any;
    isPinned?: boolean;
    isStarred?: boolean;
    groups?: string[];
}

export interface AIFeedback {
    pronunciationScore: number;
    speedScore: number;
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
    uploadTime: any;
    videoUrl: string;
    feedback?: AIFeedback;
    status: 'pending' | 'analyzed';
}

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
    recipients: string[];
    targetType: 'user' | 'group' | 'all' | 'club';
    content: string;
    attachments?: string[];
    channels: ('app' | 'whatsapp' | 'sms')[];
    scheduledFor?: any;
    createdAt: any;
    readBy: string[];
}