// Firestore sync service - saves and loads user data from Firestore
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppState } from "@/types/earnings";

const getUserDocRef = (userId: string) => doc(db, "users", userId, "data", "earnings");

const MAX_RETRIES = 2;

export const loadUserData = async (userId: string): Promise<AppState | null> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const docRef = getUserDocRef(userId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as AppState;
      }
      return null;
    } catch (error) {
      console.error(`Failed to load data from Firestore (attempt ${attempt + 1}):`, error);
      if (attempt === MAX_RETRIES) return null;
      // Wait before retrying (exponential backoff)
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
};

export const saveUserData = async (userId: string, state: AppState): Promise<boolean> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const docRef = getUserDocRef(userId);
      await setDoc(docRef, JSON.parse(JSON.stringify(state)));
      return true;
    } catch (error) {
      console.error(`Failed to save data to Firestore (attempt ${attempt + 1}):`, error);
      if (attempt === MAX_RETRIES) return false;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return false;
};
