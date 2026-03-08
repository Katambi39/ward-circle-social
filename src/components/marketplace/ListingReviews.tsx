import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Review {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  buyer_profile?: {
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
}

interface Props {
  listingId: string;
  sellerId: string;
  isSold: boolean;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => onRate?.(i)}
        className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
      >
        <Star className={`h-4 w-4 ${i <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const ListingReviews = ({ listingId, sellerId, isSold }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) checkCanReview();
  }, [listingId, user]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("listing_reviews")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (!data) return;

    // Fetch buyer profiles
    const buyerIds = [...new Set(data.map((r: any) => r.buyer_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username")
      .in("user_id", buyerIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setReviews(
      data.map((r: any) => ({ ...r, buyer_profile: profileMap.get(r.buyer_id) }))
    );
  };

  const checkCanReview = async () => {
    if (!user) return;
    // Check if user purchased this listing
    const { data: tx } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .eq("type", "purchase")
      .eq("status", "completed")
      .maybeSingle();

    if (!tx) return;

    // Check if already reviewed
    const { data: existing } = await supabase
      .from("listing_reviews")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    setCanReview(true);
    setHasReviewed(!!existing);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("listing_reviews").insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
        rating,
        content: content.trim() || null,
      } as any);
      if (error) throw error;
      toast({ title: "Review submitted! ⭐" });
      setShowForm(false);
      setContent("");
      setHasReviewed(true);
      fetchReviews();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Reviews
          {reviews.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({reviews.length})</span>
          )}
        </h3>
        {avgRating && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-display font-bold text-sm text-foreground">{avgRating}</span>
          </div>
        )}
      </div>

      {/* Review form for buyers */}
      {canReview && !hasReviewed && (
        <>
          {!showForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="rounded-xl font-display w-full"
            >
              Write a Review
            </Button>
          ) : (
            <div className="space-y-3 bg-muted/30 rounded-xl p-4 border border-border">
              <p className="text-sm font-display font-medium text-foreground">Rate your experience</p>
              <StarRating rating={rating} onRate={setRating} interactive />
              <Textarea
                placeholder="Share your experience (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="rounded-xl text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={submitting} size="sm" className="rounded-xl gradient-kenya text-primary-foreground font-display">
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="rounded-xl font-display">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {hasReviewed && (
        <p className="text-xs text-muted-foreground font-display">✅ You've reviewed this listing</p>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                {review.buyer_profile?.avatar_url ? (
                  <img src={review.buyer_profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground text-xs font-display font-bold">
                    {review.buyer_profile?.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-display font-bold text-foreground">
                    {review.buyer_profile?.display_name || "User"}
                  </span>
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </span>
                </div>
                {review.content && (
                  <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ListingReviews;
