import { Image, Link2, BarChart3, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const CreatePostBar = () => {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold">
          U
        </div>
        <button className="flex-1 h-10 px-4 rounded-full bg-muted text-muted-foreground text-sm text-left hover:bg-muted/80 transition-colors">
          What's on your mind? Share with your community...
        </button>
      </div>
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 rounded-full">
          <Image className="h-4 w-4 text-primary" />
          <span className="text-xs font-display">Photo</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary gap-1.5 rounded-full">
          <Link2 className="h-4 w-4 text-secondary" />
          <span className="text-xs font-display">Link</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent gap-1.5 rounded-full">
          <BarChart3 className="h-4 w-4 text-accent" />
          <span className="text-xs font-display">Poll</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-kenya-gold gap-1.5 rounded-full">
          <Smile className="h-4 w-4 text-kenya-gold" />
          <span className="text-xs font-display">Feeling</span>
        </Button>
      </div>
    </div>
  );
};

export default CreatePostBar;
