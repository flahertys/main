import { createPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Book Online Guitar Lessons | TradeHax AI",
  description:
    "Fortress-themed AI guitar lesson hub with gamified milestones, crypto-linked rewards roadmap, and zero-cost embedded lesson rooms.",
  path: "/music",
  keywords: [
    "online guitar lessons",
    "ai guitar lessons",
    "gamified guitar lessons",
    "celtic nordic guitar academy",
    "guitar lessons philadelphia",
    "remote guitar teacher",
    "beginner guitar lessons",
    "advanced guitar coaching",
  ],
});

export default function MusicPage() {
  redirect('/music/lessons');
}
