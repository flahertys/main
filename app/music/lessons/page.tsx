import { EmailCapture } from '@/components/EmailCapture';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { BookingCalendar } from '@/components/music/BookingCalendar';
import { InstagramReelEmbed } from '@/components/music/InstagramReelEmbed';
import { LessonCard } from '@/components/music/LessonCard';
import { LessonStudioEmbed } from '@/components/music/LessonStudioEmbed';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { createPageMetadata } from "@/lib/seo";
import { ArrowLeft, BrainCircuit, Calendar, CheckCircle2, CreditCard, Gem, Shield, Swords, Trophy, UserRound, Video } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = createPageMetadata({
  title: 'Book Online Guitar Lessons | TradeHax AI',
  description:
    'Fortress-themed AI guitar lesson hub with gamified milestones, crypto-linked rewards roadmap, and zero-cost embedded lesson rooms.',
  path: '/music/lessons',
  keywords: [
    'online guitar lessons',
    'ai guitar lessons',
    'gamified guitar lessons',
    'celtic nordic guitar academy',
    'guitar lessons philadelphia',
    'remote guitar teacher',
    'beginner guitar lessons',
    'advanced guitar coaching',
  ],
});

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#071017] to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/music"
          className="inline-flex items-center gap-2 text-cyan-200/70 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Music Services
        </Link>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-black to-cyan-950/30 px-6 py-10 sm:px-10 sm:py-14 mb-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(16,185,129,0.22),transparent_40%),radial-gradient(circle_at_84%_30%,rgba(34,211,238,0.18),transparent_36%)]" />
          <div className="relative z-10 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-200">
              <Shield className="h-3.5 w-3.5" /> Celtic • Germanic • Nordic Digital Fortress
            </p>
            <h1 className="mt-5 text-4xl md:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-200 to-cyan-400">
              Guitar Lessons Are The Heart
            </h1>
            <p className="mt-5 text-lg text-cyan-100/85 max-w-4xl mx-auto leading-relaxed">
              This page is your flagship conversion engine: elite guitar coaching powered by AI smart lessons, milestone rewards,
              and low-overhead live instruction that feeds growth across your entire TradeHax service ecosystem.
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-emerald-200/85">
              Single-Teacher Promise: every lesson is taught directly by the TradeHax founder.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="#studio" className="rounded-lg border border-emerald-300/50 bg-emerald-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-100 hover:bg-emerald-500/30">Enter Live Studio</a>
              <a href="#reward-forge" className="rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/30">View Milestone Rewards</a>
              <Link href="/ai-hub?source=lessons-heart" className="rounded-lg border border-fuchsia-300/50 bg-fuchsia-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-fuchsia-100 hover:bg-fuchsia-500/30">Open AI Coach</Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-16">
          <FortressPillar icon={<Swords className="h-5 w-5" />} title="Skill First" text="Guitar mastery is the primary trust signal that brings students and future clients into your ecosystem." />
          <FortressPillar icon={<BrainCircuit className="h-5 w-5" />} title="AI Smart Lessons" text="Adaptive practice plans, progression checkpoints, and goal-focused coaching prompts each week." />
          <FortressPillar icon={<Gem className="h-5 w-5" />} title="Reward Economy" text="Milestones prepare students for NFT badges, crypto rewards, and gamified community progression." />
        </div>

        <section className="mb-16 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-black via-emerald-950/20 to-cyan-950/20 p-6 sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-200">
            <UserRound className="h-3.5 w-3.5" /> Meet Your Teacher
          </div>

          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="rounded-xl border border-cyan-400/30 bg-black/50 p-4">
              <div className="mx-auto mb-3 flex h-32 w-32 items-center justify-center rounded-full border border-emerald-300/45 bg-gradient-to-br from-emerald-500/25 to-cyan-500/20 text-3xl font-black text-emerald-100">
                MSF
              </div>
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-cyan-200/75">Founder Portrait Frame</p>
              <p className="mt-2 text-center text-xs text-cyan-100/70">Michael S. Flaherty</p>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white">Michael S. Flaherty</h2>
              <p className="mt-3 text-cyan-100/85 leading-relaxed">
                I started playing guitar in 1995 and began teaching professionally at Hutchinson&apos;s Music Shoppe from 1999 to 2001.
                Since then, I&apos;ve delivered countless one-on-one lessons. Today, that same personal instruction is delivered remotely,
                with AI-tailored planning to match each student&apos;s exact goals, speed, and learning style.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TeacherFact label="Experience" value="Playing since 1995 • 25+ years active musicianship" />
                <TeacherFact label="Teaching Track Record" value="Hutchinson’s Music Shoppe (1999–2001) + extensive 1:1 coaching" />
                <TeacherFact label="Current Format" value="Remote one-on-one sessions with optional in-site studio room" />
                <TeacherFact label="Instruction Philosophy" value="Precision fundamentals, creative songwriting, measurable weekly progress" />
              </div>

              <blockquote className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
                “Guitar is the heart of this business. My job is to coach you with clarity, discipline, and creativity—then use smart AI tools
                to personalize every step so your progress is real, trackable, and motivating.”
              </blockquote>

              <div className="mt-4 rounded-xl border border-cyan-400/30 bg-black/45 p-3 sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/80 mb-2">Live Performance Clip</p>
                <div className="mx-auto max-w-[340px] overflow-hidden rounded-xl border border-cyan-300/25 bg-black/70 p-2">
                  <InstagramReelEmbed
                    permalink="https://www.instagram.com/reel/DUZmJ_cApag/"
                    caption="Tap audio inside the reel player if needed. This clip showcases real playing tone and phrasing used in lessons."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="lessons-top" adFormat="horizontal" />
        </div>

        {/* AI Smart Lesson Architecture */}
        <section className="bg-black/50 border border-cyan-500/25 rounded-2xl p-6 sm:p-8 mb-16">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-cyan-100 mb-6">
            AI Smart Lesson Pipeline
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <PipelineStep step="01" title="Intake + Baseline" text="Capture goals, playing level, and musical taste. Generate a personalized roadmap." />
            <PipelineStep step="02" title="Weekly Battle Plan" text="AI-guided drills, songs, and timing targets with measurable outcomes for each session." />
            <PipelineStep step="03" title="Session Execution" text="Live instruction in the fortress studio with option for teacher-only, duet, or group formats." />
            <PipelineStep step="04" title="XP + Rewards" text="Track streaks, unlock badges, and prepare milestone metadata for future NFT/reward issuance." />
          </div>
        </section>

        {/* Embedded Studio */}
        <section id="studio" className="mb-16 scroll-mt-24">
          <LessonStudioEmbed />
        </section>

        {/* How Booking Works */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Simple 3-Step Process
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <BookingStep
              icon={<CreditCard />}
              title="Select & Pay"
              description="Choose your lesson package and complete secure payment via Stripe"
            />
            <BookingStep
              icon={<Calendar />}
              title="Schedule"
              description="Pick your preferred date and time to train directly with your teacher"
            />
            <BookingStep
              icon={<Video />}
              title="Join Lesson"
              description="Receive Google Meet link automatically via email and join your session"
            />
          </div>
        </section>

        {/* Lesson Packages */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Lesson Packages
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <LessonCard
              title="Start Your Journey"
              level="Beginner Package"
              price="$50"
              packagePrice="$180 for 4 lessons"
              features={[
                'Basic guitar fundamentals',
                'Chord progressions',
                'Strumming patterns',
                'Song tutorials',
                'Practice exercises',
                'Email support',
              ]}
            />

            <LessonCard
              title="Level Up Your Skills"
              level="Intermediate"
              price="$75"
              packagePrice="$270 for 4 lessons"
              features={[
                'Advanced techniques',
                'Music theory basics',
                'Improvisation skills',
                'Genre specialization',
                'Recording tips',
                'Priority scheduling',
              ]}
              popular
            />

            <LessonCard
              title="Master the Craft"
              level="Advanced"
              price="$100"
              packagePrice="$360 for 4 lessons"
              features={[
                'Professional techniques',
                'Performance coaching',
                'Songwriting guidance',
                'Studio production',
                'Industry insights',
                'Priority support',
              ]}
            />
          </div>
        </section>

        {/* Booking Calendar */}
        <section className="mb-16">
          <BookingCalendar />
        </section>

        {/* Rewards + Milestones */}
        <section id="reward-forge" className="scroll-mt-24 bg-gradient-to-br from-[#0f172a]/70 via-black to-[#042f2e]/50 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 mb-16">
          <div className="mb-6 flex items-center gap-2 text-emerald-200">
            <Trophy className="h-5 w-5" />
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide">Reward Forge Milestones</h2>
          </div>
          <p className="text-cyan-100/80 mb-6 max-w-4xl">
            Industry-standard approach: start with transparent milestones and non-financial recognition, then progressively attach crypto utility
            as compliance and token mechanics mature. This keeps your overhead low while building strong retention loops.
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80 mb-6">
            One teacher · one standard · consistent coaching lineage
          </p>

          <div className="overflow-x-auto rounded-xl border border-emerald-400/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-500/15 text-emerald-100 uppercase text-xs tracking-[0.16em]">
                <tr>
                  <th className="px-4 py-3">Milestone</th>
                  <th className="px-4 py-3">Student Achievement</th>
                  <th className="px-4 py-3">Reward Layer</th>
                  <th className="px-4 py-3">Business Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/15 text-cyan-100/85">
                <tr>
                  <td className="px-4 py-3 font-semibold">Rune I</td>
                  <td className="px-4 py-3">First 4 lessons completed</td>
                  <td className="px-4 py-3">Digital badge + referral code unlock</td>
                  <td className="px-4 py-3">Increases retention + referrals</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Rune II</td>
                  <td className="px-4 py-3">First song performed cleanly</td>
                  <td className="px-4 py-3">NFT-ready metadata certificate (future mint)</td>
                  <td className="px-4 py-3">Shareable social proof</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Rune III</td>
                  <td className="px-4 py-3">12-lesson streak + skill review</td>
                  <td className="px-4 py-3">Priority booking + bonus AI plan</td>
                  <td className="px-4 py-3">Higher LTV and upsell readiness</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Legend Tier</td>
                  <td className="px-4 py-3">Original songwriting showcase</td>
                  <td className="px-4 py-3">Featured artist slot + token utility candidate</td>
                  <td className="px-4 py-3">Brand authority + community growth</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* What You Get */}
        <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Every Lesson Includes
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Feature text="60-minute personalized instruction" />
            <Feature text="Custom practice plan and exercises" />
            <Feature text="Video recording of your lesson" />
            <Feature text="Sheet music and tabs provided" />
            <Feature text="Progress tracking and feedback" />
            <Feature text="Email support between lessons" />
          </div>
        </section>

        {/* Email Capture */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Want the Best Plan For Your Skill Level?
            </h2>
            <p className="text-gray-400">
              Send your goals and we’ll route you to the right package, room mode, and AI progression track.
            </p>
          </div>
          <EmailCapture />
        </section>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="lessons-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function FortressPillar({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-black/45 p-4">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-500/15 text-emerald-200">
        {icon}
      </div>
      <h3 className="text-lg font-bold uppercase tracking-wide text-white">{title}</h3>
      <p className="mt-2 text-sm text-cyan-100/75">{text}</p>
    </div>
  );
}

function PipelineStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-cyan-500/25 bg-black/45 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{step}</p>
      <h3 className="mt-2 text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-cyan-100/75">{text}</p>
    </div>
  );
}

function TeacherFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-500/25 bg-black/45 p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">{label}</p>
      <p className="mt-1 text-sm text-cyan-100/85">{value}</p>
    </div>
  );
}

function BookingStep({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-purple-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-[#0366d6] flex-shrink-0 mt-0.5" />
      <span className="text-gray-300">{text}</span>
    </div>
  );
}
