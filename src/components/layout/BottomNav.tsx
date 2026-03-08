import { Home, Users, Eye, UserCircle, Compass, MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Eye, label: "Siri", path: "/toboa-siri" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[3.5rem]",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "fill-primary/20")} />
              <span className="text-[10px] font-display font-medium">{item.label}</span>
              {active && (
                <div className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
