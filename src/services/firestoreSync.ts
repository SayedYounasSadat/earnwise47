// Firestore sync service - saves and loads user data from Firestore
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppState } from "@/types/earnings";

const getUserDocRef = (userId: string) => doc(db, "users", userId, "data", "earnings");

export const loadUserData = async (userId: string): Promise<AppState | null> => {
  try {
    const docRef = getUserDocRef(userId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as AppState;
    }
    return null;
  } catch (error) {
    console.error("Failed to load data from Firestore:", error);
    return null;
  }
};

export const saveUserData = async (userId: string, state: AppState): Promise<void> => {
  try {
    const docRef = getUserDocRef(userId);
    await setDoc(docRef, JSON.parse(JSON.stringify(state)));
  } catch (error) {
    console.error("Failed to save data to Firestore:", error);
  }
};
