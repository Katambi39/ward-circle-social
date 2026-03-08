import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Eye, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  category: string;
  images: string[] | null;
  view_count: number;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  sold: "bg-accent/10 text-accent border-accent/20",
  paused: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

const ProfileListingsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  const fetchListings = async () => {
    const { data } = await supabase
      .from("listings")
      .select("id, title, price, status, category, images, view_count, created_at")
      .eq("seller_id", user!.id)
      .order("created_at", { ascending: false });
    setListings((data as Listing[]) || []);
    setLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(price);

  const filtered = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  const counts = {
    all: listings.length,
    active: listings.filter((l) => l.status === "active").length,
    sold: listings.filter((l) => l.status === "sold").length,
    paused: listings.filter((l) => l.status === "paused").length,
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {(["all", "active", "sold", "paused"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-display font-medium border transition-colors whitespace-nowrap ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-display">
            {listings.length === 0 ? "You haven't listed anything yet" : `No ${filter} listings`}
          </p>
          {listings.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/marketplace")}
              className="mt-3 rounded-xl font-display"
            >
              Go to Marketplace
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((listing) => (
            <button
              key={listing.id}
              onClick={() => navigate(`/marketplace/${listing.id}`)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors text-left"
            >
              <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-foreground truncate">{listing.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-display text-sm font-bold text-primary">{formatPrice(listing.price)}</span>
                  <Badge variant="outline" className={`text-[10px] rounded-full border ${STATUS_STYLES[listing.status] || ""}`}>
                    {listing.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {listing.view_count}</span>
                  <span>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileListingsTab;
