import { AdSenseBlock } from "@/components/monetization/AdSenseBlock";
import { RecommendedTools } from "@/components/monetization/AffiliateBanner";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog - TradeHax AI | Crypto Trading Insights & Web3 Guides",
  description:
    "Expert insights on cryptocurrency trading, Web3 development, Solana blockchain, and automated trading strategies.",
  keywords: [
    "crypto trading",
    "web3",
    "solana",
    "blockchain",
    "DeFi",
    "trading strategies",
    "tutorials",
  ],
  openGraph: {
    title: "Blog - TradeHax AI",
    description:
      "Expert insights on cryptocurrency trading, Web3 development, and automated trading strategies.",
    url: "https://tradehaxai.tech/blog",
    type: "website",
    images: [
      {
        url: "/og-blog.svg",
        width: 1200,
        height: 630,
        alt: "Blog - Trading Insights & Web3 Guides",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - Trading Insights & Web3 Guides",
    description:
      "Read expert articles on crypto trading, Solana, DeFi, and Web3 development.",
    images: ["/og-blog.svg"],
  },
};

// Sample blog posts - in production, these would come from a CMS or database
const blogPosts = [
  {
    slug: "getting-started-solana-trading",
    title: "Getting Started with Solana Trading: A Complete Guide",
    excerpt:
      "Learn how to start trading on the Solana blockchain, from setting up your wallet to executing your first trade.",
    date: "2024-01-15",
    readTime: 8,
    category: "Tutorial",
    featured: true,
  },
  {
    slug: "automated-trading-strategies-2024",
    title: "Top 5 Automated Trading Strategies for 2024",
    excerpt:
      "Discover the most effective automated trading strategies that professional traders use to maximize profits.",
    date: "2024-01-12",
    readTime: 10,
    category: "Strategy",
    featured: true,
  },
  {
    slug: "web3-wallet-security-guide",
    title: "Web3 Wallet Security: Protecting Your Crypto Assets",
    excerpt:
      "Essential security practices to keep your cryptocurrency safe from hackers and scams.",
    date: "2024-01-10",
    readTime: 6,
    category: "Security",
    featured: false,
  },
  {
    slug: "defi-yield-farming-explained",
    title: "DeFi Yield Farming Explained: Risks and Rewards",
    excerpt:
      "Understanding the opportunities and risks in DeFi yield farming and how to get started safely.",
    date: "2024-01-08",
    readTime: 12,
    category: "DeFi",
    featured: false,
  },
  {
    slug: "solana-vs-ethereum-comparison",
    title: "Solana vs Ethereum: Which Blockchain is Better for Trading?",
    excerpt:
      "A comprehensive comparison of Solana and Ethereum for cryptocurrency trading and DeFi applications.",
    date: "2024-01-05",
    readTime: 9,
    category: "Comparison",
    featured: false,
  },
];

export default function BlogPage() {
  const featuredPosts = blogPosts.filter((post) => post.featured);
  const regularPosts = blogPosts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text mb-4">
            Trading Insights & Web3 Guides
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Expert articles on cryptocurrency trading, blockchain technology,
            and automated trading strategies.
          </p>
        </div>

        {/* Ad Placement */}
        <div className="mb-12">
          <AdSenseBlock adSlot="blog-top" adFormat="horizontal" />
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <BlogCard key={post.slug} post={post} featured />
              ))}
            </div>
          </section>
        )}

        {/* Recent Posts */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Posts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* Sidebar Section with Recommended Tools */}
        <section className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <AdSenseBlock adSlot="blog-content" adFormat="auto" />
          </div>
          <div className="lg:col-span-1">
            <RecommendedTools />
          </div>
        </section>
      </main>

      <ShamrockFooter />
    </div>
  );
}

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: number;
    category: string;
  };
  featured?: boolean;
}

function BlogCard({ post, featured = false }: BlogCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/blog/${post.slug}`}>
      <article
        className={`group bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#0366d6]/50 transition-all h-full flex flex-col ${featured ? "md:p-8" : ""}`}
      >
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
            {post.category}
          </span>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{post.readTime} min</span>
          </div>
        </div>

        <h3
          className={`font-bold text-white mb-3 group-hover:text-[#0366d6] transition-colors ${featured ? "text-2xl" : "text-xl"}`}
        >
          {post.title}
        </h3>

        <p className="text-gray-400 mb-4 flex-grow">{post.excerpt}</p>

        <div className="flex items-center text-[#0366d6] font-semibold group-hover:gap-3 gap-2 transition-all">
          Read More
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </article>
    </Link>
  );
}
