import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Eye, EyeOff, MapPin, Users, Globe, ShieldCheck, Ban, Flag, UserX,
} from "lucide-react";

const PrivacySettings = () => {
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [postVisibility, setPostVisibility] = useState("public");
  const [locationSharing, setLocationSharing] = useState(true);
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [trendParticipation, setTrendParticipation] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(true);
  const [contactsPermission, setContactsPermission] = useState(false);
  const [targetedAds, setTargetedAds] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);

  const visibilityOptions = [
    { value: "public", label: "Public", icon: Globe },
    { value: "friends", label: "Connections Only", icon: Users },
    { value: "verified", label: "Verified Users Only", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Visibility */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" /> Visibility Controls
        </h3>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-display font-medium text-foreground mb-1">Profile Visibility</p>
            <Select value={profileVisibility} onValueChange={setProfileVisibility}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-display font-medium text-foreground mb-1">Post Default Visibility</p>
            <Select value={postVisibility} onValueChange={setPostVisibility}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Location Sharing
              </p>
              <p className="text-xs text-muted-foreground">Show your county/ward on your profile</p>
            </div>
            <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Show in Discover</p>
              <p className="text-xs text-muted-foreground">Allow others to find you in the discover section</p>
            </div>
            <Switch checked={showInDiscover} onCheckedChange={setShowInDiscover} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Trend Participation</p>
              <p className="text-xs text-muted-foreground">Allow your posts to appear in trending</p>
            </div>
            <Switch checked={trendParticipation} onCheckedChange={setTrendParticipation} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Data & Permissions */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Data & Permissions
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Camera Access</p>
              <p className="text-xs text-muted-foreground">For photos, stories, and verification</p>
            </div>
            <Switch checked={cameraPermission} onCheckedChange={setCameraPermission} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Contacts Access</p>
              <p className="text-xs text-muted-foreground">Find friends from your contacts</p>
            </div>
            <Switch checked={contactsPermission} onCheckedChange={setContactsPermission} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Targeted Advertising</p>
              <p className="text-xs text-muted-foreground">Allow personalized ads based on activity</p>
            </div>
            <Switch checked={targetedAds} onCheckedChange={setTargetedAds} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Analytics & Insights</p>
              <p className="text-xs text-muted-foreground">Help improve Conect with usage data</p>
            </div>
            <Switch checked={analyticsOptIn} onCheckedChange={setAnalyticsOptIn} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Blocking & Reporting */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Ban className="h-4 w-4 text-primary" /> Blocking & Reporting
        </h3>

        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <UserX className="h-3.5 w-3.5" /> Manage Blocked Users
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <EyeOff className="h-3.5 w-3.5" /> Muted Trends & Topics
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <Flag className="h-3.5 w-3.5" /> Report History
        </Button>
      </section>
    </div>
  );
};

export default PrivacySettings;
