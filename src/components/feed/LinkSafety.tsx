import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion, ExternalLink, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type SafetyLevel = "safe" | "warning" | "danger" | "checking" | "unknown";

interface LinkSafetyResult {
  level: SafetyLevel;
  reason: string;
  domain: string;
}

// Cache results to avoid repeated checks
const linkCache = new Map<string, LinkSafetyResult>();

export async function checkLinkSafety(url: string): Promise<LinkSafetyResult> {
  if (linkCache.has(url)) return linkCache.get(url)!;

  try {
    const { data, error } = await supabase.functions.invoke("check-link", {
      body: { url },
    });
    if (error || !data?.success) {
      return { level: "unknown", reason: "Could not verify", domain: "" };
    }
    const result: LinkSafetyResult = {
      level: data.level,
      reason: data.reason,
      domain: data.domain,
    };
    linkCache.set(url, result);
    return result;
  } catch {
    return { level: "unknown", reason: "Could not verify", domain: "" };
  }
}

export const SafetyBadge = ({ level, small = false }: { level: SafetyLevel; small?: boolean }) => {
  const size = small ? "h-3.5 w-3.5" : "h-4 w-4";
  switch (level) {
    case "safe":
      return <ShieldCheck className={cn(size, "text-emerald-500")} />;
    case "warning":
      return <ShieldQuestion className={cn(size, "text-amber-500")} />;
    case "danger":
      return <ShieldAlert className={cn(size, "text-destructive")} />;
    case "checking":
      return <Loader2 className={cn(size, "text-muted-foreground animate-spin")} />;
    default:
      return <Shield className={cn(size, "text-muted-foreground")} />;
  }
};

interface SafeLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  safety: LinkSafetyResult | null;
}

export const SafeLinkDialog = ({ open, onOpenChange, url, safety }: SafeLinkDialogProps) => {
  const level = safety?.level || "unknown";
  const isDanger = level === "danger";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-display">
            {isDanger ? (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            ) : level === "warning" ? (
              <ShieldQuestion className="h-5 w-5 text-amber-500" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            )}
            {isDanger ? "Suspicious Link Detected" : level === "warning" ? "Unverified Link" : "External Link"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm">
                {isDanger
                  ? "This link has been flagged as potentially dangerous. We strongly recommend NOT clicking it."
                  : level === "warning"
                  ? "We couldn't fully verify this link. Proceed with caution."
                  : "You're about to visit an external website."}
              </p>
              <div className="p-3 rounded-lg bg-muted border border-border break-all">
                <div className="flex items-center gap-2 mb-1">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground font-display">Destination URL:</span>
                </div>
                <p className="text-sm font-mono text-foreground">{url}</p>
              </div>
              {safety?.reason && (
                <div className={cn(
                  "px-3 py-2 rounded-lg text-xs font-display",
                  isDanger ? "bg-destructive/10 text-destructive" :
                  level === "warning" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
                  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}>
                  {safety.reason}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                💡 Tip: Never enter passwords or personal info on sites you don't trust.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-display">Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            className={cn(
              "font-display gap-1.5",
              isDanger && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isDanger ? "Open Anyway" : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
