import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { KENYA_COUNTIES } from "@/data/kenyaLocalities";
import { ImagePlus, X, Pencil } from "lucide-react";

const CATEGORIES = [
  { value: "products", label: "Products", emoji: "📦" },
  { value: "services", label: "Services", emoji: "🛠️" },
  { value: "digital", label: "Digital", emoji: "💾" },
  { value: "property", label: "Property & Vehicles", emoji: "🏠" },
];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];
const STATUSES = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

interface EditListingDialogProps {
  listing: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    price: number;
    images: string[];
    county: string | null;
    constituency: string | null;
    condition: string | null;
    is_negotiable: boolean;
    status: string;
  };
  onUpdated: () => void;
}

const EditListingDialog = ({ listing, onUpdated }: EditListingDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description || "");
  const [category, setCategory] = useState(listing.category);
  const [price, setPrice] = useState(String(listing.price));
  const [condition, setCondition] = useState(listing.condition || "");
  const [county, setCounty] = useState(listing.county || "");
  const [constituency, setConstituency] = useState(listing.constituency || "");
  const [isNegotiable, setIsNegotiable] = useState(listing.is_negotiable);
  const [status, setStatus] = useState(listing.status);
  const [existingImages, setExistingImages] = useState<string[]>(listing.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalImages = existingImages.length + newFiles.length;

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (totalImages + files.length > 5) {
      toast({ title: "Max 5 images", variant: "destructive" });
      return;
    }
    const added = [...newFiles, ...files].slice(0, 5 - existingImages.length);
    setNewFiles(added);
    setNewPreviews(added.map(f => URL.createObjectURL(f)));
  };

  const removeExisting = (i: number) => setExistingImages(prev => prev.filter((_, idx) => idx !== i));
  const removeNew = (i: number) => {
    setNewFiles(prev => prev.filter((_, idx) => idx !== i));
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!title.trim() || !price) return;
    setSaving(true);
    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("listing-images").upload(path, file, { contentType: file.type });
        if (!error) {
          const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const allImages = [...existingImages, ...uploadedUrls];

      const { error } = await supabase.from("listings").update({
        title: title.trim(),
        description: description.trim() || null,
        category,
        price: parseFloat(price),
        condition: condition || null,
        county: county || null,
        constituency: constituency.trim() || null,
        is_negotiable: isNegotiable,
        status,
        images: allImages,
      } as any).eq("id", listing.id);

      if (error) throw error;
      toast({ title: "Listing updated! ✅" });
      setOpen(false);
      onUpdated();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="rounded-xl font-display gap-1.5">
        <Pencil className="h-4 w-4" /> Edit Listing
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-display">Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-display">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-display">Price (KES) *</Label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="rounded-lg" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-display">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-display">Price is negotiable</Label>
              <Switch checked={isNegotiable} onCheckedChange={setIsNegotiable} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-display">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-display">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} className="rounded-lg resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-display">County</Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {KENYA_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-display">Constituency</Label>
                <Input value={constituency} onChange={e => setConstituency(e.target.value)} className="rounded-lg" />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-1.5">
              <Label className="text-xs font-display">Photos (max 5)</Label>
              <div className="flex gap-2 flex-wrap">
                {existingImages.map((src, i) => (
                  <div key={`ex-${i}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeExisting(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-foreground/60 flex items-center justify-center">
                      <X className="h-3 w-3 text-background" />
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative h-20 w-20 rounded-lg overflow-hidden border border-primary/40">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeNew(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-foreground/60 flex items-center justify-center">
                      <X className="h-3 w-3 text-background" />
                    </button>
                  </div>
                ))}
                {totalImages < 5 && (
                  <button onClick={() => fileRef.current?.click()} className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <ImagePlus className="h-5 w-5" />
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
            </div>

            <Button onClick={handleSave} disabled={saving || !title.trim() || !price} className="w-full rounded-lg gradient-kenya text-primary-foreground font-display">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditListingDialog;
