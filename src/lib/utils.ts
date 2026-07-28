import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function normalizeDate(date: Date | string | { toDate?: () => Date }): Date {
  if (typeof date === "string") return new Date(date);
  if (date instanceof Date) return date;
  return date.toDate ? date.toDate() : new Date();
}

export function formatDate(date: Date | string | { toDate?: () => Date }): string {
  const d = normalizeDate(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | { toDate?: () => Date }): string {
  const d = normalizeDate(date);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDaysRemaining(deadline: string | Date): number {
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
