import SEO from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import { Shield, Clock, AlertTriangle, CheckCircle2, Ban, HelpCircle, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const BuyerProtectionPage = () => {
  const features = [
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "72-Hour Escrow Hold",
      description: "When you buy an item, your payment is held securely for 72 hours before being released to the seller. This gives you time to receive and inspect your purchase.",
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-accent" />,
      title: "Dispute & Report",
      description: "If something is wrong with your purchase — fake item, not delivered, or not as described — you can file a report within the 72-hour window and your funds will be frozen.",
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Seller KYC Verification",
      description: "All sellers on the marketplace must complete identity verification (KYC) before they can list items. This protects you from anonymous scammers.",
    },
    {
      icon: <Ban className="h-6 w-6 text-destructive" />,
      title: "Fraud Detection",
      description: "Our admin team reviews reports and can freeze funds, ban sellers, and issue refunds when fraud is detected.",
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
      title: "Auto-Release",
      description: "If no dispute is raised within 72 hours, funds are automatically released to the seller. Smooth transactions for honest sellers.",
    },
  ];

  const faqs = [
    {
      q: "How does the 72-hour hold work?",
      a: "When you purchase an item, the money is deducted from your wallet but held in escrow. After 72 hours, if no dispute is filed, the funds are released to the seller automatically.",
    },
    {
      q: "What if I don't receive my item?",
      a: "File a report through the marketplace within 72 hours. Select 'Non-delivery' as the reason. Our admin team will investigate and can issue a refund.",
    },
    {
      q: "Can I get a refund?",
      a: "Yes, if your dispute is valid (fake item, non-delivery, item not as described), the admin team can refund your funds from the escrow hold.",
    },
    {
      q: "Why do sellers need KYC?",
      a: "KYC (Know Your Customer) verification ensures sellers are real people with verified identities. This drastically reduces scams and makes it easy to hold bad actors accountable.",
    },
    {
      q: "What if the 72 hours have passed?",
      a: "Once funds are released, disputes become harder to resolve. We strongly recommend inspecting purchases promptly and filing reports within the window.",
    },
  ];

  return (
    <AppLayout>
      <SEO title="Buyer Protection" description="Learn how Conect protects your marketplace purchases with escrow, KYC, and dispute resolution." path="/buyer-protection" />
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Buyer Protection</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
            Shop with confidence. Every marketplace purchase on Conect is protected by our escrow system, seller verification, and dispute resolution.
          </p>
        </motion.div>

        {/* How it works */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">How It Works</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8 bg-card border border-border rounded-xl p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Purchase Timeline</h2>
          <div className="relative pl-8 space-y-6">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
            {[
              { time: "Purchase", desc: "Funds deducted from your wallet and held in escrow", icon: <ShoppingBag className="h-4 w-4" /> },
              { time: "0-72 Hours", desc: "Receive item, inspect it. File a report if anything is wrong", icon: <Clock className="h-4 w-4" /> },
              { time: "Dispute Filed?", desc: "Funds frozen. Admin team investigates. Refund issued if valid", icon: <AlertTriangle className="h-4 w-4" /> },
              { time: "72 Hours (No Dispute)", desc: "Funds automatically released to the seller", icon: <CheckCircle2 className="h-4 w-4" /> },
            ].map((step, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <div className="absolute -left-5 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {step.icon}
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-foreground">{step.time}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-card">
                <h3 className="font-display font-bold text-sm text-foreground">{faq.q}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BuyerProtectionPage;
