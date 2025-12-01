
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "../types";

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

// --- NEW AUTHENTICATION & PROFILE LOGIC ---

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
