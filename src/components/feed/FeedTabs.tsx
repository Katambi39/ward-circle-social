import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";

const tabs = [
  { label: "For You", filter: null },
  { label: "Following", filter: "following" },
  { label: "Locality", filter: "locality" },
  { label: "Toboa Siri", path: "/toboa-siri" },
];

const FeedTabs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeFilter = searchParams.get("filter");
  const activeTab = activeFilter || "For You";

  const handleClick = (tab: typeof tabs[0]) => {
    if (tab.path) {
      navigate(tab.path);
    } else if (tab.filter) {
      setSearchParams({ filter: tab.filter });
    } else {
      setSearchParams({});
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.path) return false;
    if (!tab.filter) return !activeFilter || activeFilter === "verified";
    return activeFilter === tab.filter;
  };

  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 mb-4 shadow-card overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => handleClick(tab)}
          className={cn(
            "flex-1 py-2 text-xs sm:text-sm font-display font-medium rounded-lg transition-all whitespace-nowrap min-w-[4rem]",
            isActive(tab)
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
