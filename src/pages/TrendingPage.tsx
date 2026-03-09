import { useState } from "react";
import SEO from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import TrendCard from "@/components/trending/TrendCard";
import { trendingData } from "@/data/trendingData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, TrendingUp, Shield, MapPin, Globe, Flag, Bell, Zap,
  BarChart3, RefreshCw, Filter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const regionTabs = [
  { value: "nairobi", label: "Nairobi", icon: MapPin },
  { value: "national", label: "National", icon: Flag },
  { value: "diaspora", label: "Diaspora", icon: Globe },
  { value: "all", label: "All", icon: TrendingUp },
];

const TrendingPage = () => {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("nairobi");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [lastUpdated] = useState(new Date());

  const filtered = trendingData
    .filter((t) => region === "all" || t.region === region)
    .filter((t) => !verifiedOnly || t.isVerifiedTrend)
    .filter((t) =>
      !search.trim() ||
      t.hashtag.toLowerCase().includes(search.toLowerCase()) ||
      t.topic.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <AppLayout>
      <SEO title="Trending" description="See what's trending in Kenya right now. Top hashtags, topics, and conversations from your region." path="/trending" />
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
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground h-8 w-8">
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

          {/* Region Tabs */}
          <Tabs value={region} onValueChange={setRegion}>
            <TabsList className="bg-muted w-full justify-start gap-1 h-auto p-1 overflow-x-auto">
              {regionTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50 border border-border">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <Label htmlFor="verified-filter" className="text-xs font-display cursor-pointer">
              Verified Only
            </Label>
            <Switch
              id="verified-filter"
              checked={verifiedOnly}
              onCheckedChange={setVerifiedOnly}
              className="scale-75"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50 border border-border">
            <BarChart3 className="h-3.5 w-3.5 text-secondary" />
            <Label htmlFor="analytics-toggle" className="text-xs font-display cursor-pointer">
              Show Insights
            </Label>
            <Switch
              id="analytics-toggle"
              checked={showAnalytics}
              onCheckedChange={setShowAnalytics}
              className="scale-75"
            />
          </div>
          <Badge variant="outline" className="text-[10px] font-display gap-1 text-kenya-gold border-kenya-gold/30">
            <Zap className="h-3 w-3" /> {filtered.length} trends
          </Badge>
        </div>

        {/* Rising trends banner */}
        {filtered.some((t) => t.velocity === "rising") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-sm text-foreground">
                {filtered.filter((t) => t.velocity === "rising").length} trends rising now
              </p>
              <p className="text-xs text-muted-foreground">Based on engagement velocity in the last hour</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full text-xs font-display text-primary gap-1">
              <Bell className="h-3.5 w-3.5" /> Notify Me
            </Button>
          </motion.div>
        )}

        {/* Trends list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground">No trends found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((trend) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                showAnalytics={showAnalytics}
              />
            ))}
          </div>
        )}

        {/* Premium analytics upsell */}
        {!showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 rounded-xl bg-primary text-primary-foreground text-center"
          >
            <BarChart3 className="h-6 w-6 mx-auto mb-2 opacity-80" />
            <p className="font-display font-bold text-sm mb-1">Unlock Trend Insights</p>
            <p className="text-xs opacity-70 mb-3">
              See where trends start, sentiment analysis, and engagement velocity for strategic insights
            </p>
            <Button
              size="sm"
              className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-display text-xs gap-1"
              onClick={() => setShowAnalytics(true)}
            >
              <Zap className="h-3.5 w-3.5" /> Enable Insights
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default TrendingPage;
