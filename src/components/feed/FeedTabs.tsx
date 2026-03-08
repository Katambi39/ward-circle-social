import { cn } from "@/lib/utils";
import { useState } from "react";

const tabs = ["For You", "Following", "Locality", "Toboa Siri"];

const FeedTabs = () => {
  const [active, setActive] = useState("For You");

  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 mb-4 shadow-card">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={cn(
            "flex-1 py-2 text-sm font-display font-medium rounded-lg transition-all",
            active === tab
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default FeedTabs;
