import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { LessonCard } from '@/components/music/LessonCard';
import { InstructorProfile } from '@/components/music/InstructorProfile';
import { Music, Guitar, Headphones, Users, ArrowRight, Star, Award } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music Lessons & Artist Platform | TradeHax AI',
  description: 'Learn guitar from professional musicians. Remote lessons, artist showcase, and future scholarship opportunities via blockchain technology.',
  keywords: 'guitar lessons, music education, artist platform, remote music lessons',
  openGraph: {
    title: 'Music Lessons & Artist Platform | TradeHax AI',
    description: 'Learn guitar from professional musicians. Remote lessons and artist showcase.',
    type: 'website',
  },
};

export default function MusicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-full mb-6">
            <Music className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">New Portal</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-6">
            Learn Guitar from Pro Musicians
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Master your musical journey with personalized remote lessons from experienced instructors.
            All skill levels welcome.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/music/lessons"
              className="shamrock-button inline-flex items-center gap-2 px-8 py-4 font-semibold text-lg"
            >
              <Guitar className="w-6 h-6" />
              Book a Lesson
            </Link>
            <Link
              href="/music/showcase"
              className="bg-gray-800 hover:bg-gray-700 text-white inline-flex items-center gap-2 px-8 py-4 rounded-lg transition-all font-semibold text-lg"
            >
              <Headphones className="w-6 h-6" />
              Artist Showcase
            </Link>
          </div>
        </div>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="music-top" adFormat="horizontal" />
        </div>

        {/* Stats Section */}
        <section className="grid md:grid-cols-4 gap-6 mb-16">
          <StatCard icon={<Users />} value="500+" label="Students Taught" />
          <StatCard icon={<Music />} value="2,000+" label="Lessons Delivered" />
          <StatCard icon={<Star />} value="4.9/5" label="Average Rating" />
          <StatCard icon={<Award />} value="15+" label="Expert Instructors" />
        </section>

        {/* Lesson Packages */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Choose Your Learning Path
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Select the package that fits your skill level and goals. All lessons include personalized
            instruction, practice materials, and Zoom access.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
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

        {/* Instructors Section */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Meet Our Instructors
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Learn from experienced musicians who have performed and taught professionally for years.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <InstructorProfile
              name="Jake Morrison"
              specialty="Rock & Blues Guitar"
              experience="12 years"
              rating={5}
            />
            <InstructorProfile
              name="Sarah Chen"
              specialty="Classical & Fingerstyle"
              experience="10 years"
              rating={5}
            />
            <InstructorProfile
              name="Marcus Johnson"
              specialty="Jazz & Improvisation"
              experience="15 years"
              rating={5}
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <ProcessStep
              number="1"
              title="Choose Package"
              description="Select the lesson package that fits your skill level"
            />
            <ProcessStep
              number="2"
              title="Schedule Time"
              description="Pick a convenient time slot with your instructor"
            />
            <ProcessStep
              number="3"
              title="Join Lesson"
              description="Receive Zoom link and join your personalized session"
            />
            <ProcessStep
              number="4"
              title="Practice & Grow"
              description="Get assignments and continue learning between lessons"
            />
          </div>
        </section>

        {/* Future Features Teaser */}
        <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-12 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Coming Soon: Music Education Scholarships
          </h2>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            We are building a blockchain-powered scholarship program to make music education
            accessible to everyone. Join our waitlist to be notified when it launches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/music/scholarships"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all font-semibold"
            >
              Learn More
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Email Capture */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Stay Updated
            </h2>
            <p className="text-gray-400">
              Get notified about new instructors, special offers, and scholarship opportunities.
            </p>
          </div>
          <EmailCapture />
        </section>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="music-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center hover:border-[#0366d6]/50 transition-all">
      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-purple-400">
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
