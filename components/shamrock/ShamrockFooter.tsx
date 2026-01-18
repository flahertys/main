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
              Advanced automated trading platform powered by Solana blockchain and AI technology.
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

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/music" className="shamrock-link text-sm">
                  Music Lessons
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="shamrock-link text-sm">
                  Trading Dashboard
                </Link>
              </li>
              <li>
                <Link href="/game" className="shamrock-link text-sm">
                  Hyperborea Game
                </Link>
              </li>
              <li>
                <Link href="/services" className="shamrock-link text-sm">
                  Tech Services
                </Link>
              </li>
            </ul>
          </div>

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

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@tradehaxai.tech"
                  className="shamrock-link text-sm flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  support@tradehaxai.tech
                </a>
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
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/disclaimer" className="hover:text-white transition-colors">
                Trading Disclaimer
              </Link>
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
