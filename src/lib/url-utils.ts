import {
  FileText,
  Github,
  Image,
  Link2,
  Presentation,
  Sheet,
  Video,
  FolderOpen,
  Cloud,
  type LucideIcon,
} from "lucide-react";

export type UrlType =
  | "google_drive"
  | "github"
  | "youtube"
  | "image"
  | "pdf"
  | "ppt"
  | "docx"
  | "xlsx"
  | "video"
  | "onedrive"
  | "dropbox"
  | "cloudinary"
  | "generic";

export function isValidHttpUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function detectUrlType(url: string): UrlType {
  const lower = url.toLowerCase();
  if (/drive\.google\.com|docs\.google\.com/.test(lower)) return "google_drive";
  if (/github\.com/.test(lower)) return "github";
  if (/youtube\.com|youtu\.be/.test(lower)) return "video";
  if (/onedrive\.live\.com|1drv\.ms/.test(lower)) return "onedrive";
  if (/dropbox\.com/.test(lower)) return "dropbox";
  if (/cloudinary\.com/.test(lower)) return "cloudinary";
  if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(lower)) return "image";
  if (/\.pdf(\?|$)/i.test(lower)) return "pdf";
  if (/\.(ppt|pptx)(\?|$)/i.test(lower)) return "ppt";
  if (/\.(doc|docx)(\?|$)/i.test(lower)) return "docx";
  if (/\.(xls|xlsx)(\?|$)/i.test(lower)) return "xlsx";
  if (/\.(mp4|webm|mov)(\?|$)/i.test(lower)) return "video";
  return "generic";
}

export function getUrlIcon(type: UrlType): LucideIcon {
  const icons: Record<UrlType, LucideIcon> = {
    google_drive: FolderOpen,
    github: Github,
    youtube: Video,
    image: Image,
    pdf: FileText,
    ppt: Presentation,
    docx: FileText,
    xlsx: Sheet,
    video: Video,
    onedrive: Cloud,
    dropbox: Cloud,
    cloudinary: Image,
    generic: Link2,
  };
  return icons[type];
}

export function getUrlLabel(type: UrlType): string {
  const labels: Record<UrlType, string> = {
    google_drive: "Google Drive",
    github: "GitHub",
    youtube: "YouTube",
    image: "Image",
    pdf: "PDF",
    ppt: "Presentation",
    docx: "Document",
    xlsx: "Spreadsheet",
    video: "Video",
    onedrive: "OneDrive",
    dropbox: "Dropbox",
    cloudinary: "Image CDN",
    generic: "Link",
  };
  return labels[type];
}

export function openUrl(url: string): void {
  if (isValidHttpUrl(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function isImageUrl(url: string): boolean {
  const type = detectUrlType(url);
  return type === "image" || type === "cloudinary";
}
