import type { Metadata } from "next";
import GamePageClient from "./GamePageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hyperborea - 3D Browser Game | TradeHax AI",
  description:
    "Play Hyperborea, an Escher-inspired 3D browser game with puzzle progression, leaderboard scoring, and optional wallet-linked rewards.",
  keywords: [
    "browser game",
    "3D game",
    "Hyperborea",
    "NFT game",
    "free game",
    "blockchain game",
  ],
  openGraph: {
    title: "Hyperborea - 3D Browser Game",
    description:
      "Explore puzzle levels, collect relics, and track your score on the Hyperborea leaderboard.",
    url: "https://tradehaxai.tech/game",
    type: "website",
    images: [
      {
        url: "/og-game.svg",
        width: 1200,
        height: 630,
        alt: "Hyperborea Game",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyperborea - 3D Browser Game",
    description:
      "Play Hyperborea on tradehaxai.tech: puzzle gameplay, leaderboard scoring, and optional wallet rewards.",
    images: ["/og-game.svg"],
  },
};

export default function GamePage() {
  return <GamePageClient />;
}
