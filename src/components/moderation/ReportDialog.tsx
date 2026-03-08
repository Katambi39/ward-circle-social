import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "explicit", label: "Explicit or adult content" },
  { value: "violence", label: "Violence or threats" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentType: "post" | "comment" | "story" | "listing" | "message";
  flaggedText?: string;
}

const ReportDialog = ({ open, onOpenChange, contentId, contentType, flaggedText }: ReportDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);

    const { error } = await supabase.from("moderation_flags").insert({
      user_id: user.id,
      content_id: contentId,
      content_type: contentType,
      reason: reason === "other" ? details.trim() || "Other" : REPORT_REASONS.find(r => r.value === reason)?.label || reason,
      severity: ["hate_speech", "violence", "explicit"].includes(reason) ? "high" : "medium",
      flagged_text: flaggedText?.substring(0, 500) || null,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit report. Please try again.");
      return;
    }

    toast.success("Report submitted. Our team will review it shortly.");
    setReason("");
    setDetails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Flag className="h-5 w-5 text-destructive" />
            Report {contentType}
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Select a reason for reporting this content.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={setReason} className="space-y-2 my-2">
          {REPORT_REASONS.map((r) => (
            <div key={r.value} className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
              <Label htmlFor={`reason-${r.value}`} className="flex-1 cursor-pointer text-sm font-display">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {reason === "other" && (
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Please describe the issue..."
            maxLength={500}
            className="resize-none"
            rows={3}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-display">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting || (reason === "other" && !details.trim())}
            variant="destructive"
            className="font-display"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
