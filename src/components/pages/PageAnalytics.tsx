import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import {
  Eye, Users, TrendingUp, Star, Calendar, BarChart3, ArrowUpRight, ArrowDownRight,
  MessageSquare, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface PageAnalyticsProps {
  pageId: string;
  pageName: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  color: string;
  delay?: number;
}

const StatCard = ({ icon, label, value, change, color, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card border border-border rounded-xl p-4 shadow-card"
  >
    <div className="flex items-center justify-between mb-2">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {change !== undefined && (
        <span className={`text-xs font-display flex items-center gap-0.5 ${change >= 0 ? "text-primary" : "text-accent"}`}>
          {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground font-display mt-0.5">{label}</p>
  </motion.div>
);

const CHART_COLORS = [
  "hsl(145, 45%, 28%)",
  "hsl(15, 60%, 55%)",
  "hsl(42, 85%, 55%)",
  "hsl(0, 75%, 42%)",
  "hsl(200, 60%, 50%)",
];

const PageAnalytics = ({ pageId, pageName }: PageAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [viewsData, setViewsData] = useState<any[]>([]);
  const [followersData, setFollowersData] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalRsvps, setTotalRsvps] = useState(0);
  const [totalPolls, setTotalPolls] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [viewsChange, setViewsChange] = useState(0);
  const [followersChange, setFollowersChange] = useState(0);
  const [engagementByType, setEngagementByType] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [pageId]);

  const fetchAnalytics = async () => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // Parallel fetches
    const [
      { data: views },
      { data: prevViews },
      { data: followers },
      { data: prevFollowers },
      { data: reviews },
      { data: events },
      { data: rsvps },
      { data: polls },
      { data: pollVotes },
    ] = await Promise.all([
      supabase.from("page_views").select("viewed_at").eq("page_id", pageId).gte("viewed_at", thirtyDaysAgo.toISOString()),
      supabase.from("page_views").select("id").eq("page_id", pageId).gte("viewed_at", sixtyDaysAgo.toISOString()).lt("viewed_at", thirtyDaysAgo.toISOString()),
      supabase.from("page_followers").select("created_at").eq("page_id", pageId),
      supabase.from("page_followers").select("id").eq("page_id", pageId).lt("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("page_reviews").select("rating, created_at").eq("page_id", pageId),
      supabase.from("page_events").select("id, rsvp_count").eq("page_id", pageId),
      supabase.from("event_rsvps").select("id, event_id").in("event_id",
        (await supabase.from("page_events").select("id").eq("page_id", pageId)).data?.map((e: any) => e.id) || []
      ),
      supabase.from("page_polls").select("id").eq("page_id", pageId),
      supabase.from("poll_votes").select("id, poll_id").in("poll_id",
        (await supabase.from("page_polls").select("id").eq("page_id", pageId)).data?.map((p: any) => p.id) || []
      ),
    ]);

    // Views per day (last 30 days)
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const viewsByDay = new Map<string, number>();
    days.forEach(d => viewsByDay.set(format(d, "yyyy-MM-dd"), 0));
    (views || []).forEach((v: any) => {
      const day = format(new Date(v.viewed_at), "yyyy-MM-dd");
      viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
    });
    const viewsChartData = Array.from(viewsByDay.entries()).map(([date, count]) => ({
      date: format(new Date(date), "MMM dd"),
      views: count,
    }));

    // Followers over time (cumulative)
    const allFollowers = (followers || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const followersByDay = new Map<string, number>();
    days.forEach(d => followersByDay.set(format(d, "yyyy-MM-dd"), 0));
    allFollowers.forEach((f: any) => {
      const day = format(new Date(f.created_at), "yyyy-MM-dd");
      if (followersByDay.has(day)) {
        followersByDay.set(day, (followersByDay.get(day) || 0) + 1);
      }
    });
    let cumulative = (prevFollowers || []).length;
    const followersChartData = Array.from(followersByDay.entries()).map(([date, count]) => {
      cumulative += count;
      return { date: format(new Date(date), "MMM dd"), followers: cumulative };
    });

    // Calculate changes
    const currentViewCount = (views || []).length;
    const prevViewCount = (prevViews || []).length;
    const vChange = prevViewCount > 0 ? Math.round(((currentViewCount - prevViewCount) / prevViewCount) * 100) : currentViewCount > 0 ? 100 : 0;

    const recentFollowers = allFollowers.filter((f: any) => new Date(f.created_at) >= thirtyDaysAgo).length;
    const olderFollowers = (prevFollowers || []).length;
    const fChange = olderFollowers > 0 ? Math.round(((recentFollowers - olderFollowers) / olderFollowers) * 100) : recentFollowers > 0 ? 100 : 0;

    // Review stats
    const reviewsList = reviews || [];
    const avg = reviewsList.length > 0 ? reviewsList.reduce((s: number, r: any) => s + r.rating, 0) / reviewsList.length : 0;

    // Engagement breakdown
    const engagement = [
      { name: "Reviews", value: reviewsList.length },
      { name: "RSVPs", value: (rsvps || []).length },
      { name: "Poll Votes", value: (pollVotes || []).length },
    ].filter(e => e.value > 0);

    setViewsData(viewsChartData);
    setFollowersData(followersChartData);
    setTotalViews(currentViewCount);
    setTotalFollowers(allFollowers.length);
    setTotalReviews(reviewsList.length);
    setAvgRating(avg);
    setTotalEvents((events || []).length);
    setTotalRsvps((rsvps || []).length);
    setTotalPolls((polls || []).length);
    setTotalVotes((pollVotes || []).length);
    setViewsChange(vChange);
    setFollowersChange(fChange);
    setEngagementByType(engagement);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-card animate-pulse">
              <div className="h-9 w-9 bg-muted rounded-lg mb-2" />
              <div className="h-6 bg-muted rounded w-16 mb-1" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-card animate-pulse h-64" />
      </div>
    );
  }

  const totalEngagement = totalReviews + totalRsvps + totalVotes;

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Eye className="h-4 w-4 text-primary-foreground" />}
          label="Views (30d)"
          value={totalViews.toLocaleString()}
          change={viewsChange}
          color="gradient-kenya"
          delay={0}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-secondary-foreground" />}
          label="Total Followers"
          value={totalFollowers.toLocaleString()}
          change={followersChange}
          color="gradient-earth"
          delay={0.05}
        />
        <StatCard
          icon={<Star className="h-4 w-4 text-[hsl(var(--kenya-gold))]" />}
          label="Avg Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
          color="bg-[hsl(var(--kenya-gold))]/10"
          delay={0.1}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          label="Total Engagement"
          value={totalEngagement.toLocaleString()}
          color="bg-primary/10"
          delay={0.15}
        />
      </div>

      {/* Views Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-5 shadow-card"
      >
        <h3 className="font-display font-bold text-foreground text-sm mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" /> Page Views — Last 30 Days
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viewsData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145, 45%, 28%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(145, 45%, 28%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 12%, 88%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "Space Grotesk" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fontFamily: "Space Grotesk" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontFamily: "Space Grotesk", fontSize: 12, border: "1px solid hsl(30, 12%, 88%)" }}
              />
              <Area type="monotone" dataKey="views" stroke="hsl(145, 45%, 28%)" fill="url(#viewsGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Follower Growth Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-xl p-5 shadow-card"
      >
        <h3 className="font-display font-bold text-foreground text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-secondary" /> Follower Growth — Last 30 Days
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={followersData}>
              <defs>
                <linearGradient id="followersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(15, 60%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(15, 60%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 12%, 88%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "Space Grotesk" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fontFamily: "Space Grotesk" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontFamily: "Space Grotesk", fontSize: 12, border: "1px solid hsl(30, 12%, 88%)" }}
              />
              <Area type="monotone" dataKey="followers" stroke="hsl(15, 60%, 55%)" fill="url(#followersGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pie Chart */}
        {engagementByType.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5 shadow-card"
          >
            <h3 className="font-display font-bold text-foreground text-sm mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Engagement Breakdown
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                  >
                    {engagementByType.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontFamily: "Space Grotesk", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {engagementByType.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="font-display text-muted-foreground">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Activity Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <h3 className="font-display font-bold text-foreground text-sm mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary" /> Activity Summary
          </h3>
          <div className="space-y-3">
            <ActivityRow icon={<Star className="h-4 w-4" />} label="Reviews" value={totalReviews} color="text-[hsl(var(--kenya-gold))]" />
            <ActivityRow icon={<Calendar className="h-4 w-4" />} label="Events Created" value={totalEvents} color="text-secondary" />
            <ActivityRow icon={<Users className="h-4 w-4" />} label="Total RSVPs" value={totalRsvps} color="text-primary" />
            <ActivityRow icon={<BarChart3 className="h-4 w-4" />} label="Polls Created" value={totalPolls} color="text-accent" />
            <ActivityRow icon={<MessageSquare className="h-4 w-4" />} label="Poll Votes" value={totalVotes} color="text-muted-foreground" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ActivityRow = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <div className="flex items-center gap-3">
    <div className={color}>{icon}</div>
    <span className="flex-1 text-sm text-foreground font-display">{label}</span>
    <span className="font-display font-bold text-foreground text-sm">{value}</span>
  </div>
);

export default PageAnalytics;
