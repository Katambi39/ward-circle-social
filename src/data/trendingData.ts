export interface TrendingHashtag {
  id: string;
  rank: number;
  hashtag: string;
  topic: string;
  category: "politics" | "culture" | "sports" | "tech" | "religion" | "business" | "entertainment" | "social";
  postCount: number;
  velocity: "rising" | "stable" | "cooling";
  region: "nairobi" | "national" | "diaspora";
  sentiment: { positive: number; negative: number; neutral: number };
  startedAt: string;
  startedIn: string;
  isVerifiedTrend: boolean;
  topPosts: TrendPreviewPost[];
}

export interface TrendPreviewPost {
  id: string;
  author: string;
  content: string;
  likes: number;
  isVerified: boolean;
  avatar?: string;
  imageUrl?: string;
  timeAgo: string;
}

const categoryEmojis: Record<string, string> = {
  politics: "🏛️",
  culture: "🎭",
  sports: "⚽",
  tech: "💻",
  religion: "🕊️",
  business: "📊",
  entertainment: "🎬",
  social: "💬",
};

export { categoryEmojis };

export const trendingData: TrendingHashtag[] = [
  {
    id: "1",
    rank: 1,
    hashtag: "#NairobiTraffic",
    topic: "Rush hour gridlock on Thika Superhighway",
    category: "social",
    postCount: 23400,
    velocity: "rising",
    region: "nairobi",
    sentiment: { positive: 15, negative: 65, neutral: 20 },
    startedAt: "2 hours ago",
    startedIn: "Nairobi CBD",
    isVerifiedTrend: true,
    topPosts: [
      { id: "p1", author: "TrafficKE", content: "Thika Road completely stuck from Garden City to CBD. Avoid if you can! Take Outer Ring. #NairobiTraffic", likes: 1200, isVerified: true, timeAgo: "45m" },
      { id: "p2", author: "NairobiCommuter", content: "2 hours to cover 5km. When will we get a proper metro system? #NairobiTraffic", likes: 890, isVerified: false, timeAgo: "1h" },
    ],
  },
  {
    id: "2",
    rank: 2,
    hashtag: "#KenyaElections2027",
    topic: "Early campaign season analysis and predictions",
    category: "politics",
    postCount: 18700,
    velocity: "rising",
    region: "national",
    sentiment: { positive: 35, negative: 40, neutral: 25 },
    startedAt: "5 hours ago",
    startedIn: "Nationwide",
    isVerifiedTrend: true,
    topPosts: [
      { id: "p3", author: "PoliticalAnalystKE", content: "The alliances forming ahead of 2027 are unprecedented. Here's my breakdown of the key coalitions... 🧵 #KenyaElections2027", likes: 3400, isVerified: true, timeAgo: "2h" },
      { id: "p4", author: "CivicVoice254", content: "Voter registration drives have started in 12 counties. Youth turnout will be key. #KenyaElections2027", likes: 2100, isVerified: true, timeAgo: "3h" },
    ],
  },
  {
    id: "3",
    rank: 3,
    hashtag: "#MPesaDown",
    topic: "M-Pesa service interruption reported nationwide",
    category: "tech",
    postCount: 15200,
    velocity: "rising",
    region: "national",
    sentiment: { positive: 5, negative: 85, neutral: 10 },
    startedAt: "1 hour ago",
    startedIn: "Nationwide",
    isVerifiedTrend: false,
    topPosts: [
      { id: "p5", author: "TechKenyaHub", content: "Safaricom confirms MPesa experiencing intermittent issues. Expected fix within 2 hours. #MPesaDown", likes: 5600, isVerified: true, timeAgo: "30m" },
    ],
  },
  {
    id: "4",
    rank: 4,
    hashtag: "#KPLResults",
    topic: "Gor Mahia vs AFC Leopards derby results",
    category: "sports",
    postCount: 12800,
    velocity: "stable",
    region: "national",
    sentiment: { positive: 55, negative: 30, neutral: 15 },
    startedAt: "3 hours ago",
    startedIn: "Kasarani Stadium",
    isVerifiedTrend: true,
    topPosts: [
      { id: "p6", author: "KPLUpdates", content: "FULL TIME: Gor Mahia 2-1 AFC Leopards! What a derby! Onyango with a last-minute winner! 🟢 #KPLResults", likes: 8900, isVerified: true, timeAgo: "1h" },
    ],
  },
  {
    id: "5",
    rank: 5,
    hashtag: "#MainaAndKingangi",
    topic: "Morning show discussion on cost of living",
    category: "entertainment",
    postCount: 9800,
    velocity: "cooling",
    region: "national",
    sentiment: { positive: 40, negative: 35, neutral: 25 },
    startedAt: "6 hours ago",
    startedIn: "Classic FM Studios",
    isVerifiedTrend: true,
    topPosts: [
      { id: "p7", author: "Classic105FM", content: "Today's #MainaAndKingangi topic: Should Kenya implement a 4-day work week? Call in with your views!", likes: 2300, isVerified: true, timeAgo: "4h" },
    ],
  },
  {
    id: "6",
    rank: 6,
    hashtag: "#RoadToDebtSustainability",
    topic: "IMF report on Kenya's debt management progress",
    category: "business",
    postCount: 7600,
    velocity: "rising",
    region: "national",
    sentiment: { positive: 25, negative: 50, neutral: 25 },
    startedAt: "4 hours ago",
    startedIn: "Treasury Square",
    isVerifiedTrend: true,
    topPosts: [
      { id: "p8", author: "EconomistKE", content: "New IMF report shows Kenya's debt-to-GDP at 68%. Here's what it means for the average Kenyan... #RoadToDebtSustainability", likes: 4500, isVerified: true, timeAgo: "2h" },
    ],
  },
  {
    id: "7",
    rank: 7,
    hashtag: "#MaasaiOlympics",
    topic: "Annual Maasai Olympics cultural sports event",
    category: "culture",
    postCount: 6400,
    velocity: "rising",
    region: "national",
    sentiment: { positive: 90, negative: 2, neutral: 8 },
    startedAt: "8 hours ago",
    startedIn: "Amboseli",
    isVerifiedTrend: true,
    topPosts: [
      { id: "p9", author: "CultureKenya", content: "The Maasai Olympics promotes sport as alternative to lion hunting. Incredible high jump competition today! 🏃‍♂️ #MaasaiOlympics", likes: 6700, isVerified: true, timeAgo: "3h" },
    ],
  },
  {
    id: "8",
    rank: 8,
    hashtag: "#KenyanDiaspora",
    topic: "Kenyans abroad share stories of home",
    category: "social",
    postCount: 5200,
    velocity: "stable",
    region: "diaspora",
    sentiment: { positive: 70, negative: 10, neutral: 20 },
    startedAt: "12 hours ago",
    startedIn: "Global",
    isVerifiedTrend: false,
    topPosts: [
      { id: "p10", author: "KenyanInLondon", content: "Missing home so much today. Made ugali and sukuma for dinner and the whole flat smells like Kenya 🇰🇪❤️ #KenyanDiaspora", likes: 3200, isVerified: false, timeAgo: "5h" },
    ],
  },
  {
    id: "9",
    rank: 9,
    hashtag: "#UhuruPark",
    topic: "New Uhuru Park renovation plans unveiled",
    category: "social",
    postCount: 4800,
    velocity: "stable",
    region: "nairobi",
    sentiment: { positive: 60, negative: 20, neutral: 20 },
    startedAt: "6 hours ago",
    startedIn: "Nairobi CBD",
    isVerifiedTrend: true,
    topPosts: [
      { id: "p11", author: "NairobiCountyGov", content: "Phase 2 of Uhuru Park restoration begins next week. New amphitheater, children's zone, and cultural center. #UhuruPark", likes: 5100, isVerified: true, timeAgo: "4h" },
    ],
  },
  {
    id: "10",
    rank: 10,
    hashtag: "#BibleBirthpains",
    topic: "Religious discussions on current events",
    category: "religion",
    postCount: 3900,
    velocity: "cooling",
    region: "national",
    sentiment: { positive: 50, negative: 15, neutral: 35 },
    startedAt: "10 hours ago",
    startedIn: "Nationwide",
    isVerifiedTrend: false,
    topPosts: [
      { id: "p12", author: "PastorMwangi", content: "Let us be a light in these times. Community, compassion, and hope. 🕊️ #BibleBirthpains", likes: 1800, isVerified: true, timeAgo: "6h" },
    ],
  },
];
