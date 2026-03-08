import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wallet, ArrowUpRight, ArrowDownRight, Plus, Minus,
  ShoppingCart, DollarSign, TrendingUp, Clock, CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
  listing_id: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  deposit: { label: "Deposit", icon: <Plus className="h-4 w-4" />, color: "text-primary" },
  withdrawal: { label: "Withdrawal", icon: <Minus className="h-4 w-4" />, color: "text-accent" },
  purchase: { label: "Purchase", icon: <ShoppingCart className="h-4 w-4" />, color: "text-accent" },
  sale: { label: "Sale", icon: <DollarSign className="h-4 w-4" />, color: "text-primary" },
  refund: { label: "Refund", icon: <ArrowDownRight className="h-4 w-4" />, color: "text-secondary" },
};

const WalletPage = () => {
  const { user, profile } = useAuth();
  const isVerified = profile?.verification_status === "verified";

  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  const fetchWallet = async () => {
    if (!user) return;

    // Ensure wallet exists
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      await supabase.from("wallets").insert({ user_id: user.id, balance: 0 } as any);
      setBalance(0);
    } else {
      setBalance(Number((wallet as any).balance));
    }

    // Fetch transactions
    const { data: txns } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTransactions((txns as Transaction[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchWallet(); }, [user]);

  const handleDeposit = async () => {
    if (!user || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setDepositing(true);
    try {
      // Update wallet
      await supabase
        .from("wallets")
        .update({ balance: balance + amount } as any)
        .eq("user_id", user.id);

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount,
        description: "Wallet deposit",
      } as any);

      setDepositOpen(false);
      setDepositAmount("");
      toast({ title: "Deposit successful!", description: `KES ${amount.toLocaleString()} added to your wallet.` });
      fetchWallet();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDepositing(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(price);

  const totalEarnings = transactions
    .filter(t => t.type === "sale" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalSpent = transactions
    .filter(t => t.type === "purchase" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="h-8 bg-muted rounded w-40 mb-2" />
            <div className="h-12 bg-muted rounded w-56" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-card border border-border rounded-2xl shadow-elevated"
        >
          <div className="gradient-kenya p-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-xs font-display">Konect Wallet</p>
                  <p className="text-primary-foreground text-xs font-display">Available Balance</p>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-primary-foreground/20" />
            </div>
            <p className="font-display text-4xl font-bold text-primary-foreground">{formatPrice(balance)}</p>
          </div>

          {/* Bottom pattern */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-[hsl(var(--kenya-gold))]" />

          {/* Actions */}
          <div className="p-4 flex gap-3">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 rounded-xl gradient-kenya text-primary-foreground font-display gap-1.5">
                  <Plus className="h-4 w-4" /> Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-display">Add Funds to Wallet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-muted-foreground">
                    This is a demo wallet. In production, this would integrate with M-Pesa or card payments.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Amount (KES)</Label>
                    <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="1000" className="rounded-lg text-lg font-display" min="1" />
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[500, 1000, 2500, 5000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(amt.toString())}
                        className="flex-1 py-2 rounded-lg border border-border text-sm font-display hover:bg-primary/10 hover:border-primary/30 transition-colors"
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleDeposit} disabled={depositing || !depositAmount} className="w-full rounded-xl gradient-kenya text-primary-foreground font-display">
                    {depositing ? "Processing..." : "Add Funds"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="flex-1 rounded-xl font-display gap-1.5" disabled>
              <Minus className="h-4 w-4" /> Withdraw
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-display">Total Earnings</span>
            </div>
            <p className="font-display text-lg font-bold text-primary">{formatPrice(totalEarnings)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-secondary" />
              <span className="text-xs text-muted-foreground font-display">Total Spent</span>
            </div>
            <p className="font-display text-lg font-bold text-secondary">{formatPrice(totalSpent)}</p>
          </motion.div>
        </div>

        {/* Transactions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Transaction History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-bold text-foreground text-sm mb-1">No transactions yet</p>
              <p className="text-xs text-muted-foreground">Your purchase and sale history will appear here.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-border">
                {transactions.map((txn) => {
                  const config = TYPE_CONFIG[txn.type] || TYPE_CONFIG.deposit;
                  const isCredit = txn.type === "sale" || txn.type === "deposit" || txn.type === "refund";
                  return (
                    <div key={txn.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isCredit ? "bg-primary/10" : "bg-accent/10"}`}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-bold text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {txn.description || format(new Date(txn.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-display font-bold text-sm ${isCredit ? "text-primary" : "text-accent"}`}>
                          {isCredit ? "+" : "-"}{formatPrice(Number(txn.amount))}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-display">
                          {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default WalletPage;
