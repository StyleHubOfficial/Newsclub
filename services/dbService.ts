
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, orderBy, limit, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { UserProfile, ClubSubmission, AIFeedback, AdminMessage } from "../types";

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

// Verify Club Credentials
export const verifyClubCredentials = async (clubId: string, tempPass: string): Promise<boolean> => {
    try {
        const q = query(
            collection(db, "club_members"), 
            where("clubId", "==", clubId),
            where("tempPass", "==", tempPass)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Check if already used? (Optional business logic)
            return true;
        }
        return false;
    } catch (error) {
        console.error("Verification failed:", error);
        return false;
    }
};

// Create or Update User Profile
export const createUserProfile = async (uid: string, profileData: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            ...profileData,
            createdAt: new Date(),
            // Ensure defaults
            preferences: { categories: [], sources: [] },
            savedArticles: []
        }, { merge: true });
    } catch (error) {
        console.error("Error creating profile:", error);
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

// --- CLUB SUBMISSION LOGIC ---

export const uploadClubVideo = async (userId: string, weekNo: number, file: File): Promise<string> => {
    const storageRef = ref(storage, `club_videos/${userId}/week_${weekNo}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

export const saveClubSubmission = async (userId: string, weekNo: number, videoUrl: string, feedback: AIFeedback) => {
    // Unique ID for the submission
    const submissionId = `${userId}_week_${weekNo}`;
    const submissionRef = doc(db, "club_submissions", submissionId);
    
    const submission: ClubSubmission = {
        userId,
        weekNo,
        videoUrl,
        uploadTime: new Date(),
        feedback,
        status: 'analyzed'
    };

    await setDoc(submissionRef, submission);
    
    // Also save feedback separately for easier querying if needed
    const feedbackRef = doc(db, `club_feedback/${userId}/weeks`, `week_${weekNo}`);
    await setDoc(feedbackRef, feedback);
};

export const getWeeklyTask = async (weekNo: number) => {
    // This could come from a database, but for now we mock it
    return {
        title: `Week ${weekNo} Assignment`,
        description: "Report on a recent technological breakthrough in your city. Focus on clear diction and maintaining eye contact.",
        deadline: "Sunday 23:59"
    };
};

export const getStudentHistory = async (userId: string): Promise<ClubSubmission[]> => {
    const q = query(
        collection(db, "club_submissions"),
        where("userId", "==", userId),
        orderBy("weekNo", "desc"),
        limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ClubSubmission);
};

// --- ADMIN FEATURES ---

// Get All Users (for Admin)
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
};

// Toggle Pin/Star
export const toggleUserStatus = async (uid: string, field: 'isPinned' | 'isStarred', value: boolean) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { [field]: value });
};

// Send Admin Message
export const sendAdminMessage = async (message: AdminMessage) => {
    // 1. Save to DB
    const msgRef = collection(db, "messages");
    await addDoc(msgRef, message);

    // 2. Mock External APIs if selected
    if (message.channels.includes('whatsapp')) {
        console.log(`[MOCK] Sending WhatsApp to ${message.recipients.length} users: ${message.content}`);
    }
    if (message.channels.includes('sms')) {
        console.log(`[MOCK] Sending SMS to ${message.recipients.length} users: ${message.content}`);
    }
};

// Get Messages for a User
export const getUserMessages = async (uid: string): Promise<AdminMessage[]> => {
    // Logic: Fetch messages where 'recipients' array contains uid OR 'targetType' is 'all'
    // Firestore array-contains only allows one condition. We'll fetch basic and filter.
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

// Mark Message as Read
export const markMessageRead = async (msgId: string, uid: string) => {
    const msgRef = doc(db, "messages", msgId);
    await updateDoc(msgRef, {
        readBy: arrayUnion(uid)
    });
};
