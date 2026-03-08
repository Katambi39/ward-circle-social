import { Search, Bell, MessageCircle, Plus, LogOut, UserCircle, CheckCircle2 } from "lucide-react";
import IdentityToggle from "@/components/feed/IdentityToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import conectLogo from "@/assets/conect-logo.png";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TopBar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4">
        <div className="flex items-center gap-2 min-w-[180px]">
          <img src={conectLogo} alt="Conect" className="h-8 w-8" />
          <span className="font-display text-xl font-bold text-primary">Conect</span>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search Conect..." className="pl-9 bg-muted border-none h-9 rounded-full" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-[220px] justify-end">
          <IdentityToggle />
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
          </Button>
          <Button size="sm" className="ml-1 rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
            <Plus className="h-4 w-4" />
            Create
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 h-8 w-8 rounded-full overflow-hidden relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                    {profile?.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                {profile?.verification_status === "verified" && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center border border-card">
                    <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-display font-semibold text-sm">{profile?.display_name || "User"}</p>
                <p className="text-xs text-muted-foreground">@{profile?.username}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                <UserCircle className="h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-accent gap-2 cursor-pointer">
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
