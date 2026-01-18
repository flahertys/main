import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { LessonCard } from '@/components/music/LessonCard';
import { LessonBooking } from '@/components/music/LessonBooking';
import { ArtistCard } from '@/components/music/ArtistCard';
import { TokenRoadmap } from '@/components/music/TokenRoadmap';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { Music, Guitar, Users, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music & Arts Platform - Remote Guitar Lessons & Artist Showcase | TradeHax AI',
  description: 'Learn guitar online with professional instructors. Showcase your music, earn tips, and join the L2 token revolution for music education.',
  openGraph: {
    title: 'Music & Arts Platform - TradeHax AI',
    description: 'Remote guitar lessons, artist showcase, and music education scholarships.',
    type: 'website',
  },
};

export default function MusicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/20 to-purple-600/20 blur-3xl -z-10" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35]/20 border border-[#FF6B35]/30 rounded-full text-[#FF6B35] text-sm font-semibold mb-6">
            <Music className="w-4 h-4" />
            <span>Music Education & Artist Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#FF6B35] to-purple-400 text-transparent bg-clip-text">
              Master Your Craft
            </span>
            <br />
            <span className="text-white">Share Your Music</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Professional remote guitar lessons, artist showcase platform, and revolutionary 
            music education scholarships powered by blockchain technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#lessons"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FF6B35] to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-[#FF6B35] transition-all font-semibold text-lg"
            >
              <Guitar className="w-5 h-5" />
              Book a Lesson
            </a>
            <a
              href="#artists"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold text-lg"
            >
              <Users className="w-5 h-5" />
              Explore Artists
            </a>
          </div>
        </div>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="music-top" adFormat="horizontal" />
        </div>

        {/* Guitar Lessons Section */}
        <section id="lessons" className="mb-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Remote Guitar Lessons
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              One-on-one instruction from experienced musicians. All skill levels welcome.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <LessonCard
              title="Beginner"
              level="Perfect for those just starting out"
              price="$50/lesson"
              packagePrice="$180"
              features={[
                'Basic chord progressions',
                'Strumming patterns',
                'Music theory fundamentals',
                'Song learning techniques',
                'Personalized practice plans',
              ]}
            />

            <LessonCard
              title="Intermediate"
              level="For players ready to advance"
              price="$75/lesson"
              packagePrice="$270"
              features={[
                'Advanced techniques',
                'Scale mastery',
                'Improvisation skills',
                'Genre-specific styles',
                'Performance coaching',
              ]}
              popular={true}
            />

            <LessonCard
              title="Advanced"
              level="Master level instruction"
              price="$100/lesson"
              packagePrice="$360"
              features={[
                'Complex compositions',
                'Professional recording tips',
                'Career development',
                'Music production basics',
                'Industry networking',
              ]}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <LessonBooking />
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Group Workshops</h3>
              <p className="text-gray-300 mb-6">
                Learn alongside fellow musicians in our interactive group sessions. 
                Minimum 4 students, maximum 8 per workshop.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price per person</span>
                  <span className="text-2xl font-bold text-white">$30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-semibold">90 minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Format</span>
                  <span className="text-white font-semibold">Live via Zoom</span>
                </div>
              </div>
              <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold">
                Join Next Workshop
              </button>
            </div>
          </div>

          {/* Instructor Profiles */}
          <div className="mt-12 bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Meet Your Instructors</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  JD
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">John Davis</h4>
                  <p className="text-[#FF6B35] text-sm font-semibold mb-2">Lead Guitar Instructor</p>
                  <p className="text-gray-400 text-sm">
                    15+ years teaching experience. Berklee College of Music graduate. 
                    Specializes in rock, blues, and jazz techniques.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  SM
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Sarah Martinez</h4>
                  <p className="text-[#FF6B35] text-sm font-semibold mb-2">Classical & Acoustic Specialist</p>
                  <p className="text-gray-400 text-sm">
                    Master&apos;s degree in Music Performance. 20+ years playing professionally. 
                    Expert in fingerstyle and classical guitar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Artist Showcase Section */}
        <section id="artists" className="mb-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Artist Showcase
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover talented musicians, support their work with SOL tips, and follow your favorites.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ArtistCard
              name="Alex Rivera"
              instrument="Electric Guitar"
              bio="Blues and rock guitarist with a passion for improvisation. Currently working on my debut album featuring original compositions."
              followers={1247}
            />
            
            <ArtistCard
              name="Maya Chen"
              instrument="Acoustic Guitar & Vocals"
              bio="Singer-songwriter blending folk and indie styles. Creating music that tells stories and connects hearts."
              followers={892}
            />
            
            <ArtistCard
              name="Marcus Johnson"
              instrument="Jazz Guitar"
              bio="Jazz fusion artist exploring the boundaries between traditional jazz and modern electronic music."
              followers={2103}
            />
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Become a Featured Artist
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Upload your music, gain followers, and earn SOL tips from your fans. 
              Our discovery algorithm helps talented artists reach new audiences.
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-[#FF6B35] to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-[#FF6B35] transition-all font-semibold">
              Submit Your Profile
            </button>
          </div>
        </section>

        {/* Token Roadmap Section */}
        <section id="token" className="mb-20 scroll-mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Coming Soon</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              L2 Utility Token
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Revolutionary blockchain-powered music education scholarships and community governance.
            </p>
          </div>

          <TokenRoadmap />
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Student Success Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#FF6B35]">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                &quot;John&apos;s teaching style is incredible! I went from struggling with basic chords 
                to playing my first song in just 3 months.&quot;
              </p>
              <p className="text-white font-semibold">- Emily T.</p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#FF6B35]">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                &quot;The artist platform helped me gain 500+ followers in my first month. 
                The SOL tips are a game-changer!&quot;
              </p>
              <p className="text-white font-semibold">- Carlos M.</p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#FF6B35]">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                &quot;Sarah&apos;s expertise in classical guitar is unmatched. Best investment 
                I&apos;ve made in my musical journey.&quot;
              </p>
              <p className="text-white font-semibold">- Rachel K.</p>
            </div>
          </div>
        </section>

        {/* Cross-Promotion */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/services"
              className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-8 hover:border-blue-500/50 transition-all group"
            >
              <TrendingUp className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Need a Music Website?
              </h3>
              <p className="text-gray-300 mb-4">
                Check out our professional web development services to build your online presence.
              </p>
              <span className="inline-flex items-center gap-2 text-blue-400 font-semibold">
                Explore Services
                <ArrowRight className="w-5 h-5" />
              </span>
            </Link>

            <Link
              href="/dashboard"
              className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-8 hover:border-green-500/50 transition-all group"
            >
              <TrendingUp className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                Fund Your Music Career
              </h3>
              <p className="text-gray-300 mb-4">
                Learn smart trading strategies to support your musical ambitions.
              </p>
              <span className="inline-flex items-center gap-2 text-green-400 font-semibold">
                Explore Trading
                <ArrowRight className="w-5 h-5" />
              </span>
            </Link>
          </div>
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
