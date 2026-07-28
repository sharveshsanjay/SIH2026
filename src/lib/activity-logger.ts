import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { auth, COLLECTIONS, db } from "./firebase";

export async function logActivity(
  action: string,
  metadata: Record<string, unknown> = {}
) {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, COLLECTIONS.activityLogs), {
    action,
    userId: user.uid,
    userEmail: user.email,
    metadata,
    timestamp: serverTimestamp(),
  });
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  payload: Record<string, unknown> = {}
) {
  await addDoc(collection(db, COLLECTIONS.notifications), {
    userId,
    type,
    title,
    message,
    payload,
    read: false,
    createdAt: serverTimestamp(),
  });
}
