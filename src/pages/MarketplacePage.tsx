import { useState, useEffect, useRef } from "react";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KENYA_COUNTIES } from "@/data/kenyaLocalities";
import {
  Plus, Search, ShoppingBag, MapPin, Heart, Eye, Tag,
  Package, Briefcase, FileText, Home, ImagePlus, X, Wallet, User, Trash2, Pause, Play,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Listing {
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
  seller?: { display_name: string; avatar_url: string | null; verification_status: string };
}

const CATEGORIES = [
  { value: "products", label: "Products", icon: <Package className="h-4 w-4" />, emoji: "📦" },
  { value: "services", label: "Services", icon: <Briefcase className="h-4 w-4" />, emoji: "🛠️" },
  { value: "digital", label: "Digital", icon: <FileText className="h-4 w-4" />, emoji: "💾" },
  { value: "property", label: "Property & Vehicles", icon: <Home className="h-4 w-4" />, emoji: "🏠" },
];

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];

const MarketplacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [mainTab, setMainTab] = useState("browse");
  const [createOpen, setCreateOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favListings, setFavListings] = useState<Listing[]>([]);

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("products");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [county, setCounty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchListings = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const sellerIds = [...new Set((data as any[]).map(l => l.seller_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, verification_status")
        .in("user_id", sellerIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setListings((data as any[]).map(l => ({ ...l, seller: profileMap.get(l.seller_id) })));
    } else {
      setListings([]);
    }

    // Fetch user's favorites
    if (user) {
      const { data: favs } = await supabase
        .from("listing_favorites")
        .select("listing_id")
        .eq("user_id", user.id);
      const favIds = (favs || []).map((f: any) => f.listing_id);
      setFavorites(new Set(favIds));

      // Fetch full favorite listings
      if (favIds.length > 0) {
        const { data: favData } = await supabase
          .from("listings")
          .select("*")
          .in("id", favIds)
          .order("created_at", { ascending: false });
        if (favData && favData.length > 0) {
          const sellerIds2 = [...new Set((favData as any[]).map(l => l.seller_id))];
          const { data: profiles2 } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, verification_status")
            .in("user_id", sellerIds2);
          const profileMap2 = new Map((profiles2 || []).map((p: any) => [p.user_id, p]));
          setFavListings((favData as any[]).map(l => ({ ...l, seller: profileMap2.get(l.seller_id) })));
        } else {
          setFavListings([]);
        }
      } else {
        setFavListings([]);
      }
    }

    // Fetch user's own listings (all statuses)
    if (user) {
      const { data: mine } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      setMyListings((mine as Listing[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [user]);

  const handleDeleteListing = async (listingId: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing deleted" });
      fetchListings();
    }
  };

  const handleToggleStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const { error } = await supabase.from("listings").update({ status: newStatus } as any).eq("id", listingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "active" ? "Listing reactivated" : "Listing paused" });
      fetchListings();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 5) {
      toast({ title: "Max 5 images", variant: "destructive" });
      return;
    }
    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleCreate = async () => {
    if (!user || !title.trim() || !price) return;
    setCreating(true);
    try {
      // Upload images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { contentType: file.type });
        if (!error) {
          const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const { data, error } = await supabase.from("listings").insert({
        seller_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        price: parseFloat(price),
        images: uploadedUrls,
        county: county || null,
        constituency: constituency.trim() || null,
        condition: condition || null,
        is_negotiable: isNegotiable,
      } as any).select().single();

      if (error) throw error;
      toast({ title: "Listing created!", description: "Your item is now live." });
      setCreateOpen(false);
      resetForm();
      navigate(`/marketplace/${(data as any).id}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("products"); setPrice("");
    setCondition(""); setCounty(""); setConstituency(""); setIsNegotiable(false);
    setImageFiles([]); setImagePreviews([]);
  };

  const toggleFavorite = async (listingId: string) => {
    if (!user) return;
    if (favorites.has(listingId)) {
      await supabase.from("listing_favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
      setFavorites(prev => { const n = new Set(prev); n.delete(listingId); return n; });
    } else {
      await supabase.from("listing_favorites").insert({ user_id: user.id, listing_id: listingId } as any);
      setFavorites(prev => new Set(prev).add(listingId));
    }
  };

  const filtered = listings.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || l.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(price);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" /> Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Buy & sell locally in Kenya</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/wallet")} className="rounded-full font-display gap-1.5">
              <Wallet className="h-4 w-4" /> Wallet
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
                  <Plus className="h-4 w-4" /> Sell
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" /> Create Listing
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Title *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you selling?" className="rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (<SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">Price (KES) *</Label>
                      <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="rounded-lg" min="0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">Condition</Label>
                      <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-display">Price is negotiable</Label>
                    <Switch checked={isNegotiable} onCheckedChange={setIsNegotiable} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your item..." className="rounded-lg resize-none" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">County</Label>
                      <Select value={county} onValueChange={setCounty}>
                        <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {KENYA_COUNTIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">Constituency</Label>
                      <Input value={constituency} onChange={(e) => setConstituency(e.target.value)} placeholder="e.g. Westlands" className="rounded-lg" />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Photos (max 5)</Label>
                    <div className="flex gap-2 flex-wrap">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                          <img src={src} alt="" className="h-full w-full object-cover" />
                          <button onClick={() => removeImage(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-foreground/60 flex items-center justify-center">
                            <X className="h-3 w-3 text-background" />
                          </button>
                        </div>
                      ))}
                      {imageFiles.length < 5 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <ImagePlus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  </div>

                  <Button onClick={handleCreate} disabled={creating || !title.trim() || !price} className="w-full rounded-lg gradient-kenya text-primary-foreground font-display">
                    {creating ? "Creating..." : "Post Listing"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Tabs: Browse / My Listings */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-4">
          <TabsList className="w-full bg-card border border-border rounded-xl p-1 shadow-card">
            <TabsTrigger value="browse" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <ShoppingBag className="h-3.5 w-3.5" /> Browse
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <User className="h-3.5 w-3.5" /> My Listings {myListings.length > 0 && `(${myListings.length})`}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <Heart className="h-3.5 w-3.5" /> Saved {favListings.length > 0 && `(${favListings.length})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mainTab === "browse" && (<>
        {/* Category Tabs */}
        <Tabs value={filterCategory} onValueChange={setFilterCategory} className="mb-4">
          <TabsList className="w-full bg-card border border-border rounded-xl p-1 shadow-card">
            <TabsTrigger value="all" className="flex-1 rounded-lg font-display text-xs data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              All
            </TabsTrigger>
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.value} value={c.value} className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
                <span className="hidden sm:inline">{c.emoji}</span> {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search marketplace..." className="pl-9 rounded-xl" />
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="h-36 bg-muted" />
                <div className="p-3"><div className="h-4 bg-muted rounded w-3/4 mb-2" /><div className="h-5 bg-muted rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-bold text-foreground text-lg mb-2">No listings found</h3>
            <p className="text-sm text-muted-foreground mb-4">Be the first to sell something!</p>
            <Button onClick={() => setCreateOpen(true)} className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
              <Plus className="h-4 w-4" /> Post Listing
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {filtered.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all cursor-pointer group"
                onClick={() => navigate(`/marketplace/${listing.id}`)}
              >
                {/* Image */}
                <div className="h-36 relative bg-muted">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Favorite button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center border border-border"
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(listing.id) ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                  </button>
                  {listing.is_negotiable && (
                    <Badge className="absolute bottom-2 left-2 bg-secondary/90 text-secondary-foreground text-[10px] rounded-full">Negotiable</Badge>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-display font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <p className="font-display font-bold text-primary text-lg mt-0.5">
                    {formatPrice(listing.price)}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                    {listing.county && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {listing.county}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" /> {listing.view_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </>)}

        {/* My Listings Tab */}
        {mainTab === "mine" && (
          <div>
            {myListings.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground text-lg mb-2">No listings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start selling by creating your first listing!</p>
                <Button onClick={() => { setCreateOpen(true); setMainTab("browse"); }} className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
                  <Plus className="h-4 w-4" /> Post Listing
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.map((listing, i) => {
                  const statusColors: Record<string, string> = {
                    active: "bg-primary/10 text-primary border-primary/20",
                    paused: "bg-muted text-muted-foreground border-border",
                    sold: "bg-accent/10 text-accent border-accent/20",
                    removed: "bg-destructive/10 text-destructive border-destructive/20",
                  };
                  return (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-card border border-border rounded-xl shadow-card overflow-hidden flex"
                    >
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 bg-muted shrink-0 cursor-pointer"
                        onClick={() => navigate(`/marketplace/${listing.id}`)}
                      >
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className="font-display font-bold text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate(`/marketplace/${listing.id}`)}
                            >
                              {listing.title}
                            </h3>
                            <Badge variant="outline" className={`text-[10px] rounded-full shrink-0 ${statusColors[listing.status] || ""}`}>
                              {listing.status}
                            </Badge>
                          </div>
                          <p className="font-display font-bold text-primary text-sm mt-0.5">{formatPrice(listing.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Eye className="h-3 w-3" /> {listing.view_count}
                          </span>
                          <div className="flex-1" />
                          {listing.status !== "sold" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 rounded-full text-xs font-display gap-1 text-muted-foreground"
                              onClick={() => handleToggleStatus(listing.id, listing.status)}
                            >
                              {listing.status === "active" ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Activate</>}
                            </Button>
                          )}
                          {listing.status !== "sold" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 rounded-full text-xs font-display gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteListing(listing.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {mainTab === "favorites" && (
          <div>
            {favListings.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground text-lg mb-2">No saved listings</h3>
                <p className="text-sm text-muted-foreground mb-4">Tap the heart icon on any listing to save it here.</p>
                <Button onClick={() => setMainTab("browse")} className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
                  <ShoppingBag className="h-4 w-4" /> Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                {favListings.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all cursor-pointer group"
                    onClick={() => navigate(`/marketplace/${listing.id}`)}
                  >
                    <div className="h-36 relative bg-muted">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center border border-border"
                      >
                        <Heart className={`h-4 w-4 ${favorites.has(listing.id) ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                      </button>
                      {listing.status === "sold" && (
                        <Badge className="absolute bottom-2 left-2 bg-accent/90 text-accent-foreground text-[10px] rounded-full">Sold</Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-display font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <p className="font-display font-bold text-primary text-lg mt-0.5">
                        {formatPrice(listing.price)}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                        {listing.county && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" /> {listing.county}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-3 w-3" /> {listing.view_count}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MarketplacePage;
