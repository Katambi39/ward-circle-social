import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KENYA_COUNTIES } from "@/data/kenyaLocalities";
import {
  Plus, Search, Store, CheckCircle2, MapPin, Users, Star, Shield,
} from "lucide-react";
import { motion } from "framer-motion";

interface Page {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  avatar_url: string | null;
  cover_url: string | null;
  county: string | null;
  constituency: string | null;
  is_verified: boolean;
  follower_count: number;
  created_at: string;
}

const CATEGORIES = [
  { value: "business", label: "Business", icon: "🏪" },
  { value: "restaurant", label: "Restaurant & Food", icon: "🍽️" },
  { value: "tech", label: "Tech & Innovation", icon: "💻" },
  { value: "fashion", label: "Fashion & Beauty", icon: "👗" },
  { value: "health", label: "Health & Wellness", icon: "🏥" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "entertainment", label: "Entertainment", icon: "🎭" },
  { value: "ngo", label: "NGO & Non-Profit", icon: "🤝" },
  { value: "government", label: "Government & Public", icon: "🏛️" },
  { value: "other", label: "Other", icon: "📋" },
];

const PagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("business");
  const [newCounty, setNewCounty] = useState("");
  const [newConstituency, setNewConstituency] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPages = async () => {
    const { data } = await supabase
      .from("pages")
      .select("*")
      .order("follower_count", { ascending: false });
    setPages((data as Page[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      const { data, error } = await supabase.from("pages").insert({
        owner_id: user.id,
        name: newName.trim(),
        slug: slug + "-" + Date.now().toString(36),
        description: newDescription.trim() || null,
        category: newCategory,
        county: newCounty || null,
        constituency: newConstituency.trim() || null,
      } as any).select().single();
      if (error) throw error;
      toast({ title: "Page created!", description: `${newName} is now live.` });
      setCreateOpen(false);
      setNewName(""); setNewDescription(""); setNewCategory("business"); setNewCounty(""); setNewConstituency("");
      navigate(`/pages/${(data as any).slug}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const filtered = pages.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" /> Pages
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Discover businesses, brands & organizations</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
                <Plus className="h-4 w-4" /> Create Page
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" /> Create a Business Page
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-display">Page Name *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Mama Njeri's Kitchen" className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-display">Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-display">Description</Label>
                  <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Tell people about your business..." className="rounded-lg resize-none" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">County</Label>
                    <Select value={newCounty} onValueChange={setNewCounty}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {KENYA_COUNTIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Constituency</Label>
                    <Input value={newConstituency} onChange={(e) => setNewConstituency(e.target.value)} placeholder="e.g. Westlands" className="rounded-lg" />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full rounded-lg gradient-kenya text-primary-foreground font-display">
                  {creating ? "Creating..." : "Create Page"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search pages..." className="pl-9 rounded-xl" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Pages Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="h-28 bg-muted" />
                <div className="p-4"><div className="h-4 bg-muted rounded w-3/4 mb-2" /><div className="h-3 bg-muted rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-bold text-foreground text-lg mb-2">No pages found</h3>
            <p className="text-sm text-muted-foreground mb-4">Be the first to create a business page!</p>
            <Button onClick={() => setCreateOpen(true)} className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
              <Plus className="h-4 w-4" /> Create Page
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((page, i) => {
              const cat = CATEGORIES.find((c) => c.value === page.category);
              return (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/pages/${page.slug}`)}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all cursor-pointer group"
                >
                  <div className="h-24 relative">
                    {page.cover_url ? (
                      <img src={page.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full gradient-kenya" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-[hsl(var(--kenya-gold))]" />
                    <div className="absolute -bottom-6 left-4">
                      <div className="h-12 w-12 rounded-xl bg-card border-2 border-card overflow-hidden shadow-elevated">
                        {page.avatar_url ? (
                          <img src={page.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                            {page.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 px-4 pb-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-display font-bold text-foreground text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {page.name}
                        {page.is_verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </h3>
                      {cat && <span className="text-lg">{cat.icon}</span>}
                    </div>
                    {page.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{page.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {page.follower_count} followers
                      </span>
                      {page.county && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {page.county}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PagesPage;
