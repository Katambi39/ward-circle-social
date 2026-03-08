import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, FileText, Users, Store, ShoppingBag, Loader2, CheckCircle2, MapPin, Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = searchParams.get("tab") || "posts";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Update URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (tab !== "posts") params.tab = tab;
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, tab]);

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPosts([]); setPeople([]); setPages([]); setListings([]);
      return;
    }
    searchAll(debouncedQuery.trim());
  }, [debouncedQuery]);

  const searchAll = useCallback(async (q: string) => {
    setLoading(true);
    const pattern = `%${q}%`;

    const [postsRes, peopleRes, pagesRes, listingsRes] = await Promise.all([
      supabase.from("posts").select("id, title, content, image_url, upvotes, comment_count, created_at, user_id, is_anonymous")
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("user_id, display_name, username, avatar_url, verification_status, county, bio")
        .or(`display_name.ilike.${pattern},username.ilike.${pattern},bio.ilike.${pattern}`)
        .limit(20),
      supabase.from("pages").select("id, slug, name, description, category, avatar_url, county, follower_count, is_verified")
        .or(`name.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
        .limit(20),
      supabase.from("listings").select("id, title, description, price, category, images, status, county, view_count, created_at")
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .eq("status", "active")
        .order("created_at", { ascending: false }).limit(20),
    ]);

    setPosts(postsRes.data || []);
    setPeople(peopleRes.data || []);
    setPages(pagesRes.data || []);
    setListings(listingsRes.data || []);
    setLoading(false);
  }, []);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(p);

  const totalResults = posts.length + people.length + pages.length + listings.length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, people, pages, marketplace..."
            className="pl-9 rounded-full bg-muted border-none h-11 font-display"
            autoFocus
          />
        </div>

        {debouncedQuery && !loading && (
          <p className="text-xs text-muted-foreground font-display mb-3">
            {totalResults} result{totalResults !== 1 ? "s" : ""} for "<span className="text-foreground font-medium">{debouncedQuery}</span>"
          </p>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-card border border-border rounded-xl p-1 shadow-card mb-4">
            <TabsTrigger value="posts" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <FileText className="h-3.5 w-3.5" /> Posts {posts.length > 0 && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 rounded-full">{posts.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="people" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <Users className="h-3.5 w-3.5" /> People {people.length > 0 && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 rounded-full">{people.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <Store className="h-3.5 w-3.5" /> Pages {pages.length > 0 && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 rounded-full">{pages.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <ShoppingBag className="h-3.5 w-3.5" /> Market {listings.length > 0 && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 rounded-full">{listings.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !debouncedQuery.trim() ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-display text-muted-foreground">Start typing to search across Conect</p>
            </div>
          ) : (
            <>
              {/* Posts */}
              <TabsContent value="posts" className="mt-0 space-y-2">
                {posts.length === 0 ? (
                  <EmptyState label="posts" />
                ) : posts.map((p, i) => (
                  <ResultCard key={p.id} index={i} onClick={() => navigate("/")}>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-foreground truncate"><Highlight text={p.title} query={debouncedQuery} /></p>
                      {p.content && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5"><Highlight text={p.content} query={debouncedQuery} /></p>}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>▲ {p.upvotes}</span>
                        <span>💬 {p.comment_count}</span>
                        <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {p.image_url && <img src={p.image_url} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />}
                  </ResultCard>
                ))}
              </TabsContent>

              {/* People */}
              <TabsContent value="people" className="mt-0 space-y-2">
                {people.length === 0 ? (
                  <EmptyState label="people" />
                ) : people.map((p, i) => (
                  <ResultCard key={p.user_id} index={i} onClick={() => navigate("/profile")}>
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                          {p.display_name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-foreground flex items-center gap-1">
                        <Highlight text={p.display_name} query={debouncedQuery} />
                        {p.verification_status === "verified" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground">@<Highlight text={p.username} query={debouncedQuery} /></p>
                      {p.county && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin className="h-3 w-3" /> {p.county}</p>}
                    </div>
                  </ResultCard>
                ))}
              </TabsContent>

              {/* Pages */}
              <TabsContent value="pages" className="mt-0 space-y-2">
                {pages.length === 0 ? (
                  <EmptyState label="pages" />
                ) : pages.map((p, i) => (
                  <ResultCard key={p.id} index={i} onClick={() => navigate(`/pages/${p.slug}`)}>
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                          {p.name?.[0]?.toUpperCase() || "P"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-foreground flex items-center gap-1">
                        <Highlight text={p.name} query={debouncedQuery} />
                        {p.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.category} • {p.follower_count} followers</p>
                      {p.county && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin className="h-3 w-3" /> {p.county}</p>}
                    </div>
                  </ResultCard>
                ))}
              </TabsContent>

              {/* Listings */}
              <TabsContent value="listings" className="mt-0 space-y-2">
                {listings.length === 0 ? (
                  <EmptyState label="listings" />
                ) : listings.map((l, i) => (
                  <ResultCard key={l.id} index={i} onClick={() => navigate(`/marketplace/${l.id}`)}>
                    <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {l.images && l.images.length > 0 ? (
                        <img src={l.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground/20" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-foreground truncate"><Highlight text={l.title} query={debouncedQuery} /></p>
                      <p className="font-display text-sm font-bold text-primary">{formatPrice(l.price)}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {l.view_count}</span>
                        {l.county && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {l.county}</span>}
                      </div>
                    </div>
                  </ResultCard>
                ))}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim() || !text) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const ResultCard = ({ children, index, onClick }: { children: React.ReactNode; index: number; onClick: () => void }) => (
  <motion.button
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    onClick={onClick}
    className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors text-left"
  >
    {children}
  </motion.button>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="text-center py-10">
    <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
    <p className="text-sm text-muted-foreground font-display">No {label} found</p>
  </div>
);

export default SearchPage;
