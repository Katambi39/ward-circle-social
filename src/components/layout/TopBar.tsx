import { Search, Bell, MessageCircle, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import conectLogo from "@/assets/conect-logo.png";

const TopBar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <img src={conectLogo} alt="Conect" className="h-8 w-8" />
          <span className="font-display text-xl font-bold text-primary">Conect</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Conect..."
              className="pl-9 bg-muted border-none h-9 rounded-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 min-w-[180px] justify-end">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
            <Eye className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
          </Button>
          <Button size="sm" className="ml-2 rounded-full gradient-kenya text-primary-foreground font-display gap-1.5">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
