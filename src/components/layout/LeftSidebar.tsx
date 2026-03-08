import { Home, Users, Compass, TrendingUp, Shield, UserCircle, Flame, MapPin, Building2, Eye, MessageSquare, ShoppingBag, BadgeCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, active, badge, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-display">
        {badge}
      </span>
    )}
  </button>
);

const LeftSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const isUnverified = !profile?.verification_status || profile.verification_status === "unverified";
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card h-full overflow-y-auto p-3">
      {isUnverified && (
        <button
          onClick={() => navigate("/verify-identity")}
          className="w-full mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-left hover:bg-primary/15 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-display font-semibold text-primary">Get Verified</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Verify your identity to join locality groups</p>
        </button>
      )}
      <nav className="space-y-1">
        <SidebarItem icon={<Home className="h-5 w-5" />} label="Home" active={location.pathname === "/"} onClick={() => navigate("/")} />
        <SidebarItem icon={<Compass className="h-5 w-5" />} label="Discover" active={location.pathname === "/discover"} onClick={() => navigate("/discover")} />
        <SidebarItem icon={<TrendingUp className="h-5 w-5" />} label="Trending" badge="Hot" active={location.pathname === "/trending"} onClick={() => navigate("/trending")} />
        <SidebarItem icon={<Users className="h-5 w-5" />} label="Groups" active={location.pathname === "/groups"} onClick={() => navigate("/groups")} />
        <SidebarItem icon={<UserCircle className="h-5 w-5" />} label="Pages" active={location.pathname === "/pages" || location.pathname.startsWith("/pages/")} onClick={() => navigate("/pages")} />
        <SidebarItem icon={<MessageSquare className="h-5 w-5" />} label="Messages" active={location.pathname === "/messages"} onClick={() => navigate("/messages")} />
        <SidebarItem icon={<ShoppingBag className="h-5 w-5" />} label="Marketplace" active={location.pathname === "/marketplace" || location.pathname.startsWith("/marketplace/")} onClick={() => navigate("/marketplace")} />
      </nav>

      <div className="mt-6 mb-2 px-3">
        <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Locality Groups
        </h3>
      </div>
      <nav className="space-y-1">
        <SidebarItem icon={<MapPin className="h-5 w-5" />} label="My Ward" active={location.search.includes("filter=locality")} onClick={() => navigate("/?filter=locality")} />
        <SidebarItem icon={<Building2 className="h-5 w-5" />} label="My County" active={location.search.includes("filter=locality")} onClick={() => navigate("/?filter=locality")} />
        <SidebarItem icon={<Flame className="h-5 w-5" />} label="Nationwide" active={location.pathname === "/trending"} onClick={() => navigate("/trending")} />
      </nav>

      <div className="mt-6 mb-2 px-3">
        <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Special
        </h3>
      </div>
      <nav className="space-y-1">
        <SidebarItem icon={<Eye className="h-5 w-5" />} label="Toboa Siri" badge="Anon" active={location.pathname === "/toboa-siri"} onClick={() => navigate("/toboa-siri")} />
        <SidebarItem icon={<Shield className="h-5 w-5" />} label="Verified Only" badge="✓" active={location.pathname === "/" && location.search.includes("filter=verified")} onClick={() => navigate("/?filter=verified")} />
      </nav>

      {isAdmin && (
        <>
          <div className="mt-6 mb-2 px-3">
            <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </h3>
          </div>
          <nav className="space-y-1">
            <SidebarItem icon={<ShieldCheck className="h-5 w-5" />} label="KYC Review" active={location.pathname === "/admin/kyc"} onClick={() => navigate("/admin/kyc")} />
          </nav>
        </>
      )}
    </aside>
  );
};

export default LeftSidebar;
