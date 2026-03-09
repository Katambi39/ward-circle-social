import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound, RefreshCw, Copy, Download, Loader2, AlertTriangle, CheckCircle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface RecoveryCodesSectionProps {
  userId: string;
  twoFAEnabled: boolean;
}

const RecoveryCodesSection = ({ userId, twoFAEnabled }: RecoveryCodesSectionProps) => {
  const { toast } = useToast();
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  useEffect(() => {
    loadRemainingCount();
  }, [userId]);

  const loadRemainingCount = async () => {
    const { count } = await supabase
      .from("recovery_codes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_used", false);
    setRemainingCount(count ?? 0);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Delete old codes
      await supabase.from("recovery_codes").delete().eq("user_id", userId);

      // Generate 8 new codes
      const codes = Array.from({ length: 8 }, () => generateCode());
      const rows = codes.map((code) => ({ user_id: userId, code }));

      const { error } = await supabase.from("recovery_codes").insert(rows);
      if (error) throw error;

      setGeneratedCodes(codes);
      setShowCodesDialog(true);
      setRemainingCount(8);
      toast({ title: "Recovery codes generated 🔑" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCodes.join("\n"));
    toast({ title: "Copied to clipboard ✓" });
  };

  const handleDownload = () => {
    const content = `Conect Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n\n${generatedCodes.join("\n")}\n\nKeep these codes safe. Each can only be used once.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conect-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!twoFAEnabled) return null;

  return (
    <>
      <div className="space-y-3">
        <h4 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
          <KeyRound className="h-3.5 w-3.5 text-primary" /> Recovery Codes
        </h4>
        <p className="text-xs text-muted-foreground">
          Backup codes for signing in if you lose access to your email. Each code can only be used once.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3 border border-border">
            <div className="flex items-center gap-2">
              {remainingCount !== null && remainingCount <= 2 ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-display text-foreground">
                {remainingCount === 0 ? "No codes available" : `${remainingCount} code${remainingCount !== 1 ? "s" : ""} remaining`}
              </span>
            </div>
            <Badge
              variant={remainingCount !== null && remainingCount <= 2 ? "destructive" : "secondary"}
              className="rounded-full text-[10px]"
            >
              {remainingCount ?? 0}/8
            </Badge>
          </div>
        )}

        {remainingCount !== null && remainingCount <= 2 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive font-display flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {remainingCount === 0
              ? "Generate new recovery codes to maintain backup access."
              : "Running low on recovery codes. Consider regenerating."}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl font-display text-xs gap-1.5 w-full"
        >
          {generating ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
          ) : (
            <><RefreshCw className="h-3.5 w-3.5" /> {remainingCount === 0 ? "Generate Recovery Codes" : "Regenerate Codes"}</>
          )}
        </Button>
      </div>

      {/* Generated Codes Dialog */}
      <Dialog open={showCodesDialog} onOpenChange={setShowCodesDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Recovery Codes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive font-display flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Save these codes now. They won't be shown again.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {generatedCodes.map((c, i) => (
                <div
                  key={i}
                  className="bg-muted/50 rounded-lg px-3 py-2 text-center font-mono text-sm tracking-wider text-foreground border border-border"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1 rounded-xl font-display text-xs gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 rounded-xl font-display text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecoveryCodesSection;
