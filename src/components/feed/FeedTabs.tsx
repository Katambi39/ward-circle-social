import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const tabs = [
  { label: "For You", path: null },
  { label: "Following", path: null },
  { label: "Locality", path: null },
  { label: "Toboa Siri", path: "/toboa-siri" },
];

const FeedTabs = () => {
  const [active, setActive] = useState("For You");
  const navigate = useNavigate();

  const handleClick = (tab: typeof tabs[0]) => {
    if (tab.path) {
      navigate(tab.path);
    } else {
      setActive(tab.label);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 mb-4 shadow-card">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => handleClick(tab)}
          className={cn(
            "flex-1 py-2 text-sm font-display font-medium rounded-lg transition-all",
            active === tab.label && !tab.path
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default FeedTabs;
