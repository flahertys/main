import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

export function ShamrockFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] bg-black">
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-xl font-bold text-white">Trade</span>
              <span className="text-xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] text-transparent bg-clip-text">
                Hax
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              AI-powered trading platform built on Solana. Music, fintech, and
              tech services — one ecosystem.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://twitter.com/tradehaxai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-[#00F0FF] hover:border-[#00F0FF]/20 hover:bg-[#00F0FF]/5 transition-all duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/DarkModder33/main"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/tradehax-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-[#3B82F6] hover:border-[#3B82F6]/20 hover:bg-[#3B82F6]/5 transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Music Portal */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Music & Arts
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/music"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Guitar Lessons
                </Link>
              </li>
              <li>
                <Link
                  href="/music#artists"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Artist Showcase
                </Link>
              </li>
              <li>
                <Link
                  href="/music#token"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  L2 Token Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Trading Portal */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Trading & Fintech
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Trading Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  href="/todos"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Task Management
                </Link>
              </li>
              <li>
                <Link
                  href="/game"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Hyperborea Game
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Services Portal */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Tech Services
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/services"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  All Services
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Web Development
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Tech Support
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-sm text-gray-500 hover:text-[#00F0FF] transition-colors duration-200"
                >
                  Digital Marketing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600">
              &copy; {currentYear} TradeHax AI. All rights reserved.
            </p>

            <div className="flex items-center gap-6 text-xs text-gray-600">
              <a
                href="mailto:support@tradehaxai.tech"
                className="hover:text-gray-400 transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                Contact
              </a>
              <a
                href="https://github.com/DarkModder33/main"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400 transition-colors"
              >
                Documentation
              </a>
              <span className="text-gray-700">
                Privacy Policy
              </span>
            </div>
          </div>

          {/* Affiliate Disclosure */}
          <p className="text-[11px] text-gray-700 text-center mt-6">
            We may earn commissions from affiliate links. Built with Next.js &
            Solana.
          </p>
        </div>
      </div>
    </footer>
  );
}
