import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSenseBlock } from '@/components/monetization/AdSenseBlock';
import { Download, Mail, Briefcase, Code, Award } from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio - Michael S. Flaherty | Full-Stack Developer & Web3 Expert',
  description: 'Professional portfolio and resume of Michael S. Flaherty. Full-stack developer specializing in Web3, blockchain, and automated trading systems.',
  openGraph: {
    title: 'Portfolio - Michael S. Flaherty',
    description: 'Full-stack developer specializing in Web3, blockchain, and automated trading systems.',
    type: 'profile',
  },
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="portfolio-container py-12">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 text-transparent bg-clip-text mb-4">
            Michael S. Flaherty
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Full-Stack Developer | Web3 Architect | Trading Systems Expert
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="/portfolio/MichaelSFlahertyResume.pdf"
              download
              onClick={() => trackEvent.downloadResume()}
              className="shamrock-button inline-flex items-center gap-2 px-6 py-3 text-lg shadow-lg hover:shadow-[#0366d6]/50"
            >
              <Download className="w-5 h-5" />
              Download Resume
            </a>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-all text-lg"
            >
              <Mail className="w-5 h-5" />
              Hire Me
            </Link>
          </div>
        </div>

        {/* Ad Placement */}
        <div className="mb-12">
          <AdSenseBlock adSlot="portfolio-top" adFormat="horizontal" className="max-w-3xl mx-auto" />
        </div>

        {/* About Section */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12 animate-slide-up">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-[#0366d6]" />
            About Me
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              I'm a passionate full-stack developer with expertise in building scalable Web3 applications,
              automated trading systems, and modern web platforms. With a strong foundation in both frontend
              and backend technologies, I specialize in creating high-performance applications that leverage
              blockchain technology and AI.
            </p>
            <p>
              My recent work includes developing TradeHax AI, an advanced automated trading platform powered
              by Solana blockchain, featuring real-time trading capabilities, wallet integration, and
              sophisticated analytics dashboards.
            </p>
          </div>
        </section>

        {/* Skills Section */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Code className="w-8 h-8 text-[#0366d6]" />
            Technical Skills
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkillCategory
              title="Frontend"
              skills={['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui']}
            />
            <SkillCategory
              title="Backend"
              skills={['Node.js', 'Python', 'REST APIs', 'GraphQL', 'WebSockets']}
            />
            <SkillCategory
              title="Web3 & Blockchain"
              skills={['Solana', 'Anchor', 'Web3.js', 'Wallet Adapters', 'Smart Contracts']}
            />
            <SkillCategory
              title="Databases"
              skills={['PostgreSQL', 'MongoDB', 'Redis', 'Prisma ORM']}
            />
            <SkillCategory
              title="DevOps & Tools"
              skills={['Git', 'Docker', 'Vercel', 'CI/CD', 'GitHub Actions']}
            />
            <SkillCategory
              title="Trading & Finance"
              skills={['Algorithmic Trading', 'Market Analysis', 'Risk Management', 'DeFi']}
            />
          </div>
        </section>

        {/* Projects Section */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Award className="w-8 h-8 text-[#0366d6]" />
            Featured Projects
          </h2>
          <div className="space-y-6">
            <ProjectCard
              title="TradeHax AI"
              description="Advanced automated trading platform powered by Solana blockchain. Features real-time trading, wallet integration, AI-driven insights, and comprehensive analytics dashboards."
              technologies={['Next.js', 'Solana', 'TypeScript', 'Tailwind CSS', 'Anchor']}
              link="https://tradehaxai.tech"
            />
            <ProjectCard
              title="Hyperborea Game"
              description="Browser-based gaming platform with NFT integration and in-game monetization. Features progressive difficulty, leaderboards, and blockchain-based achievements."
              technologies={['HTML5 Canvas', 'TypeScript', 'Web3', 'Solana NFTs']}
              link="/game"
            />
            <ProjectCard
              title="Web3 Portfolio Site"
              description="Modern portfolio website showcasing full-stack development skills with integrated monetization strategies including AdSense, email marketing, and affiliate programs."
              technologies={['Next.js 15', 'React 19', 'Tailwind CSS v4', 'TypeScript']}
              link="/"
            />
          </div>
        </section>

        {/* Contact CTA Section */}
        <section id="contact" className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8 text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Let's Work Together
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            I'm available for freelance projects, consulting, and full-time opportunities.
            Let's discuss how I can help bring your ideas to life.
          </p>
          <EmailCapture />
        </section>

        {/* Ad Placement */}
        <div className="mb-8">
          <AdSenseBlock adSlot="portfolio-bottom" adFormat="horizontal" className="max-w-3xl mx-auto" />
        </div>
      </main>

      <ShamrockFooter />
      
      {/* Floating Download Button (Mobile) */}
      <a
        href="/portfolio/MichaelSFlahertyResume.pdf"
        download
        onClick={() => trackEvent.downloadResume()}
        className="floating-download"
      >
        <Download className="w-5 h-5" />
        Resume
      </a>
    </div>
  );
}

function SkillCategory({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {skills.map((skill) => (
          <li key={skill} className="text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#0366d6] rounded-full" />
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectCard({
  title,
  description,
  technologies,
  link,
}: {
  title: string;
  description: string;
  technologies: string[];
  link: string;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-[#0366d6]/50 transition-all">
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {technologies.map((tech) => (
          <span
            key={tech}
            className="px-3 py-1 bg-[#0366d6]/20 text-[#0366d6] rounded-full text-sm"
          >
            {tech}
          </span>
        ))}
      </div>
      <a
        href={link}
        target={link.startsWith('http') ? '_blank' : undefined}
        rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="shamrock-link font-semibold"
      >
        View Project →
      </a>
    </div>
  );
}
