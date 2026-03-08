import { useState, useEffect } from "react";
import { ExternalLink, ShieldAlert, ShieldCheck, ShieldQuestion, Shield, Loader2 } from "lucide-react";
import { checkLinkSafety, isExplicitLink, type SafetyLevel } from "@/components/feed/LinkSafety";
import { SafeLinkDialog } from "@/components/feed/LinkSafety";

interface DmLinkWarningProps {
  url: string;
  isMe: boolean;
}

const DmLinkWarning = ({ url, isMe }: DmLinkWarningProps) => {
  const [level, setLevel] = useState<SafetyLevel>(isExplicitLink(url) ? "danger" : "checking");
  const [reason, setReason] = useState(isExplicitLink(url) ? "Explicit/adult content" : "");
  const [domain, setDomain] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (isExplicitLink(url)) return; // already set
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

  const BadgeIcon = () => {
    const cls = "h-3.5 w-3.5 shrink-0";
    switch (level) {
      case "safe": return <ShieldCheck className={`${cls} text-emerald-500`} />;
      case "warning": return <ShieldQuestion className={`${cls} text-amber-500`} />;
      case "danger": return <ShieldAlert className={`${cls} text-destructive`} />;
      case "checking": return <Loader2 className={`${cls} animate-spin ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`} />;
      default: return <Shield className={`${cls} ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`} />;
    }
  };

  const showWarning = level === "warning" || level === "danger";

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
        className={`flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-lg text-left w-full transition-colors ${
          level === "danger"
            ? "bg-destructive/20 border border-destructive/30"
            : level === "warning"
            ? "bg-amber-500/20 border border-amber-500/30"
            : isMe
            ? "bg-white/10 border border-white/20"
            : "bg-muted border border-border"
        }`}
      >
        <BadgeIcon />
        <ExternalLink className={`h-3 w-3 shrink-0 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
        <span className={`text-xs truncate flex-1 ${isMe ? "text-primary-foreground" : "text-foreground"}`}>
          {url}
        </span>
        {level !== "checking" && showWarning && (
          <span className={`text-[9px] font-display font-bold shrink-0 ${
            level === "danger" ? "text-destructive" : "text-amber-500"
          }`}>
            {level === "danger" ? "⚠ Blocked" : "⚠ Caution"}
          </span>
        )}
      </button>

      {showWarning && (
        <p className={`text-[10px] mt-1 font-display ${
          level === "danger" ? "text-destructive" : "text-amber-600 dark:text-amber-400"
        }`}>
          {level === "danger"
            ? "🚫 This link may be dangerous. Do not open it."
            : "⚠️ This link couldn't be verified. Proceed with caution."}
        </p>
      )}

      <SafeLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        url={url}
        safety={{ level: level === "checking" ? "unknown" : level, reason, domain }}
      />
    </>
  );
};

export default DmLinkWarning;
