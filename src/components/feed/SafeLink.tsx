import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { SafetyBadge, SafeLinkDialog, checkLinkSafety, type SafetyLevel } from "./LinkSafety";

interface SafeLinkProps {
  url: string;
}

const SafeLink = ({ url }: SafeLinkProps) => {
  const [level, setLevel] = useState<SafetyLevel>("checking");
  const [reason, setReason] = useState("");
  const [domain, setDomain] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkLinkSafety(url).then((result) => {
      if (!cancelled) {
        setLevel(result.level);
        setReason(result.reason);
        setDomain(result.domain);
      }
    });
    return () => { cancelled = true; };
  }, [url]);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setDialogOpen(true);
        }}
        className={`flex items-center gap-2 p-3 mb-3 rounded-lg border transition-colors text-left w-full ${
          level === "danger"
            ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
            : level === "warning"
            ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
            : "border-border bg-muted/50 hover:bg-muted"
        }`}
      >
        <SafetyBadge level={level} />
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm text-primary font-display truncate flex-1">
          {url}
        </span>
        {level !== "checking" && (
          <span className={`text-[10px] font-display shrink-0 ${
            level === "danger" ? "text-destructive" :
            level === "warning" ? "text-amber-500" :
            level === "safe" ? "text-emerald-500" : "text-muted-foreground"
          }`}>
            {level === "safe" ? "Verified" : level === "warning" ? "Unverified" : level === "danger" ? "Suspicious" : "Unknown"}
          </span>
        )}
      </button>

      <SafeLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        url={url}
        safety={{ level: level === "checking" ? "unknown" : level, reason, domain }}
      />
    </>
  );
};

export default SafeLink;
