import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "✅ Signed in", description: "Welcome back!" });
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "❌ Sign-in Failed",
        description: error.message || "Could not sign in with Google.",
        variant: "destructive",
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "✅ Signed in", description: "Welcome back!" });
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      const message =
        error.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : error.message;
      toast({
        title: "❌ Sign-in Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      toast({ title: "✅ Account Created", description: "Welcome to EarnWise!" });
    } catch (error: any) {
      console.error("Sign-up error:", error);
      const message =
        error.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : error.code === "auth/weak-password"
          ? "Password must be at least 6 characters."
          : error.message;
      toast({
        title: "❌ Sign-up Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({ title: "👋 Signed out", description: "See you next time!" });
    } catch (error: any) {
      console.error("Sign-out error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
