import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { LessonCard } from '@/components/music/LessonCard';
import { BookingCalendar } from '@/components/music/BookingCalendar';
import { CheckCircle2, Calendar, CreditCard, Video, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book Guitar Lessons | TradeHax AI Music',
  description: 'Professional guitar instruction for all skill levels. Book your remote lesson today with experienced musicians.',
  openGraph: {
    title: 'Book Guitar Lessons | TradeHax AI Music',
    description: 'Professional guitar instruction for all skill levels.',
    type: 'website',
  },
};

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/music"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Music Portal
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-6">
            Book Your Guitar Lesson
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose your package, schedule a time, and start your musical journey with expert instruction.
          </p>
        </div>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="lessons-top" adFormat="horizontal" />
        </div>

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
              description="Pick your preferred date and time with your instructor"
            />
            <BookingStep
              icon={<Video />}
              title="Join Lesson"
              description="Receive Zoom link automatically via email and join your session"
            />
          </div>
        </section>

        {/* Lesson Packages */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Available Packages
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <LessonCard
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
              level="Advanced"
              price="$100"
              packagePrice="$360 for 4 lessons"
              features={[
                'Professional techniques',
                'Performance coaching',
                'Songwriting guidance',
                'Studio production',
                'Industry insights',
                '24/7 support',
              ]}
            />
          </div>
        </section>

        {/* Booking Calendar */}
        <section className="mb-16">
          <BookingCalendar />
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
              Questions About Lessons?
            </h2>
            <p className="text-gray-400">
              Get in touch and we will help you find the perfect package for your goals.
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

function BookingStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
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
