import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase";
import type { TimelineMilestone, User } from "@/types";

export type TimelineFormValues = Omit<TimelineMilestone, "id" | "order" | "createdAt" | "updatedAt" | "createdBy" | "assignedBy" | "organizationId" | "teamId"> & {
  order?: number;
  createdBy?: string;
  assignedBy?: string;
  organizationId?: string;
  teamId?: string;
};

export function subscribeToTimelines(
  callback: (milestones: TimelineMilestone[]) => void,
  user?: User | null
) {
  const constraints = [orderBy("order", "asc"), orderBy("createdAt", "asc")];

  const baseQuery = query(collection(db, COLLECTIONS.timelines), ...constraints);

  return onSnapshot(baseQuery, (snapshot) => {
    const milestones = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Partial<TimelineMilestone>),
      })) as TimelineMilestone[];

    if (user?.organizationId) {
      callback(milestones.filter((item) => item.organizationId === user.organizationId));
      return;
    }

    callback(milestones);
  });
}

export async function createTimelineMilestone(values: TimelineFormValues, user: User | null) {
  const ref = doc(collection(db, COLLECTIONS.timelines));
  const payload: TimelineMilestone = {
    id: ref.id,
    title: values.title,
    description: values.description ?? "",
    notes: values.notes ?? "",
    startDate: values.startDate ?? "",
    endDate: values.endDate ?? "",
    status: values.status ?? "Not Started",
    priority: values.priority ?? "Medium",
    assignedTo: values.assignedTo ?? "",
    assignedToName: values.assignedToName ?? "",
    assignedBy: values.assignedBy ?? user?.uid ?? "",
    assignedByName: values.assignedByName ?? user?.fullName ?? "",
    createdBy: values.createdBy ?? user?.uid ?? "",
    organizationId: values.organizationId ?? user?.organizationId ?? "",
    teamId: values.teamId ?? user?.teamId ?? "",
    color: values.color ?? "#2563eb",
    progress: values.progress ?? 0,
    order: values.order ?? 999,
    attachments: values.attachments ?? [],
    createdAt: serverTimestamp() as never,
    updatedAt: serverTimestamp() as never,
  };

  await setDoc(ref, payload);
  return ref.id;
}

export async function updateTimelineMilestone(id: string, values: Partial<TimelineMilestone>) {
  const ref = doc(db, COLLECTIONS.timelines, id);
  await updateDoc(ref, {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTimelineMilestone(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.timelines, id));
}

export async function reorderTimelineMilestones(milestones: TimelineMilestone[]) {
  const batch = milestones.map((milestone, index) => {
    const ref = doc(db, COLLECTIONS.timelines, milestone.id);
    return updateDoc(ref, { order: index + 1 });
  });

  await Promise.all(batch);
}

export async function duplicateTimelineMilestone(milestone: TimelineMilestone, user: User | null) {
  const copy = {
    ...milestone,
    title: `${milestone.title} (Copy)`,
    status: "Not Started" as const,
    progress: 0,
    createdBy: user?.uid ?? milestone.createdBy,
    assignedBy: user?.uid ?? milestone.assignedBy,
    assignedByName: user?.fullName ?? milestone.assignedByName,
    order: 999,
  };
  return createTimelineMilestone(copy as TimelineFormValues, user);
}
