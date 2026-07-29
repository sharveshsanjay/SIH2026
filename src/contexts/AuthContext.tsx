import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
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
  Timestamp,
} from "firebase/firestore";
import { auth, db, googleProvider, COLLECTIONS } from "@/lib/firebase";
import { MemberStatus, User } from "@/types";
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
  
  // Refs to track state and prevent unnecessary updates
  const presenceUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPresenceStatusRef = useRef<MemberStatus | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const fetchProfile = useCallback(async (uid: string): Promise<User | null> => {
    try {
      // Try direct document lookup first (most efficient)
      const docRef = doc(db, COLLECTIONS.users, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: uid,
          email: data.email || "",
          fullName: data.fullName || data.name || "",
          role: data.role || "team_member",
          status: data.status || "offline",
          profilePhotoUrl: data.profilePhotoUrl || "",
          phoneNumber: data.phoneNumber || "",
          department: data.department || "",
          college: data.college || "",
          skills: data.skills || [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : serverTimestamp(),
          lastActive: data.lastActive instanceof Timestamp ? data.lastActive : serverTimestamp(),
        } as User;
      }

      // Fallback to query by uid if direct lookup fails
      const q = query(
        collection(db, COLLECTIONS.users),
        where("uid", "==", uid),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;

      const snap = snapshot.docs[0];
      const data = snap.data();
      return {
        id: snap.id,
        uid: uid,
        email: data.email || "",
        fullName: data.fullName || data.name || "",
        role: data.role || "team_member",
        status: data.status || "offline",
        profilePhotoUrl: data.profilePhotoUrl || "",
        phoneNumber: data.phoneNumber || "",
        department: data.department || "",
        college: data.college || "",
        skills: data.skills || [],
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : serverTimestamp(),
        lastActive: data.lastActive instanceof Timestamp ? data.lastActive : serverTimestamp(),
      } as User;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const profile = await fetchProfile(firebaseUser.uid);
      if (isMountedRef.current) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  }, [firebaseUser, fetchProfile]);

  // OPTIMIZED: Single function to update presence status with deduplication
  const updatePresenceStatus = useCallback(async (status: MemberStatus): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Prevent duplicate updates with same status
    if (lastPresenceStatusRef.current === status) {
      return;
    }

    // Rate limit updates (minimum 2 seconds between updates), but always allow offline updates
    const now = Date.now();
    if (status !== "offline" && now - lastUpdateTimeRef.current < 2000) {
      return;
    }

    lastPresenceStatusRef.current = status;
    lastUpdateTimeRef.current = now;

    const presenceData = {
      lastActive: serverTimestamp(),
      status,
    };

    try {
      const docRef = doc(db, COLLECTIONS.users, currentUser.uid);
      await updateDoc(docRef, presenceData);
    } catch (error) {
      console.warn("Direct presence update failed, falling back to uid query:", error);

      try {
        const uidQuery = query(
          collection(db, COLLECTIONS.users),
          where("uid", "==", currentUser.uid),
          limit(10)
        );
        const snapshot = await getDocs(uidQuery);

        if (snapshot.empty) {
          throw new Error("No user document found for presence fallback.");
        }

        await Promise.all(
          snapshot.docs.map((snap) => updateDoc(snap.ref, presenceData))
        );
      } catch (fallbackError) {
        console.warn("Fallback presence update failed:", fallbackError);
        lastPresenceStatusRef.current = null;
        return;
      }
    }

    // Also update the local profile state if it exists
    if (isMountedRef.current && userProfile) {
      setUserProfile({
        ...userProfile,
        status,
        lastActive: new Date() as any, // Will be updated by serverTimestamp
      });
    }
  }, [userProfile]);

  // Clean up idle timeout
  const clearIdleTimeout = useCallback(() => {
    if (presenceUpdateTimeoutRef.current) {
      clearTimeout(presenceUpdateTimeoutRef.current);
      presenceUpdateTimeoutRef.current = null;
    }
  }, []);

  // Set away after idle with debouncing
  const setAwayAfterIdle = useCallback(() => {
    clearIdleTimeout();
    presenceUpdateTimeoutRef.current = setTimeout(() => {
      // Only set away if we're not already away
      if (lastPresenceStatusRef.current !== "away") {
        void updatePresenceStatus("away");
      }
    }, 60000); // 60 seconds idle
  }, [clearIdleTimeout, updatePresenceStatus]);

  // Handle user activity with debouncing
  const handleUserActivity = useCallback(() => {
    clearIdleTimeout();
    
    // Only update to active if we're not already active and document is visible
    if (document.visibilityState === "visible" && 
        navigator.onLine && 
        lastPresenceStatusRef.current !== "active") {
      void updatePresenceStatus("active");
    }
    
    setAwayAfterIdle();
  }, [clearIdleTimeout, setAwayAfterIdle, updatePresenceStatus]);

  useEffect(() => {
    isMountedRef.current = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // User switched tabs - set away immediately
        void updatePresenceStatus("away");
        clearIdleTimeout();
      } else {
        // User came back - set active
        if (navigator.onLine) {
          void updatePresenceStatus("active");
        }
        setAwayAfterIdle();
      }
    };

    const handleFocus = () => {
      if (navigator.onLine) {
        void updatePresenceStatus("active");
      }
      setAwayAfterIdle();
    };

    const handleBlur = () => {
      void updatePresenceStatus("away");
      clearIdleTimeout();
    };

    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        const status = document.visibilityState === "hidden" ? "away" : "active";
        void updatePresenceStatus(status);
        if (status === "active") {
          setAwayAfterIdle();
        }
      } else {
        void updatePresenceStatus("offline");
        clearIdleTimeout();
      }
    };

    const handleBeforeUnload = () => {
      void updatePresenceStatus("offline");
    };

    // Set up event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Auth state listener
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await fetchProfile(user.uid);
        if (isMountedRef.current) {
          setUserProfile(profile);
          if (profile) {
            // Set initial status based on visibility
            const initialStatus = document.visibilityState === "hidden" ? "away" : "active";
            lastPresenceStatusRef.current = initialStatus;
            await updatePresenceStatus(initialStatus);
            if (initialStatus === "active") {
              setAwayAfterIdle();
            }
          }
        }
      } else {
        clearIdleTimeout();
        if (isMountedRef.current) {
          setUserProfile(null);
          lastPresenceStatusRef.current = null;
        }
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      isMountedRef.current = false;
      unsub();
      clearIdleTimeout();
      
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [fetchProfile, clearIdleTimeout, setAwayAfterIdle, updatePresenceStatus, handleUserActivity]);

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchProfile(cred.user.uid);
      if (!profile) {
        await signOut(auth);
        throw new Error("Account not found. Contact your admin.");
      }
      await logActivity("User Logged In", { method: "email" });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile = await fetchProfile(cred.user.uid);
      if (!profile) {
        await signOut(auth);
        throw new Error("Account not found. Contact your admin.");
      }
      await logActivity("User Logged In", { method: "google" });
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await updatePresenceStatus("offline");
      lastPresenceStatusRef.current = "offline";
    } catch (error) {
      console.warn("Error updating presence on logout:", error);
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