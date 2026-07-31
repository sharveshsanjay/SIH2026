export type UserRole = "super_admin" | "admin" | "mentor" | "technical_lead" | "team_leader" | "team_member";

export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type IdeaStatus = "pending" | "approved" | "rejected";
export type MemberStatus = "active" | "away" | "offline";

export interface User {
  id: string;
  uid?: string;
  email: string;
  fullName: string;
  role: UserRole;
  profilePhotoUrl?: string;
  phoneNumber?: string;
  skills?: string[];
  department?: string;
  college?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentTask?: string;
  status: MemberStatus;
  organizationId?: string;
  teamId?: string;
  lastActive?: Date | { toDate: () => Date };
  createdAt?: Date | { toDate: () => Date };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  deadline?: string;
  priority: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  status: TaskStatus;
  attachmentUrl?: string;
  order: number;
  createdAt?: Date | { toDate: () => Date };
  updatedAt?: Date | { toDate: () => Date };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt?: Date | { toDate: () => Date };
}

export interface ProblemStatement {
  id: string;
  problemId?: string;
  title: string;
  organization?: string;
  category?: string;
  description?: string;
  objectives?: string;
  constraints?: string;
  expectedOutput?: string;
  importantLinks?: string[];
  referenceUrls?: string[];
  researchNotes?: string;
}

export interface Idea {
  id: string;
  title: string;
  description?: string;
  proposedBy: string;
  proposedByName?: string;
  technologies?: string[];
  advantages?: string;
  challenges?: string;
  referenceUrl?: string;
  votes: string[];
  status: IdeaStatus;
  createdAt?: Date | { toDate: () => Date };
}

export interface Document {
  id: string;
  name: string;
  category: string;
  description?: string;
  documentUrl: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadDate?: Date | { toDate: () => Date };
}

export interface ResearchLink {
  id: string;
  title: string;
  description?: string;
  url: string;
  category: string;
  tags?: string[];
  createdAt?: Date | { toDate: () => Date };
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  agenda?: string;
  meetingLink?: string;
  notes?: string;
  createdAt?: Date | { toDate: () => Date };
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  createdAt?: Date | { toDate: () => Date };
}

export interface TimelineMilestone {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  status: "Not Started" | "In Progress" | "Completed" | "On Hold" | "Delayed";
  priority: "Low" | "Medium" | "High" | "Critical";
  assignedTo?: string;
  assignedToName?: string;
  assignedBy?: string;
  assignedByName?: string;
  createdBy?: string;
  organizationId?: string;
  teamId?: string;
  color?: string;
  progress: number;
  order: number;
  attachments?: string[];
  createdAt?: Date | { toDate: () => Date };
  updatedAt?: Date | { toDate: () => Date };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  read: boolean;
  createdAt?: Date | { toDate: () => Date };
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date | { toDate: () => Date };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  recipientName?: string;
  text: string;
  replyToId?: string;
  readBy: string[];
  createdAt?: Date | { toDate: () => Date } | { seconds: number; nanoseconds: number } | ReturnType<typeof import("firebase/firestore").serverTimestamp>;
}

export interface PlatformSettings {
  id: string;
  projectName: string;
  sihDeadline: string;
  teamName?: string;
  description?: string;
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

export const DEFAULT_MILESTONES = [
  "Research",
  "UI Design",
  "Backend",
  "Database",
  "Authentication",
  "AI",
  "Testing",
  "Deployment",
  "Presentation",
  "Final Submission",
];
