/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

export type SiteRouteCatalogItem = {
  path: string;
  title: string;
  summary: string;
  audience: string;
  tags: string[];
  priority: number;
};

export const SITE_ROUTE_CATALOG: SiteRouteCatalogItem[] = [
  {
    path: "/",
    title: "Home",
    summary: "Primary entry point with platform overview and key navigation links.",
    audience: "All visitors",
    tags: ["home", "start", "overview", "new user"],
    priority: 100,
  },
  {
    path: "/ai-hub",
    title: "AI Hub",
    summary: "Unified AI workspace for chat, generation, and environment intelligence.",
    audience: "AI users",
    tags: ["ai", "chat", "assistant", "models", "automation"],
    priority: 98,
  },
  {
    path: "/ai",
    title: "AI Playground",
    summary: "Hugging Face chat and generator modules with model setup guidance.",
    audience: "Developers and tinkerers",
    tags: ["huggingface", "llm", "chat", "text generation"],
    priority: 95,
  },
  {
    path: "/intelligence",
    title: "Intelligence Dashboard",
    summary: "Macro, flow, and analytics-oriented views for market operators.",
    audience: "Traders and analysts",
    tags: ["intelligence", "market", "signals", "analytics"],
    priority: 94,
  },
  {
    path: "/trading",
    title: "Trading",
    summary: "Trading-focused tools, workflows, and strategy surfaces.",
    audience: "Active traders",
    tags: ["trading", "strategy", "signals", "execution"],
    priority: 92,
  },
  {
    path: "/game",
    title: "Hyperborea Game",
    summary: "Interactive web game with progression, leaderboard, and reward hooks.",
    audience: "Gamers and community users",
    tags: ["game", "hyperborea", "leaderboard", "rewards"],
    priority: 88,
  },
  {
    path: "/games",
    title: "Games Index",
    summary: "Browse available game experiences and launch gameplay quickly.",
    audience: "Gamers",
    tags: ["games", "play", "launcher"],
    priority: 86,
  },
  {
    path: "/services",
    title: "Services",
    summary: "Service offerings including web, repair, and consulting support.",
    audience: "Prospective clients",
    tags: ["services", "consulting", "web development", "repair"],
    priority: 90,
  },
  {
    path: "/pricing",
    title: "Pricing",
    summary: "Plans and pricing tiers for product and service access.",
    audience: "Buyers",
    tags: ["pricing", "plans", "subscriptions"],
    priority: 89,
  },
  {
    path: "/billing",
    title: "Billing",
    summary: "Subscription management, checkout, and account monetization controls.",
    audience: "Paying users",
    tags: ["billing", "subscription", "checkout", "invoice"],
    priority: 87,
  },
  {
    path: "/todos",
    title: "Task System",
    summary: "Todo workflows with premium features and productivity support.",
    audience: "Productivity users",
    tags: ["tasks", "todo", "productivity"],
    priority: 78,
  },
  {
    path: "/music",
    title: "Music",
    summary: "Music programs, lessons, scholarships, and showcase resources.",
    audience: "Music students",
    tags: ["music", "lessons", "scholarships", "showcase"],
    priority: 82,
  },
  {
    path: "/portfolio",
    title: "Portfolio",
    summary: "Project and capability showcase for partners and clients.",
    audience: "Prospective clients",
    tags: ["portfolio", "case studies", "work"],
    priority: 75,
  },
  {
    path: "/blog",
    title: "Blog",
    summary: "Educational and thought-leadership content across trading and Web3.",
    audience: "Learners",
    tags: ["blog", "education", "guides", "insights"],
    priority: 72,
  },
  {
    path: "/tokenomics",
    title: "Tokenomics",
    summary: "Token utility and ecosystem economics overview.",
    audience: "Token holders",
    tags: ["tokenomics", "token", "ecosystem"],
    priority: 79,
  },
  {
    path: "/about",
    title: "About",
    summary: "Company profile, mission, and positioning.",
    audience: "All visitors",
    tags: ["about", "mission", "company"],
    priority: 70,
  },
];

export function getTopRoutes(limit = 8) {
  const bounded = Math.min(25, Math.max(1, Math.floor(limit)));
  return [...SITE_ROUTE_CATALOG]
    .sort((left, right) => right.priority - left.priority)
    .slice(0, bounded);
}

export function buildSiteMapContext(limit = 14) {
  return getTopRoutes(limit)
    .map((route) => {
      const tags = route.tags.slice(0, 6).join(", ");
      return `${route.title} (${route.path})\n- ${route.summary}\n- Audience: ${route.audience}\n- Tags: ${tags}`;
    })
    .join("\n\n");
}
