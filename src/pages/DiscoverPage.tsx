import { useState } from "react";
import SEO from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CategoryCard from "@/components/discover/CategoryCard";
import PollCard from "@/components/discover/PollCard";
import NearYouCard from "@/components/discover/NearYouCard";
import CreationPromptCard from "@/components/discover/CreationPromptCard";
import ChallengeCard from "@/components/discover/ChallengeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, TrendingUp, MapPin, Sparkles, Trophy, ChevronRight, Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import acaciaIcon from "@/assets/acacia-icon.png";
import {
  discoverCategories,
  discoverPolls,
  nearbyItems,
  creationPrompts,
  challenges,
} from "@/data/discoverData";

const SectionHeader = ({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: string;
}) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <h2 className="font-display font-bold text-foreground text-base sm:text-lg">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {action && (
      <Button variant="ghost" size="sm" className="rounded-full text-xs font-display text-primary gap-1">
        {action} <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    )}
  </div>
);

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);

  const enableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationEnabled(true),
        () => setLocationEnabled(false)
      );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-4 px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <img src={acaciaIcon} alt="" className="h-8 w-8 opacity-60 dark:invert" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Discover</h1>
              <p className="text-sm text-muted-foreground">
                Explore Kenya's stories, culture, and communities
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics, channels, events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted border-none rounded-full h-10"
            />
          </div>
        </motion.div>

        {/* Trending Banner */}
        <motion.button
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate("/trending")}
          className="w-full mb-8 p-4 rounded-xl gradient-kenya text-primary-foreground text-left flex items-center gap-3 shadow-glow hover:opacity-90 transition-opacity"
        >
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-sm">Trending Now</p>
            <p className="text-xs opacity-80">See what Kenya is talking about right now</p>
          </div>
          <ChevronRight className="h-5 w-5 opacity-60 shrink-0" />
        </motion.button>

        {/* Themed Categories / Channels */}
        <section className="mb-8">
          <SectionHeader
            icon={<Flame className="h-5 w-5 text-secondary" />}
            title="Channels & Categories"
            subtitle="Subscribe to Kenyan-specific niches"
            action="See All"
          />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {discoverCategories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        </section>

        {/* Content Creation Prompts */}
        <section className="mb-8">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5 text-kenya-gold" />}
            title="Create & Contribute"
            subtitle="Remix trends, share your story"
          />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {creationPrompts.map((prompt, i) => (
              <CreationPromptCard key={prompt.id} prompt={prompt} index={i} />
            ))}
          </div>
        </section>

        {/* Polls & Interactive */}
        <section className="mb-8">
          <SectionHeader
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Polls & Votes"
            subtitle="From verified creators"
            action="Create Poll"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {discoverPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </section>

        {/* Challenges & Gamification */}
        <section className="mb-8">
          <SectionHeader
            icon={<Trophy className="h-5 w-5 text-kenya-gold" />}
            title="Challenges & Badges"
            subtitle="Earn rewards by participating"
            action="All Challenges"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge, i) => (
              <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
            ))}
          </div>
        </section>

        {/* Location-Based Discoveries */}
        <section className="mb-8">
          <SectionHeader
            icon={<MapPin className="h-5 w-5 text-accent" />}
            title="Near You"
            subtitle="Events, businesses & meetups nearby"
            action="See Map"
          />
          {!locationEnabled ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted/50 border border-border rounded-xl p-6 text-center"
            >
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-display font-semibold text-foreground text-sm mb-1">
                Enable location for nearby discoveries
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Find verified users, events, and businesses near you. Your location data stays private.
              </p>
              <Button
                onClick={enableLocation}
                className="rounded-full gradient-kenya text-primary-foreground font-display text-xs"
              >
                <MapPin className="h-3.5 w-3.5 mr-1" /> Enable Location
              </Button>
            </motion.div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {nearbyItems.map((item, i) => (
                <NearYouCard key={item.id} item={item} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default DiscoverPage;
