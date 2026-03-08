import { Home, Users, Compass, TrendingUp, Shield, UserCircle, Flame, MapPin, Building2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

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

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto p-3">
      <nav className="space-y-1">
        <SidebarItem icon={<Home className="h-5 w-5" />} label="Home" active={location.pathname === "/"} onClick={() => navigate("/")} />
        <SidebarItem icon={<Compass className="h-5 w-5" />} label="Discover" />
        <SidebarItem icon={<TrendingUp className="h-5 w-5" />} label="Trending" badge="Hot" />
        <SidebarItem icon={<Users className="h-5 w-5" />} label="Groups" active={location.pathname === "/groups"} onClick={() => navigate("/groups")} />
        <SidebarItem icon={<UserCircle className="h-5 w-5" />} label="Pages" />
      </nav>

      <div className="mt-6 mb-2 px-3">
        <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Locality Groups
        </h3>
      </div>
      <nav className="space-y-1">
        <SidebarItem icon={<MapPin className="h-5 w-5" />} label="My Ward" />
        <SidebarItem icon={<Building2 className="h-5 w-5" />} label="My County" />
        <SidebarItem icon={<Flame className="h-5 w-5" />} label="Nationwide" />
      </nav>

      <div className="mt-6 mb-2 px-3">
        <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Special
        </h3>
      </div>
      <nav className="space-y-1">
        <SidebarItem icon={<Eye className="h-5 w-5" />} label="Toboa Siri" badge="Anon" />
        <SidebarItem icon={<Shield className="h-5 w-5" />} label="Verified Only" />
      </nav>
    </aside>
  );
};

export default LeftSidebar;
