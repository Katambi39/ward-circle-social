import { TrendingUp, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const trendingTopics = [
  { tag: "NairobiTraffic", posts: "2.3k posts", category: "Trending in Nairobi" },
  { tag: "KenyaElections2027", posts: "15k posts", category: "Politics" },
  { tag: "MPesaDown", posts: "890 posts", category: "Technology" },
  { tag: "KPLResults", posts: "1.2k posts", category: "Sports" },
  { tag: "UhuruPark", posts: "450 posts", category: "Places" },
];

const suggestedGroups = [
  { name: "Iriaini Community", members: "1.2k", locality: "Iriaini Ward", verified: true },
  { name: "Nairobi Foodies", members: "8.5k", locality: "Nairobi County", verified: false },
  { name: "Kisumu Hustlers", members: "3.1k", locality: "Kisumu County", verified: true },
];

const RightSidebar = () => {
  return (
    <aside className="w-72 shrink-0 h-full overflow-y-auto p-4 space-y-4">
      {/* Trending */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-secondary" />
          Trending in Kenya
        </h3>
        <div className="space-y-3">
          {trendingTopics.map((topic) => (
            <button key={topic.tag} className="block w-full text-left group">
              <p className="text-xs text-muted-foreground">{topic.category}</p>
              <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                #{topic.tag}
              </p>
              <p className="text-xs text-muted-foreground">{topic.posts}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Groups */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          Suggested Groups
        </h3>
        <div className="space-y-3">
          {suggestedGroups.map((group) => (
            <div key={group.name} className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-semibold text-sm text-foreground flex items-center gap-1">
                  {group.name}
                  {group.verified && (
                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">✓</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {group.locality} · {group.members} members
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Join
              </Button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
