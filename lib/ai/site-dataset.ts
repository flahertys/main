import { SITE_ROUTE_CATALOG } from "@/lib/ai/site-map";

type SiteDatasetRow = {
  instruction: string;
  input: string;
  output: string;
  category: "NAVIGATION";
};

function routeRows(): SiteDatasetRow[] {
  return SITE_ROUTE_CATALOG.map((route) => ({
    instruction: `Where should I go for ${route.title.toLowerCase()}?`,
    input: `User intent: website navigation. Route tags: ${route.tags.join(", ")}.`,
    output: `Go to ${route.path} (${route.title}). ${route.summary} Best for: ${route.audience}.`,
    category: "NAVIGATION",
  }));
}

function seedRows(): SiteDatasetRow[] {
  return [
    {
      instruction: "I am new here. Where should I begin?",
      input: "User is first-time visitor and asks for onboarding.",
      output:
        "Start on / for an overview, then open /ai-hub for AI features and /pricing to understand plans.",
      category: "NAVIGATION",
    },
    {
      instruction: "I want trading signals and market intelligence.",
      input: "User asks about market and strategy tools.",
      output:
        "Start at /intelligence for market intelligence, then visit /trading for execution-focused workflows.",
      category: "NAVIGATION",
    },
    {
      instruction: "I want to play the game and see rewards.",
      input: "User asks for gameplay and progression.",
      output:
        "Use /game for Hyperborea gameplay and /games to browse available game experiences.",
      category: "NAVIGATION",
    },
    {
      instruction: "How do I manage billing and subscriptions?",
      input: "User asks for account payment management.",
      output:
        "Open /billing for subscription controls and /pricing for plan comparisons.",
      category: "NAVIGATION",
    },
  ];
}

export function buildSiteNavigationDatasetRows() {
  return [...seedRows(), ...routeRows()];
}

export function exportSiteNavigationDatasetJsonl() {
  return buildSiteNavigationDatasetRows()
    .map((row) => JSON.stringify(row))
    .join("\n");
}
