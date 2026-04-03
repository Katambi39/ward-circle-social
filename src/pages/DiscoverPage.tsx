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
import { toast } from "sonner";
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
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
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
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full text-xs font-display text-primary gap-1"
        onClick={onAction}
      >
        {action} <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    )}
  </div>
);

const ScrollableRow = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth snap-x snap-mandatory"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {children}
    </div>
  );
};

const AutoScrollRow = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="overflow-hidden -mx-4 px-4 pb-2">
      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 5,
            ease: "linear",
          },
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};

const DiscoverPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);

  const enableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          toast.success("Location enabled! Showing nearby discoveries.");
        },
        () => {
          setLocationEnabled(false);
          toast.error("Location access denied. Please enable it in your browser settings.");
        }
      );
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    toast.info(`Opening ${categoryName} channel...`);
    // Future: navigate to channel detail page
  };

  const handleCreatePrompt = (action: string, title: string) => {
    if (action === "Start Creating" || action === "Write Now") {
      navigate("/");
      toast.success(`Let's go! Create your "${title}" post.`);
    } else if (action === "Upload Photo") {
      navigate("/");
      toast.success("Upload your Golden Hour photo!");
    } else if (action === "Create Quiz") {
      navigate("/");
      toast.success("Create a quiz for your community!");
    }
  };

  const handleChallengeJoin = (challengeTitle: string) => {
    toast.success(`You joined "${challengeTitle}"! Start posting to earn rewards.`);
  };

  const handleNearbyItemClick = (itemName: string, itemType: string) => {
    toast.info(`Viewing ${itemType}: ${itemName}`);
  };

  const handleCreatePoll = () => {
    navigate("/");
    toast.info("Create a poll from the post composer!");
  };

  return (
    <AppLayout>
      <SEO title="Discover" description="Explore trending topics, local events, polls, and challenges happening across Kenya on Conect." path="/discover" />
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
            onAction={() => toast.info("All channels coming soon!")}
          />
          <AutoScrollRow>
            {discoverCategories.map((cat, i) => (
              <div key={cat.id} className="snap-start" onClick={() => handleCategoryClick(cat.name)}>
                <CategoryCard category={cat} index={i} />
              </div>
            ))}
          </AutoScrollRow>
        </section>

        {/* Content Creation Prompts */}
        <section className="mb-8">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5 text-kenya-gold" />}
            title="Create & Contribute"
            subtitle="Remix trends, share your story"
          />
          <AutoScrollRow>
            {creationPrompts.map((prompt, i) => (
              <div key={prompt.id} className="snap-start" onClick={() => handleCreatePrompt(prompt.action, prompt.title)}>
                <CreationPromptCard prompt={prompt} index={i} />
              </div>
            ))}
          </AutoScrollRow>
        </section>

        {/* Polls & Interactive */}
        <section className="mb-8">
          <SectionHeader
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Polls & Votes"
            subtitle="From verified creators"
            action="Create Poll"
            onAction={handleCreatePoll}
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
            onAction={() => toast.info("All challenges coming soon!")}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge, i) => (
              <ChallengeCard key={challenge.id} challenge={challenge} index={i} onJoin={() => handleChallengeJoin(challenge.title)} />
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
            onAction={() => toast.info("Map view coming soon!")}
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
            <ScrollableRow>
              {nearbyItems.map((item, i) => (
                <div key={item.id} className="snap-start" onClick={() => handleNearbyItemClick(item.name, item.type)}>
                  <NearYouCard item={item} index={i} />
                </div>
              ))}
            </ScrollableRow>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default DiscoverPage;
