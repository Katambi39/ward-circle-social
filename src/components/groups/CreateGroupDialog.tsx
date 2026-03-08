import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { KENYA_COUNTIES, SAMPLE_WARDS } from "@/data/kenyaLocalities";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type GroupType = "ward" | "location" | "county" | "community" | "interest" | "page";

const CreateGroupDialog = ({ open, onOpenChange, onCreated }: CreateGroupDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("community");
  const [county, setCounty] = useState("");
  const [ward, setWard] = useState("");
  const [location, setLocation] = useState("");
  const [isLocalityRestricted, setIsLocalityRestricted] = useState(false);

  const isLocality = ["ward", "county", "location"].includes(groupType);

  const resetForm = () => {
    setName("");
    setDescription("");
    setGroupType("community");
    setCounty("");
    setWard("");
    setLocation("");
    setIsLocalityRestricted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    if (isLocality && !county) {
      toast({ title: "County required for locality groups", variant: "destructive" });
      return;
    }

    if (groupType === "ward" && !ward) {
      toast({ title: "Ward required for ward groups", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Check uniqueness for locality groups
      if (isLocality) {
        let query = supabase.from("groups").select("id").eq("group_type", groupType);
        if (county) query = query.eq("county", county);
        if (ward) query = query.eq("ward", ward);
        if (location && groupType === "location") query = query.eq("location", location);

        const { data: existing } = await query;
        if (existing && existing.length > 0) {
          toast({
            title: "Group already exists",
            description: `A ${groupType === "location" ? "constituency" : groupType} group for this locality already exists. Only one per locality is allowed.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { error } = await supabase.from("groups").insert({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        group_type: groupType,
        county: county || null,
        ward: ward || null,
        location: location || null,
        is_locality_restricted: isLocality ? true : isLocalityRestricted,
        created_by: user.id,
      });

      if (error) throw error;

      // Auto-join as admin
      const { data: newGroup } = await supabase
        .from("groups")
        .select("id")
        .eq("slug", slug)
        .single();

      if (newGroup) {
        await supabase.from("group_members").insert({
          group_id: newGroup.id,
          user_id: user.id,
          role: "admin" as const,
        });
      }

      toast({ title: "Group created!", description: `${name} is live.` });
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-display text-sm">Group Type</Label>
            <Select value={groupType} onValueChange={(v) => setGroupType(v as GroupType)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ward">Ward (one per ward)</SelectItem>
                <SelectItem value="county">County (one per county)</SelectItem>
                <SelectItem value="location">Constituency (one per constituency)</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="interest">Interest</SelectItem>
                <SelectItem value="page">Page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-display text-sm">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Westlands Ward Forum"
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-display text-sm">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="rounded-lg resize-none"
              rows={3}
            />
          </div>

          {(isLocality || isLocalityRestricted) && (
            <>
              <div className="space-y-2">
                <Label className="font-display text-sm">County</Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYA_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(groupType === "ward" || groupType === "location") && (
                <div className="space-y-2">
                  <Label className="font-display text-sm">Ward</Label>
                  <Select value={ward} onValueChange={setWard}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {(SAMPLE_WARDS[county] || []).map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {groupType === "location" && (
                <div className="space-y-2">
                  <Label className="font-display text-sm">Constituency</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter constituency name"
                    className="rounded-lg"
                  />
                </div>
              )}
            </>
          )}

          {!isLocality && (
            <div className="flex items-center justify-between">
              <Label className="font-display text-sm">Restrict to a locality?</Label>
              <Switch checked={isLocalityRestricted} onCheckedChange={setIsLocalityRestricted} />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full gradient-kenya text-primary-foreground font-display"
          >
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
