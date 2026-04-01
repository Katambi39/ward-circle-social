import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import StartChatButton from "@/components/messages/StartChatButton";
import ListingReviews from "@/components/marketplace/ListingReviews";
import EditListingDialog from "@/components/marketplace/EditListingDialog";
import {
  ArrowLeft, MapPin, Heart, Eye, Shield, CheckCircle2,
  ShoppingBag, Tag, Clock, ShoppingCart, AlertCircle, Trash2, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

interface ListingDetail {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  images: string[];
  location: string | null;
  county: string | null;
  constituency: string | null;
  condition: string | null;
  is_negotiable: boolean;
  status: string;
  view_count: number;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  products: "📦 Product",
  services: "🛠️ Service",
  digital: "💾 Digital",
  property: "🏠 Property",
};

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) fetchListing();
  }, [id, user]);

  const fetchListing = async () => {
    const { data } = await supabase.from("listings").select("*").eq("id", id!).single();
    if (!data) { setLoading(false); return; }
    setListing(data as unknown as ListingDetail);

    // Fetch seller profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, verification_status, county")
      .eq("user_id", (data as any).seller_id)
      .single();
    setSeller(profile);

    // Track view
    if (user && user.id !== (data as any).seller_id) {
      await supabase.from("listings").update({ view_count: ((data as any).view_count || 0) + 1 } as any).eq("id", id!);
    }

    // Check favorite
    if (user) {
      const { data: fav } = await supabase
        .from("listing_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", id!)
        .maybeSingle();
      setIsFavorited(!!fav);

      // Fetch wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      setWalletBalance(wallet ? Number((wallet as any).balance) : 0);
    }

    setLoading(false);
  };

  const toggleFavorite = async () => {
    if (!user || !listing) return;
    if (isFavorited) {
      await supabase.from("listing_favorites").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setIsFavorited(false);
    } else {
      await supabase.from("listing_favorites").insert({ user_id: user.id, listing_id: listing.id } as any);
      setIsFavorited(true);
    }
  };

  const handleBuy = async () => {
    if (!user || !listing) return;
    setBuying(true);
    try {
      const { data, error } = await supabase.rpc("process_purchase", {
        _buyer_id: user.id,
        _seller_id: listing.seller_id,
        _listing_id: listing.id,
        _amount: listing.price,
      });
      if (error) throw error;
      const result = data as any;
      if (result.success) {
        toast({ title: "Purchase complete! 🎉", description: "Funds held in escrow for 72 hours for your protection." });
        setBuyDialogOpen(false);
        fetchListing();
      } else {
        toast({ title: "Purchase failed", description: result.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBuying(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
            <div className="h-72 bg-muted" />
            <div className="p-6"><div className="h-6 bg-muted rounded w-3/4 mb-3" /><div className="h-8 bg-muted rounded w-1/3" /></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!listing) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Listing not found</h2>
          <Button variant="outline" onClick={() => navigate("/marketplace")} className="rounded-full font-display gap-1.5 mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isOwner = user?.id === listing.seller_id;
  const isSold = listing.status === "sold";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")} className="rounded-full font-display gap-1 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" /> Marketplace
        </Button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          {/* Image Gallery */}
          {listing.images && listing.images.length > 0 ? (
            <div>
              <div className="h-72 sm:h-80 relative bg-muted">
                <img src={listing.images[selectedImage]} alt="" className="h-full w-full object-cover" />
                {isSold && (
                  <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                    <Badge className="bg-accent text-accent-foreground text-lg font-display px-6 py-2 rounded-full">SOLD</Badge>
                  </div>
                )}
                <button
                  onClick={toggleFavorite}
                  className="absolute top-3 right-3 h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center border border-border"
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                </button>
              </div>
              {listing.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                  {listing.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        i === selectedImage ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 bg-muted flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Details */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">{listing.title}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs font-display rounded-full">
                    {CATEGORY_LABELS[listing.category] || listing.category}
                  </Badge>
                  {listing.condition && (
                    <Badge variant="outline" className="text-xs font-display rounded-full">{listing.condition}</Badge>
                  )}
                  {listing.is_negotiable && (
                    <Badge className="bg-secondary/10 text-secondary text-xs font-display rounded-full border border-secondary/20">Negotiable</Badge>
                  )}
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-primary whitespace-nowrap">{formatPrice(listing.price)}</p>
            </div>

            {listing.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
            )}

            {/* Meta */}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {listing.county && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {listing.constituency ? `${listing.constituency}, ` : ""}{listing.county}</span>
              )}
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {listing.view_count} views</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</span>
            </div>

            {/* Owner Actions */}
            {isOwner && !isSold && (
              <div className="mt-5 flex items-center gap-3">
                <EditListingDialog listing={listing} onUpdated={fetchListing} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl font-display gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display">Delete listing?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently remove "{listing.title}" from the marketplace. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full font-display">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-full font-display bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          const { error } = await supabase.from("listings").delete().eq("id", listing.id);
                          if (error) {
                            toast({ title: "Error", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: "Listing deleted" });
                            navigate("/marketplace");
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Buyer Actions */}
            {!isOwner && !isSold && (
              <div className="mt-5 flex items-center gap-3">
                <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 rounded-xl gradient-kenya text-primary-foreground font-display gap-1.5">
                      <ShoppingCart className="h-4 w-4" /> Buy Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="font-display">Confirm Purchase</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="font-display font-bold text-foreground text-sm">{listing.title}</p>
                        <p className="font-display text-xl font-bold text-primary mt-1">{formatPrice(listing.price)}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-display">Your wallet balance</span>
                        <span className="font-display font-bold text-foreground">{formatPrice(walletBalance)}</span>
                      </div>
                        <div className="flex items-start gap-2 text-xs bg-primary/5 rounded-lg p-3 border border-primary/20 text-muted-foreground">
                          <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Your funds will be held in escrow for 72 hours for buyer protection. <a href="/buyer-protection" className="text-primary underline">Learn more</a></span>
                        </div>
                        {walletBalance < listing.price && (
                        <div className="flex items-center gap-2 text-accent text-xs bg-accent/5 rounded-lg p-3 border border-accent/20">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>Insufficient balance. Add funds to your wallet first.</span>
                        </div>
                        )}
                      <div className="flex gap-2">
                        {walletBalance < listing.price ? (
                          <Button onClick={() => navigate("/wallet")} className="flex-1 rounded-xl gradient-kenya text-primary-foreground font-display">
                            Go to Wallet
                          </Button>
                        ) : (
                          <Button onClick={handleBuy} disabled={buying} className="flex-1 rounded-xl gradient-kenya text-primary-foreground font-display">
                            {buying ? "Processing..." : "Confirm Purchase"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <StartChatButton targetUserId={listing.seller_id} label="Chat with Seller" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Seller Info */}
        {seller && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card flex items-center gap-3"
          >
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {seller.avatar_url ? (
                <img src={seller.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold">
                  {seller.display_name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              {seller.verification_status === "verified" && (
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-sm text-foreground flex items-center gap-1">
                {seller.display_name}
                {seller.verification_status === "verified" && <Shield className="h-3.5 w-3.5 text-primary" />}
              </p>
              <p className="text-xs text-muted-foreground">@{seller.username}</p>
            </div>
            {!isOwner && <StartChatButton targetUserId={seller.user_id} variant="ghost" size="sm" label="Message" />}
          </motion.div>
        )}

        {/* Reviews */}
        <ListingReviews listingId={listing.id} sellerId={listing.seller_id} isSold={isSold} />
      </div>
    </AppLayout>
  );
};

export default ListingDetailPage;
