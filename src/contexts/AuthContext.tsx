import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider, COLLECTIONS } from "@/lib/firebase";
import { User } from "@/types";
import { logActivity } from "@/lib/activity-logger";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<User | null> => {
    const byIdSnap = await getDoc(doc(db, COLLECTIONS.users, uid));
    if (byIdSnap.exists()) {
      return { id: byIdSnap.id, uid, ...byIdSnap.data() } as User;
    }

    const q = query(
      collection(db, COLLECTIONS.users),
      where("uid", "==", uid),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, uid, ...docSnap.data() } as User;
  };

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const profile = await fetchProfile(firebaseUser.uid);
    setUserProfile(profile);
  };

  const updateProfileStatus = async (uid: string, data: Partial<User>) => {
    const profile = await fetchProfile(uid);
    if (!profile) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.users, profile.id), data as Record<string, unknown> as never);
    } catch (error) {
      console.warn("Failed to update profile status:", error);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await fetchProfile(user.uid);
        setUserProfile(profile);
        if (profile) {
          try {
            await updateDoc(doc(db, COLLECTIONS.users, profile.id), {
              lastActive: serverTimestamp(),
              status: "active",
            });
          } catch (error) {
            console.warn("Failed to mark profile active:", error);
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchProfile(cred.user.uid);
    if (!profile) {
      await signOut(auth);
      throw new Error("Account not found. Contact your admin.");
    }
    await logActivity("User Logged In", { method: "email" });
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await fetchProfile(cred.user.uid);
    if (!profile) {
      await signOut(auth);
      throw new Error("Account not found. Contact your admin.");
    }
    await logActivity("User Logged In", { method: "google" });
  };

  const logout = async () => {
    if (firebaseUser) {
      await updateProfileStatus(firebaseUser.uid, { status: "offline" });
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        isAdmin: userProfile?.role === "admin",
        login,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
