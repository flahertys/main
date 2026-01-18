import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { Code, LineChart, Users, Zap, CheckCircle2, ArrowRight, Wrench, Megaphone, Server } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional Services - Web3 Development & Trading Consulting | TradeHax AI',
  description: 'Expert Web3 development, blockchain consulting, and automated trading system implementation. Custom solutions for your business needs.',
  openGraph: {
    title: 'Professional Services - TradeHax AI',
    description: 'Expert Web3 development and trading consulting services.',
    type: 'website',
  },
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-6">
            Professional Services
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete technology solutions from Web3 development to hardware repair, social media marketing,
            and automated trading systems built by experienced developers.
          </p>
        </div>

        {/* Ad Placement */}
        <div className="mb-16">
          <AdSenseBlock adSlot="services-top" adFormat="horizontal" />
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ServiceCard
            icon={<Code className="w-10 h-10" />}
            title="Web3 Development"
            description="Custom blockchain applications, smart contracts, and decentralized platforms built with modern technologies."
            features={[
              'Solana & Ethereum development',
              'Smart contract auditing',
              'DApp architecture & design',
              'Wallet integration',
              'NFT marketplace development',
            ]}
            pricing="Starting at $5,000"
          />

          <ServiceCard
            icon={<LineChart className="w-10 h-10" />}
            title="Trading System Development"
            description="Automated trading bots, algorithmic strategies, and real-time market analysis tools."
            features={[
              'Custom trading algorithms',
              'Portfolio management systems',
              'Market data integration',
              'Risk management tools',
              'Backtesting frameworks',
            ]}
            pricing="Starting at $3,000"
          />

          <ServiceCard
            icon={<Users className="w-10 h-10" />}
            title="Consulting & Strategy"
            description="Expert guidance on blockchain adoption, DeFi strategies, and Web3 business models."
            features={[
              'Technical architecture review',
              'Blockchain strategy planning',
              'DeFi protocol optimization',
              'Team training & workshops',
              'Code review & audits',
            ]}
            pricing="$200/hour"
          />

          <ServiceCard
            icon={<Zap className="w-10 h-10" />}
            title="Full-Stack Development"
            description="Complete web applications with modern frameworks, APIs, and database architecture."
            features={[
              'Next.js & React applications',
              'Backend API development',
              'Database design & optimization',
              'Cloud deployment & DevOps',
              'Performance optimization',
            ]}
            pricing="Starting at $4,000"
          />

          <ServiceCard
            icon={<Wrench className="w-10 h-10" />}
            title="Software & Hardware Repair"
            description="Remote-first software troubleshooting and hardware diagnostic support for all your tech issues."
            features={[
              'Remote software repairs & troubleshooting',
              'Hardware diagnostic consultations',
              'Virus/malware removal',
              'System optimization & cleanup',
              'Data recovery assistance',
              'OS installation & configuration',
            ]}
            pricing="$50/hour (remote) | $100/hour (on-site)"
          />

          <ServiceCard
            icon={<Megaphone className="w-10 h-10" />}
            title="Social Media Marketing"
            description="Grow your brand with strategic social media campaigns, content creation, and community management."
            features={[
              'Social media strategy development',
              'Content creation & scheduling',
              'Community management',
              'Paid advertising campaigns (Meta, X, LinkedIn)',
              'Analytics & performance tracking',
              'Influencer collaboration setup',
            ]}
            pricing="Starting at $1,000/month"
          />

          <ServiceCard
            icon={<Server className="w-10 h-10" />}
            title="Complete Tech Solutions"
            description="End-to-end technology services including hosting, domain management, email setup, and ongoing support."
            features={[
              'Domain registration & DNS management',
              'Email hosting & configuration',
              'Cloud hosting setup (AWS, Azure, Vercel)',
              'SSL certificate installation',
              'Website maintenance & updates',
              'Technical support retainers',
            ]}
            pricing="Starting at $500/month"
          />
        </div>

        {/* Process Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How We Work
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <ProcessStep
              number="1"
              title="Discovery"
              description="We discuss your requirements, goals, and technical needs."
            />
            <ProcessStep
              number="2"
              title="Proposal"
              description="Receive a detailed project plan with timeline and pricing."
            />
            <ProcessStep
              number="3"
              title="Development"
              description="Agile development with regular updates and milestones."
            />
            <ProcessStep
              number="4"
              title="Delivery"
              description="Launch, support, and ongoing maintenance as needed."
            />
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Why Choose TradeHax AI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Benefit
              title="Proven Expertise"
              description="Successfully delivered 50+ Web3 and trading projects"
            />
            <Benefit
              title="Fast Delivery"
              description="Agile methodology ensures quick turnaround times"
            />
            <Benefit
              title="Ongoing Support"
              description="Comprehensive post-launch support and maintenance"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-12 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Let&apos;s discuss how we can bring your vision to life with cutting-edge technology
            and proven development practices.
          </p>
          
          <EmailCapture />
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold"
            >
              View Portfolio
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:support@tradehaxai.tech"
              className="inline-flex items-center gap-2 px-6 py-3 shamrock-button font-semibold"
            >
              Email Us
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Bottom Ad */}
        <div className="mb-8">
          <AdSenseBlock adSlot="services-bottom" adFormat="horizontal" />
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  features,
  pricing,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  pricing: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-[#0366d6]/50 transition-all">
      <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6 text-purple-400">
        {icon}
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      
      <ul className="space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-gray-300">
            <CheckCircle2 className="w-5 h-5 text-[#0366d6] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="pt-6 border-t border-gray-800">
        <p className="text-2xl font-bold text-white">{pricing}</p>
      </div>
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

function Benefit({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
