import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Smile, Search, Plus, Package, Upload, Loader2, X, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void;
}

interface StickerPack {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_official: boolean;
  sticker_count: number;
  download_count: number;
  creator_id: string | null;
}

interface Sticker {
  id: string;
  pack_id: string;
  name: string;
  image_url: string;
  emoji_tag: string | null;
}

const StickerPicker = ({ onSelect }: StickerPickerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [myPacks, setMyPacks] = useState<StickerPack[]>([]);
  const [allPacks, setAllPacks] = useState<StickerPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newPackName, setNewPackName] = useState("");
  const [uploadingSticker, setUploadingSticker] = useState(false);
  const [myPackIds, setMyPackIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && user) {
      fetchMyPacks();
      fetchAllPacks();
    }
  }, [open, user]);

  const fetchMyPacks = async () => {
    if (!user) return;
    const { data: userPacks } = await supabase
      .from("user_sticker_packs")
      .select("pack_id")
      .eq("user_id", user.id);
    
    const packIds = (userPacks || []).map((up: any) => up.pack_id);
    setMyPackIds(new Set(packIds));

    if (packIds.length > 0) {
      const { data: packs } = await supabase
        .from("sticker_packs")
        .select("*")
        .in("id", packIds);
      setMyPacks((packs as StickerPack[]) || []);
      if (!selectedPack && packs && packs.length > 0) {
        setSelectedPack(packs[0].id);
      }
    }
  };

  const fetchAllPacks = async () => {
    const { data } = await supabase
      .from("sticker_packs")
      .select("*")
      .eq("is_public", true)
      .order("download_count", { ascending: false });
    setAllPacks((data as StickerPack[]) || []);
  };

  useEffect(() => {
    if (selectedPack) {
      fetchStickers(selectedPack);
    }
  }, [selectedPack]);

  const fetchStickers = async (packId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("stickers")
      .select("*")
      .eq("pack_id", packId);
    setStickers((data as Sticker[]) || []);
    setLoading(false);
  };

  const addPack = async (packId: string) => {
    if (!user) return;
    await supabase.from("user_sticker_packs").insert({ user_id: user.id, pack_id: packId } as any);
    setMyPackIds(prev => new Set([...prev, packId]));
    fetchMyPacks();
    toast({ title: "Sticker pack added!" });
  };

  const removePack = async (packId: string) => {
    if (!user) return;
    await supabase.from("user_sticker_packs").delete().eq("user_id", user.id).eq("pack_id", packId);
    setMyPackIds(prev => { const n = new Set(prev); n.delete(packId); return n; });
    setMyPacks(prev => prev.filter(p => p.id !== packId));
    if (selectedPack === packId) setSelectedPack(myPacks[0]?.id || null);
    toast({ title: "Pack removed" });
  };

  const createPack = async () => {
    if (!user || !newPackName.trim()) return;
    const { data, error } = await supabase.from("sticker_packs").insert({
      name: newPackName.trim(),
      creator_id: user.id,
      is_official: false,
      is_public: true,
    } as any).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Auto-add to own collection
    await supabase.from("user_sticker_packs").insert({ user_id: user.id, pack_id: (data as any).id } as any);
    setNewPackName("");
    setCreateOpen(false);
    fetchMyPacks();
    fetchAllPacks();
    toast({ title: "Pack created!" });
  };

  const uploadSticker = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedPack) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Only images allowed", variant: "destructive" });
      return;
    }
    if (file.size > 512 * 1024) {
      toast({ title: "Max 512KB per sticker", variant: "destructive" });
      return;
    }
    setUploadingSticker(true);
    try {
      const path = `${user.id}/${selectedPack}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("stickers").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("stickers").getPublicUrl(path);
      await supabase.from("stickers").insert({
        pack_id: selectedPack,
        name: file.name.replace(/\.[^.]+$/, ""),
        image_url: urlData.publicUrl,
      } as any);
      fetchStickers(selectedPack);
      toast({ title: "Sticker added!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingSticker(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredStickers = searchQuery
    ? stickers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.emoji_tag?.includes(searchQuery))
    : stickers;

  const isMyPack = selectedPack ? (myPacks.find(p => p.id === selectedPack)?.creator_id === user?.id) : false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full shrink-0 text-muted-foreground hover:text-primary">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <Tabs defaultValue="stickers" className="w-full">
          <div className="flex items-center justify-between px-3 pt-3">
            <TabsList className="h-8">
              <TabsTrigger value="stickers" className="text-xs">My Stickers</TabsTrigger>
              <TabsTrigger value="store" className="text-xs">Store</TabsTrigger>
            </TabsList>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Create Sticker Pack</DialogTitle></DialogHeader>
                <Input value={newPackName} onChange={e => setNewPackName(e.target.value)} placeholder="Pack name" />
                <Button onClick={createPack} disabled={!newPackName.trim()} className="gradient-kenya text-primary-foreground">Create</Button>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="stickers" className="m-0">
            {/* Pack selector */}
            <div className="flex gap-1 px-3 py-2 overflow-x-auto">
              {myPacks.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-display transition-colors ${
                    selectedPack === pack.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {pack.name}
                </button>
              ))}
              {myPacks.length === 0 && (
                <p className="text-xs text-muted-foreground px-2">No packs yet. Browse the store or create one!</p>
              )}
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search stickers..." className="h-8 pl-8 text-xs rounded-lg" />
              </div>
            </div>

            {/* Stickers grid */}
            <ScrollArea className="h-48">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStickers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Package className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {selectedPack ? "No stickers in this pack yet" : "Select a pack"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1 p-3">
                  {filteredStickers.map(sticker => (
                    <button
                      key={sticker.id}
                      onClick={() => { onSelect(sticker.image_url); setOpen(false); }}
                      className="aspect-square rounded-lg hover:bg-muted p-1 transition-colors"
                    >
                      <img src={sticker.image_url} alt={sticker.name} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Upload button for own packs */}
            {isMyPack && (
              <div className="p-2 border-t border-border">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadSticker} />
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadingSticker}>
                  {uploadingSticker ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  Upload Sticker
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="store" className="m-0">
            <ScrollArea className="h-64">
              <div className="p-3 space-y-2">
                {allPacks.map(pack => (
                  <div key={pack.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {pack.cover_url ? (
                        <img src={pack.cover_url} alt="" className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-bold text-foreground truncate">
                        {pack.name}
                        {pack.is_official && <span className="ml-1 text-primary text-[10px]">✓ Official</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{pack.sticker_count} stickers • {pack.download_count} downloads</p>
                    </div>
                    {myPackIds.has(pack.id) ? (
                      <Button variant="outline" size="sm" className="text-xs h-7 rounded-lg text-destructive" onClick={() => removePack(pack.id)}>
                        Remove
                      </Button>
                    ) : (
                      <Button size="sm" className="text-xs h-7 rounded-lg gradient-kenya text-primary-foreground" onClick={() => addPack(pack.id)}>
                        Add
                      </Button>
                    )}
                  </div>
                ))}
                {allPacks.length === 0 && (
                  <div className="text-center py-8">
                    <Store className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No packs available yet. Be the first to create one!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default StickerPicker;
