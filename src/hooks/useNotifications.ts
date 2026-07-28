import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/types";

export function useNotifications() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, COLLECTIONS.notifications),
      where("userId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc")
    );

    const handleQueryError = async (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Notifications snapshot failed, falling back to getDocs:", message);
      try {
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification);
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
      } catch (fallbackErr) {
        console.error("Notifications fallback getDocs failed:", fallbackErr);
      }
    };

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Notification
        );
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
      },
      (err) => {
        void handleQueryError(err);
      }
    );

    return unsub;
  }, [firebaseUser]);

  return { notifications, unreadCount };
}
