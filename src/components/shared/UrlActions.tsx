import { ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectUrlType, getUrlIcon, getUrlLabel, openUrl, isValidHttpUrl } from "@/lib/url-utils";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UrlActionsProps {
  url: string;
  showLabel?: boolean;
  className?: string;
}

export function UrlActions({ url, showLabel = true, className }: UrlActionsProps) {
  if (!isValidHttpUrl(url)) return null;

  const type = detectUrlType(url);
  const Icon = getUrlIcon(type);

  const handleCopy = async () => {
    await copyToClipboard(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <Badge variant="secondary" className="gap-1">
          <Icon className="h-3 w-3" />
          {getUrlLabel(type)}
        </Badge>
      )}
      <Button variant="outline" size="sm" onClick={() => openUrl(url)}>
        <ExternalLink className="h-3.5 w-3.5" />
        Open
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
