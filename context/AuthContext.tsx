"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase, setFirebaseTokenGetter } from "@/lib/supabase";

// 🔹 THE BRIDGE: Inject Firebase token getter into Supabase client once, at module load.
// This avoids circular imports and ensures every Supabase request gets the current token.
setFirebaseTokenGetter(async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
});

/* =========================================================
   🔹 Types
 ========================================================= */

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (email?: string, password?: string) => Promise<void>;
  deactivateAccount: () => Promise<void>;
  loading: boolean;
}

/* =========================================================
   🔹 Context
 ========================================================= */

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Check for deactivation and re-activate if necessary
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_deactivated")
        .eq("id", firebaseUser.uid)
        .single();

      if (profile?.is_deactivated) {
        await supabase
          .from("profiles")
          .update({ is_deactivated: false, is_verified: firebaseUser.emailVerified })
          .eq("id", firebaseUser.uid);
      } else {
        // 🔹 SYNC VERIFICATION STATUS ON LOGIN
        await supabase
          .from("profiles")
          .update({ is_verified: firebaseUser.emailVerified })
          .eq("id", firebaseUser.uid);
      }

      router.replace("/");
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("connekt_profile");
      router.replace("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const deleteAccount = async (email?: string, password?: string) => {
    if (!user) return;
    try {
      if (email && user.email && email !== user.email) {
        throw new Error("Invalid email. Please enter the email associated with this account.");
      }

      if (password && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // 1. Manually clean up data if cascade isn't set
      await Promise.all([
        supabase.from("posts").delete().eq("author_id", user.uid),
        supabase.from("comments").delete().eq("author_id", user.uid),
        supabase.from("post_likes").delete().eq("user_id", user.uid),
        supabase.from("notifications").delete().or(`recipient_id.eq.${user.uid},actor_id.eq.${user.uid}`)
      ]);

      // 2. Delete the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.uid);

      if (profileError) {
        console.error("Supabase Deletion Error:", profileError);
        throw new Error(profileError.message);
      }

      // 3. Delete from Firebase Auth
      await deleteUser(user);
      localStorage.removeItem("connekt_profile");
      setUser(null);
      router.replace("/login");
    } catch (error: any) {
      console.error("Delete Account Error:", error);
      throw error;
    }
  };

  const deactivateAccount = async () => {
    if (!user) return;
    try {
      // Set deactivation flag in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({ is_deactivated: true })
        .eq("id", user.uid);

      if (error) throw error;

      // Log out
      await signOut(auth);
      localStorage.removeItem("connekt_profile");
      setUser(null);
      router.replace("/login");
    } catch (error: any) {
      console.error("Deactivation Error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, deleteAccount, deactivateAccount, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
