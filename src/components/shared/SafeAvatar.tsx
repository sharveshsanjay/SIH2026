import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isValidHttpUrl } from "@/lib/url-utils";
import { cn } from "@/lib/utils";

interface SafeAvatarProps {
  src?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
}

export function SafeAvatar({ src, name, className, fallbackClassName }: SafeAvatarProps) {
  const [error, setError] = useState(false);
  const safeName = (name || "").toString().trim();
  const initials = (safeName
    .split(/\s+/)
    .map((n) => (n ? n[0] : ""))
    .join("")
    .slice(0, 2)
    .toUpperCase()) || "";

  const showImage = src && isValidHttpUrl(src) && !error;

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {showImage && (
        <AvatarImage src={src} alt={name} onError={() => setError(true)} />
      )}
      <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
    </Avatar>
  );
}
