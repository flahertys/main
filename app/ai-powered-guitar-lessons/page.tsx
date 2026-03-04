import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import Script from "next/script";

export const metadata = createPageMetadata({
  title: "AI-Powered Guitar Lessons | TradeHax AI",
  description:
    "Accelerate guitar growth with AI-supported lesson routines, progress checkpoints, and personalized practice loops.",
  path: "/ai-powered-guitar-lessons",
  keywords: [
    "ai-powered guitar lessons",
    "online guitar lessons with ai",
    "personalized guitar practice plan",
    "beginner guitar growth system",
  ],
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do AI-powered guitar lessons improve consistency?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "By breaking practice into short, repeatable blocks and tracking progress checkpoints, AI support helps learners sustain momentum and measurable improvement.",
      },
    },
    {
      "@type": "Question",
      name: "Can beginners use this format effectively?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Beginners receive structured routines focused on timing, tone, and fretboard confidence with clear weekly goals.",
      },
    },
  ],
};

export default function AiPoweredGuitarLessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <Script id="faq-ai-guitar-lessons" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqJsonLd)}
      </Script>

      <ShamrockHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Music Growth</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">AI-Powered Guitar Lessons</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            Combine artist coaching with AI-assisted practice design to improve skill retention, confidence, and stage-readiness.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              "Daily 25-minute practice framework",
              "Weekly progress checkpoints",
              "Technique + improvisation balance",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <TrackedCtaLink
              href="/music"
              conversionId="open_lesson_studio"
              surface="seo:ai_guitar_lessons"
              conversionContext={{ placement: "hero", variant: "open_music", audience: "all" }}
              className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
            >
              Open Music Hub
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/schedule"
              conversionId="book_guitar_lesson"
              surface="seo:ai_guitar_lessons"
              conversionContext={{ placement: "hero", variant: "book_lesson", audience: "all" }}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/15"
            >
              Book Guitar Lesson
            </TrackedCtaLink>
          </div>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
