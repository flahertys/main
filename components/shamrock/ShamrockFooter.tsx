import Link from 'next/link';
import { Github, Twitter, Mail, Linkedin } from 'lucide-react';

/**
 * Footer component with shamrock theme styling
 * Includes social links, sitemap, and affiliate disclosures
 */
export function ShamrockFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-4">
              TradeHax AI
            </div>
            <p className="text-gray-400 text-sm mb-4">
              3-portal business ecosystem: Music education, fintech trading, and complete tech services.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/tradehaxai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#0366d6] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/DarkModder33/main"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#0366d6] transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#0366d6] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Music Portal */}
          <div>
            <h3 className="text-white font-semibold mb-4">🎸 Music & Arts</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/music" className="shamrock-link text-sm">
                  Guitar Lessons
                </Link>
              </li>
              <li>
                <Link href="/music#artists" className="shamrock-link text-sm">
                  Artist Showcase
                </Link>
              </li>
              <li>
                <Link href="/music#token" className="shamrock-link text-sm">
                  L2 Token Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Trading Portal */}
          <div>
            <h3 className="text-white font-semibold mb-4">💰 Trading & Fintech</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="shamrock-link text-sm">
                  Trading Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard#community" className="shamrock-link text-sm">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/dashboard#live" className="shamrock-link text-sm">
                  Live Trading (Soon)
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Services Portal */}
          <div>
            <h3 className="text-white font-semibold mb-4">💻 Tech Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/services" className="shamrock-link text-sm">
                  All Services
                </Link>
              </li>
              <li>
                <Link href="/services#webdev" className="shamrock-link text-sm">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/services#support" className="shamrock-link text-sm">
                  Tech Support
                </Link>
              </li>
              <li>
                <Link href="/services#marketing" className="shamrock-link text-sm">
                  Digital Marketing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Links Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pt-8 border-t border-gray-800">
          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="shamrock-link text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="shamrock-link text-sm">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/game" className="shamrock-link text-sm">
                  Hyperborea Game
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@tradehaxai.tech"
                  className="shamrock-link text-sm flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DarkModder33/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shamrock-link text-sm"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="shamrock-link text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="shamrock-link text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="shamrock-link text-sm">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} TradeHax AI. All rights reserved.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <p className="text-gray-500">
                🎯 Music • Trading • Tech Services
              </p>
            </div>
          </div>
          
          {/* Affiliate Disclosure */}
          <p className="text-xs text-gray-500 text-center mt-4">
            🔗 We may earn commissions from affiliate links on this site. See our{' '}
            <Link href="/disclaimer" className="underline hover:text-gray-400">
              disclaimer
            </Link>{' '}
            for details.
          </p>
          
          {/* Additional Info */}
          <p className="text-xs text-gray-500 text-center mt-2">
            💡 Built with Next.js, Solana, and ❤️ | 🔒 Secured by blockchain technology
          </p>
        </div>
      </div>
    </footer>
  );
}
