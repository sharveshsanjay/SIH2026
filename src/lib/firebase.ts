import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const COLLECTIONS = {
  users: "users",
  tasks: "tasks",
  taskComments: "taskComments",
  problemStatements: "problemStatements",
  ideas: "ideas",
  documents: "documents",
  researchLinks: "researchLinks",
  meetings: "meetings",
  announcements: "announcements",
  timelines: "timelines",
  notifications: "notifications",
  activityLogs: "activityLogs",
  analytics: "analytics",
  settings: "settings",
  chatRooms: "chatRooms",
  messages: "messages",
} as const;
