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
  blocked?: boolean;
}

// Client-side explicit content detection (fast, no network)
const EXPLICIT_DOMAINS = new Set([
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com',
  'youporn.com', 'tube8.com', 'spankbang.com', 'eporner.com', 'hqporner.com',
  'txxx.com', 'porn.com', 'brazzers.com', 'bangbros.com', 'naughtyamerica.com',
  'realitykings.com', 'onlyfans.com', 'fansly.com', 'stripchat.com',
  'chaturbate.com', 'livejasmin.com', 'bongacams.com', 'cam4.com',
  'rule34.xxx', 'e-hentai.org', 'nhentai.net', 'motherless.com',
]);

const EXPLICIT_PATTERNS = [
  /\bporn\b/i, /\bxxx\b/i, /\bhentai\b/i, /\bnude[s]?\b/i,
  /\bnsfw\b/i, /\badult[\-_]?(content|video|film)/i,
  /\bsex[\-_]?(video|tape|cam)/i, /\bescort[s]?\b/i,
  /\bcamgirl/i, /\bonlyfan/i,
];

function getDomain(url: string): string {
  try {
    const parts = new URL(url).hostname.split('.');
    return parts.slice(-2).join('.');
  } catch { return ''; }
}

export function isExplicitLink(url: string): boolean {
  const domain = getDomain(url);
  if (EXPLICIT_DOMAINS.has(domain)) return true;
  return EXPLICIT_PATTERNS.some(p => p.test(url) || p.test(domain));
}

// Cache results to avoid repeated checks
const linkCache = new Map<string, LinkSafetyResult>();

export async function checkLinkSafety(url: string): Promise<LinkSafetyResult> {
  if (linkCache.has(url)) return linkCache.get(url)!;

  const fallback: LinkSafetyResult = { level: "warning", reason: "Unknown domain — proceed with caution", domain: "" };

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5000)
    );
    const check = supabase.functions.invoke("check-link", { body: { url } });

    const { data, error } = await Promise.race([check, timeout]);
    if (error || !data?.success) {
      linkCache.set(url, fallback);
      return fallback;
    }
    const result: LinkSafetyResult = {
      level: data.level,
      reason: data.reason,
      domain: data.domain,
    };
    linkCache.set(url, result);
    return result;
  } catch {
    linkCache.set(url, fallback);
    return fallback;
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
