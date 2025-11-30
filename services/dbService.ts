import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";

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