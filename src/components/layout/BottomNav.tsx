import { useState } from "react";
import { Home, Users, Compass, TrendingUp, MessageSquare, ShoppingBag, MapPin, Building2, Flame, Eye, Shield, Menu, FileText, BadgeCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
  { icon: Users, label: "Groups", path: "/groups" },
];

const moreItems = [
  { icon: FileText, label: "Pages", path: "/pages" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: ShoppingBag, label: "Marketplace", path: "/marketplace" },
];

const localityItems = [
  { icon: MapPin, label: "My Ward", path: "/?filter=locality" },
  { icon: Building2, label: "My County", path: "/?filter=locality" },
  { icon: Flame, label: "Nationwide", path: "/trending" },
];

const specialItems = [
  { icon: Eye, label: "Toboa Siri", path: "/toboa-siri", badge: "Anon" },
  { icon: Shield, label: "Verified Only", path: "/?filter=verified", badge: "✓" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const isUnverified = !profile?.verification_status || profile.verification_status === "unverified";
  const unreadMsgCount = useUnreadMessages();

  const handleNav = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[3.5rem]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "fill-primary/20")} />
              <span className="text-[10px] font-display font-medium">{item.label}</span>
              {active && <div className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
            </button>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[3.5rem] text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-display font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8 px-4 max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4 mt-1" />

            {isUnverified && (
              <button
                onClick={() => handleNav("/verify-identity")}
                className="w-full mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-display font-semibold text-primary">Get Verified</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Verify your identity to join locality groups</p>
              </button>
            )}

            <div className="mb-2 px-1">
              <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Navigate</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {moreItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <item.icon className="h-5 w-5 text-foreground" />
                  <span className="text-[11px] font-display font-medium text-foreground">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-2 px-1">
              <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Locality Groups</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {localityItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <item.icon className="h-5 w-5 text-foreground" />
                  <span className="text-[11px] font-display font-medium text-foreground">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-2 px-1">
              <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Special</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {specialItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors relative"
                >
                  <item.icon className="h-5 w-5 text-foreground" />
                  <span className="text-[11px] font-display font-medium text-foreground">{item.label}</span>
                  {item.badge && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-display font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default BottomNav;
