
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, getDocs, orderBy, limit, addDoc, serverTimestamp, where } from "firebase/firestore";
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
        if (docSnap.exists()) {
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
        
        // 1. Sanitize data: remove undefined values which Firestore hates
        const cleanData = JSON.parse(JSON.stringify(profileData));

        // 2. Prepare payload with server timestamps
        const payload = {
            ...cleanData,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            role: 'user', // Enforce 'user' role on creation
            preferences: { categories: [], sources: [] },
            savedArticles: []
        };

        // 3. Write
        await setDoc(userRef, payload, { merge: true });
    } catch (error) {
        console.error("Error creating profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        // Remove undefined fields from data
        const cleanData = JSON.parse(JSON.stringify(data));
        await updateDoc(userRef, cleanData);
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
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
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
    await addDoc(msgRef, {
        ...message,
        createdAt: serverTimestamp()
    });
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

// --- CLUB DASHBOARD FEATURES ---

export const getWeeklyTask = async (weekNo: number): Promise<WeeklyTask | null> => {
    try {
        // Fallback Task for Demo/Development
        const defaultTask: WeeklyTask = {
            id: 'demo-task',
            weekNo,
            title: 'Reporting Live: Future Tech',
            description: 'Record a 60-second segment reporting on a breakthrough in AI or Robotics. Focus on clear diction and confident body language.',
            deadline: 'Sunday 23:59'
        };
        
        const q = query(collection(db, "weeklyTasks"), where("weekNo", "==", weekNo), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            return { id: snapshot.docs[0].id, ...data } as WeeklyTask;
        }
        return defaultTask;
    } catch (e) {
        console.error("Error fetching task, returning default:", e);
        return {
            id: 'demo-task',
            weekNo,
            title: 'Reporting Live: Future Tech',
            description: 'Record a 60-second segment reporting on a breakthrough in AI or Robotics. Focus on clear diction and confident body language.',
            deadline: 'Sunday 23:59'
        };
    }
};

export const uploadClubVideo = async (uid: string, weekNo: number, file: File): Promise<string> => {
    try {
        const storageRef = ref(storage, `club_submissions/${uid}/week_${weekNo}/${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading club video:", error);
        throw error;
    }
};

export const saveClubSubmission = async (uid: string, weekNo: number, videoUrl: string, feedback: AIFeedback) => {
    try {
        const submissionId = `${uid}_week${weekNo}`;
        const submissionRef = doc(db, "clubSubmissions", submissionId);
        
        const submission: any = {
            userId: uid,
            weekNo,
            videoUrl,
            feedback,
            submittedAt: serverTimestamp()
        };
        
        await setDoc(submissionRef, submission);
    } catch (error) {
        console.error("Error saving submission:", error);
        throw error;
    }
};

export const getStudentHistory = async (uid: string): Promise<ClubSubmission[]> => {
    try {
        const q = query(collection(db, "clubSubmissions"), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        const submissions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClubSubmission));
        // Sort by weekNo descending
        return submissions.sort((a, b) => b.weekNo - a.weekNo);
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};
