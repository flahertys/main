import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

/**
 * Footer component with shamrock theme styling
 * Includes social links, sitemap, and affiliate disclosures
 */
export function ShamrockFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#00FF41]/30 bg-gradient-to-b from-black/80 via-gray-950/90 to-black/95 backdrop-blur-xl py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 group">
            <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#00FF41] via-[#39FF14] to-[#00FF41] text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(0,255,65,0.6)] group-hover:drop-shadow-[0_0_16px_rgba(57,255,20,0.8)] transition-all duration-300 mb-3 md:mb-4">
              TradeHax AI
            </div>
            <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6 leading-relaxed hover:text-gray-300 transition-colors duration-300">
              3-portal business ecosystem: Music education, fintech trading, and
              complete tech services.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/tradehaxai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_6px_rgba(0,255,65,0.6)] transition-all duration-300 p-2 rounded-lg hover:bg-[#003B00]/20"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/DarkModder33/main"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_6px_rgba(0,255,65,0.6)] transition-all duration-300 p-2 rounded-lg hover:bg-[#003B00]/20"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/tradehax-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_6px_rgba(0,255,65,0.6)] transition-all duration-300 p-2 rounded-lg hover:bg-[#003B00]/20"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Music Portal */}
          <div className="group">
            <h3 className="text-white font-semibold mb-4 md:mb-6 text-sm md:text-base group-hover:text-[#39FF14] transition-colors duration-300">🎸 Music & Arts</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/music" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-xs md:text-sm">
                  Guitar Lessons
                </Link>
              </li>
              <li>
                <Link href="/music#artists" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Artist Showcase
                </Link>
              </li>
              <li>
                <Link href="/music#token" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  L2 Token Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Trading Portal */}
          <div className="group">
            <h3 className="text-white font-semibold mb-6 text-lg group-hover:text-[#39FF14] transition-colors duration-300">
              💰 Trading & Fintech
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Trading Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/todos" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Task Management
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Live Trading (Soon)
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Services Portal */}
          <div className="group">
            <h3 className="text-white font-semibold mb-6 text-lg group-hover:text-[#39FF14] transition-colors duration-300">💻 Tech Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/services" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  All Services
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Tech Support
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Digital Marketing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Links Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 pt-12 border-t border-[#00FF41]/20">
          {/* Resources */}
          <div className="group">
            <h3 className="text-white font-semibold mb-6 group-hover:text-[#39FF14] transition-colors duration-300">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/game" className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm">
                  Hyperborea Game
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="group">
            <h3 className="text-white font-semibold mb-6 group-hover:text-[#39FF14] transition-colors duration-300">Company</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@tradehaxai.tech"
                  className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 flex items-center gap-2 text-sm"
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
                  className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="group">
            <h3 className="text-white font-semibold mb-6 group-hover:text-[#39FF14] transition-colors duration-300">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@tradehaxai.tech"
                  className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DarkModder33/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] hover:pl-2 transition-all duration-300 block text-sm"
                >
                  Source Code
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-12 border-t border-[#00FF41]/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <p className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
              &copy; {currentYear} TradeHax AI. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <p className="text-gray-500 hover:text-gray-400 transition-colors duration-300">
                🎯 Music • Trading • Tech Services
              </p>
            </div>
          </div>

          {/* Affiliate Disclosure */}
          <p className="text-xs text-gray-500 text-center mt-6 hover:text-gray-400 transition-colors duration-300">
            🔗 We may earn commissions from affiliate links on this site. See
            our{" "}
            <a
              href="mailto:support@tradehaxai.tech"
              className="underline hover:text-[#00FF41] hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)] transition-all duration-300"
            >
              contact us
            </a>{" "}
            for details.
          </p>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 text-center mt-4 hover:text-gray-400 transition-colors duration-300">
            💡 Built with Next.js, Solana, and ❤️ | 🔒 Secured by blockchain
            technology
          </p>
        </div>
      </div>
    </footer>
  );
}
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
                <Link href="/services" className="shamrock-link text-sm">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/services" className="shamrock-link text-sm">
                  Tech Support
                </Link>
              </li>
              <li>
                <Link href="/services" className="shamrock-link text-sm">
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
                <a
                  href="mailto:support@tradehaxai.tech"
                  className="shamrock-link text-sm"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DarkModder33/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shamrock-link text-sm"
                >
                  Source Code
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
              <p className="text-gray-500">
                🎯 Music • Trading • Tech Services
              </p>
            </div>
          </div>

          {/* Affiliate Disclosure */}
          <p className="text-xs text-gray-500 text-center mt-4">
            🔗 We may earn commissions from affiliate links on this site. See
            our{" "}
            <a
              href="mailto:support@tradehaxai.tech"
              className="underline hover:text-gray-400"
            >
              contact us
            </a>{" "}
            for details.
          </p>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 text-center mt-2">
            💡 Built with Next.js, Solana, and ❤️ | 🔒 Secured by blockchain
            technology
          </p>
        </div>
      </div>
    </footer>
  );
}
