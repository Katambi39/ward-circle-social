import { useState } from "react";
import SEO from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import TrendCard from "@/components/trending/TrendCard";
import LiveTrendCard from "@/components/trending/LiveTrendCard";
import { trendingData } from "@/data/trendingData";
import { useTrending } from "@/hooks/useTrending";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, TrendingUp, Bell, Zap,
  BarChart3, RefreshCw,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const timeTabs = [
  { value: "6", label: "6h" },
  { value: "24", label: "24h" },
  { value: "72", label: "3d" },
  { value: "168", label: "7d" },
];

const TrendingPage = () => {
  const [search, setSearch] = useState("");
  const [hoursWindow, setHoursWindow] = useState("24");
  const { data: liveTrends = [], isLoading, refetch } = useTrending(Number(hoursWindow));

  const hasLiveData = liveTrends.length > 0;

  const filteredLive = liveTrends.filter(
    (t) =>
      !search.trim() ||
      t.hashtag.toLowerCase().includes(search.toLowerCase())
  );

  // Fallback mock data filtered by search
  const filteredMock = trendingData.filter(
    (t) =>
      !search.trim() ||
      t.hashtag.toLowerCase().includes(search.toLowerCase()) ||
      t.topic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <SEO title="Trending" description="See what's trending in Kenya right now. Top hashtags, topics, and conversations." path="/trending" />
      <div className="max-w-3xl mx-auto py-4 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl gradient-kenya flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Trending</h1>
                <p className="text-xs text-muted-foreground">
                  {hasLiveData ? "Based on real activity" : "Suggested trends"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground h-8 w-8"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            What Kenya is talking about right now
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted border-none rounded-full h-10"
            />
          </div>

          {/* Time window tabs */}
          {hasLiveData && (
            <Tabs value={hoursWindow} onValueChange={setHoursWindow}>
              <TabsList className="bg-muted w-full justify-start gap-1 h-auto p-1">
                {timeTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-full text-xs font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </motion.div>

        {/* How it works banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-sm text-foreground">
              Trends are ranked by engagement
            </p>
            <p className="text-xs text-muted-foreground">
              Hashtags from posts are tracked automatically. Upvotes, comments & shares boost ranking.
            </p>
          </div>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Live trends */}
        {!isLoading && hasLiveData && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="text-[10px] font-display gap-1 bg-primary/10 text-primary border-primary/30">
                <Zap className="h-3 w-3" /> {filteredLive.length} live trends
              </Badge>
            </div>
            {filteredLive.length === 0 ? (
              <div className="text-center py-16">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold text-foreground">No matching trends</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLive.map((trend, i) => (
                  <LiveTrendCard key={trend.hashtag} trend={trend} rank={i + 1} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Mock fallback when no live data */}
        {!isLoading && !hasLiveData && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-[10px] font-display gap-1 text-muted-foreground">
                Suggested trends — post with #hashtags to start tracking!
              </Badge>
            </div>
            <div className="space-y-3">
              {filteredMock.map((trend) => (
                <TrendCard key={trend.id} trend={trend} showAnalytics={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default TrendingPage;
