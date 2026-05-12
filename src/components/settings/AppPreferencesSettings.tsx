import { useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Filter, Wifi, HardDrive, HelpCircle, MessageSquare, Star, Search, ShieldAlert,
  ChevronDown, ChevronUp, Send, Mail, ExternalLink,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "How do I verify my account?", a: "Go to Settings → Account → Verification. You'll need to verify your phone number via OTP. For marketplace access, complete Identity Verification (KYC) with your National ID and selfie." },
  { q: "Can I post anonymously?", a: "Yes! When creating a post, toggle the 'Anonymous' switch. Your identity will be hidden from other users, but platform moderators can still see it for safety." },
  { q: "How does the marketplace escrow work?", a: "When you make a purchase, funds are held in escrow for 72 hours. This gives you time to verify the product. After 72 hours, funds are released to the seller automatically." },
  { q: "How do I report harmful content?", a: "Tap the three-dot menu (⋯) on any post, comment, or profile and select 'Report'. Choose the reason and our moderation team will review it." },
  { q: "What are badges and how do I earn them?", a: "Badges are earned through platform activity — posting, engaging, verifying your identity, and contributing to the community. Check your profile to see your current badges." },
  { q: "How do I enable two-factor authentication?", a: "Go to Settings → Security → Two-Factor Authentication. You can enable OTP-based 2FA or set up passkey/biometric login for extra security." },
  { q: "Why can't I join some groups?", a: "Some groups require phone verification before joining. Complete your phone verification in Settings → Account to unlock access." },
  { q: "How do I use Toboa Siri (AI assistant)?", a: "Tap the AI chat icon in the bottom navigation. You can ask questions, get content verified, or have general conversations. It supports text and file uploads." },
];

const AppPreferencesSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings, loading, updateSetting } = useUserSettings();
  const [faqOpen, setFaqOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [contactMessage, setContactMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
    }
    toast({ title: "Cache cleared ✓" });
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback_submissions" as any).insert({
      user_id: user?.id ?? null,
      rating: feedbackRating || null,
      message: feedbackText.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send feedback", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Feedback sent ✓", description: "Thank you for helping improve Conect!" });
    setFeedbackText("");
    setFeedbackRating(0);
    setFeedbackOpen(false);
  };

  const handleContactSupport = async () => {
    if (!contactMessage.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("support_messages" as any).insert({
      user_id: user?.id ?? null,
      email: contactEmail.trim() || null,
      message: contactMessage.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send message", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Message sent ✓", description: "Our support team will get back to you soon." });
    setContactMessage("");
    setContactEmail("");
    setContactOpen(false);
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Content Filters */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" /> Content Filters
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Hide Sensitive Content
              </p>
              <p className="text-xs text-muted-foreground">Filter potentially sensitive trends and posts</p>
            </div>
            <Switch checked={settings.hide_sensitive} onCheckedChange={(v) => updateSetting("hide_sensitive", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" /> Safe Search
              </p>
              <p className="text-xs text-muted-foreground">Filter explicit content from search results</p>
            </div>
            <Switch checked={settings.safe_search} onCheckedChange={(v) => updateSetting("safe_search", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Prioritize Local Content</p>
              <p className="text-xs text-muted-foreground">Show Kenyan and nearby content first</p>
            </div>
            <Switch checked={settings.local_content} onCheckedChange={(v) => updateSetting("local_content", v)} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Storage & Performance */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" /> Storage & Performance
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-primary" /> Data Saver Mode
              </p>
              <p className="text-xs text-muted-foreground">Reduce data usage — ideal for limited bundles</p>
            </div>
            <Switch checked={settings.data_saver} onCheckedChange={(v) => updateSetting("data_saver", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Offline Access</p>
              <p className="text-xs text-muted-foreground">Cache content for areas with spotty internet</p>
            </div>
            <Switch checked={settings.offline_access} onCheckedChange={(v) => updateSetting("offline_access", v)} />
          </div>

          <Button variant="outline" size="sm" onClick={handleClearCache} className="rounded-xl font-display text-xs gap-1.5 w-full">
            <HardDrive className="h-3.5 w-3.5" /> Clear Cache
          </Button>
        </div>
      </section>

      <Separator />

      {/* Help & Feedback */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" /> Help & Feedback
        </h3>

        <Button variant="outline" size="sm" onClick={() => setFaqOpen(true)} className="rounded-xl font-display text-xs gap-1.5 w-full">
          <HelpCircle className="h-3.5 w-3.5" /> FAQs & Help Center
        </Button>
        <Button variant="outline" size="sm" onClick={() => setContactOpen(true)} className="rounded-xl font-display text-xs gap-1.5 w-full">
          <MessageSquare className="h-3.5 w-3.5" /> Contact Support
        </Button>
        <Button variant="outline" size="sm" onClick={() => setFeedbackOpen(true)} className="rounded-xl font-display text-xs gap-1.5 w-full">
          <Star className="h-3.5 w-3.5" /> Send Feedback
        </Button>
        <p className="text-xs text-muted-foreground text-center">Your feedback helps us build a better Conect for Kenya 🇰🇪</p>
      </section>

      {/* FAQ Dialog */}
      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> FAQs & Help Center
            </DialogTitle>
            <DialogDescription>Find answers to common questions about Conect</DialogDescription>
          </DialogHeader>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-display font-medium text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Can't find what you need? Use <button onClick={() => { setFaqOpen(false); setContactOpen(true); }} className="text-primary font-semibold hover:underline">Contact Support</button>.
          </p>
        </DialogContent>
      </Dialog>

      {/* Contact Support Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Contact Support
            </DialogTitle>
            <DialogDescription>Describe your issue and we'll get back to you</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-display font-medium text-foreground mb-1 block">Your email (optional)</label>
              <Input
                placeholder="you@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-display font-medium text-foreground mb-1 block">Message *</label>
              <Textarea
                placeholder="Describe your issue or question..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="rounded-xl text-sm min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleContactSupport}
              disabled={!contactMessage.trim() || submitting}
              className="w-full rounded-xl font-display text-xs gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> {submitting ? "Sending..." : "Send Message"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Messages are stored securely and reviewed by the Conect support team.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> Send Feedback
            </DialogTitle>
            <DialogDescription>Help us improve Conect for everyone</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-display font-medium text-foreground mb-2 block">How would you rate your experience?</label>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        star <= feedbackRating
                          ? "text-kenya-gold fill-kenya-gold"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-display font-medium text-foreground mb-1 block">Your feedback *</label>
              <Textarea
                placeholder="What do you love? What could be better?"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="rounded-xl text-sm min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim()}
              className="w-full rounded-xl font-display text-xs gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppPreferencesSettings;
