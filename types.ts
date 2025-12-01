
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
}
