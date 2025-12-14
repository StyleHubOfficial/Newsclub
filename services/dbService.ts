
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, getDocs, orderBy, limit, addDoc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { UserProfile, AdminMessage, ClubSubmission, AIFeedback, WeeklyTask } from "../types";

// Save user preferences (categories, sources)
export const saveUserPreferences = async (userId: string, preferences: any) => {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { preferences }, { merge: true });
    } catch (error) {
        console.error("Error saving preferences:", error);
    }
};

// Toggle Saved Article in Cloud
export const toggleCloudSavedArticle = async (userId: string, articleId: number, isSaving: boolean) => {
    try {
        const userRef = doc(db, "users", userId);
        
        // Create document if it doesn't exist
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            await setDoc(userRef, { savedArticles: [] });
        }

        await updateDoc(userRef, {
            savedArticles: isSaving ? arrayUnion(articleId) : arrayRemove(articleId)
        });
    } catch (error) {
        console.error("Error updating saved articles:", error);
    }
};

// Load User Data (Preferences + Saved Articles)
export const loadUserData = async (userId: string) => {
    try {
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        return null;
    }
};

// --- AUTHENTICATION & PROFILE LOGIC ---

// Check if user has a profile setup
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().role) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};

// Create or Update User Profile
export const createUserProfile = async (uid: string, profileData: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            ...profileData,
            createdAt: new Date(),
            preferences: { categories: [], sources: [] },
            savedArticles: []
        }, { merge: true });
    } catch (error) {
        console.error("Error creating profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data);
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
    try {
        const storageRef = ref(storage, `profile_pictures/${uid}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw error;
    }
};

// Update last login
export const logUserLogin = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
    } catch (e) { /* ignore */ }
};

// --- ADMIN FEATURES ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
};

export const toggleUserStatus = async (uid: string, field: 'isPinned' | 'isStarred', value: boolean) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { [field]: value });
};

export const sendAdminMessage = async (message: AdminMessage) => {
    const msgRef = collection(db, "messages");
    await addDoc(msgRef, message);
    if (message.channels.includes('whatsapp')) console.log(`[MOCK] WhatsApp sent to ${message.recipients.length}`);
    if (message.channels.includes('sms')) console.log(`[MOCK] SMS sent to ${message.recipients.length}`);
};

export const getUserMessages = async (uid: string): Promise<AdminMessage[]> => {
    const q = query(
        collection(db, "messages"),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AdminMessage))
        .filter(msg => 
            msg.targetType === 'all' || 
            (msg.recipients && msg.recipients.includes(uid))
        );
};

export const markMessageRead = async (msgId: string, uid: string) => {
    const msgRef = doc(db, "messages", msgId);
    await updateDoc(msgRef, {
        readBy: arrayUnion(uid)
    });
};

// --- CLUB FEATURES ---

export const uploadClubVideo = async (userId: string, weekNo: number, file: File): Promise<string> => {
    try {
        const storageRef = ref(storage, `club_submissions/${userId}/week_${weekNo}/${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading club video:", error);
        throw error;
    }
};

export const saveClubSubmission = async (userId: string, weekNo: number, videoUrl: string, feedback: AIFeedback) => {
    try {
        const submissionRef = collection(db, "submissions");
        await addDoc(submissionRef, {
            userId,
            weekNo,
            videoUrl,
            feedback,
            submittedAt: new Date()
        });
    } catch (error) {
        console.error("Error saving submission:", error);
        throw error;
    }
};

export const getStudentHistory = async (userId: string): Promise<ClubSubmission[]> => {
    try {
        const q = query(
            collection(db, "submissions"),
            where("userId", "==", userId),
            orderBy("submittedAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubSubmission));
    } catch (error) {
        console.error("Error getting history:", error);
        return [];
    }
};

export const getWeeklyTask = async (weekNo: number): Promise<WeeklyTask | null> => {
    // In a real application, fetch from 'tasks' collection where weekNo matches
    return {
        id: `week-${weekNo}`,
        weekNo,
        title: `News Report: Week ${weekNo}`,
        description: "Record a 2-minute news segment covering a local event or a technological breakthrough. Focus on clear diction and maintaining eye contact.",
        deadline: "Sunday 23:59"
    };
};
