'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavItem {
  name: string;
  href: string;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Trading', href: '/trading' },
  { name: 'Services', href: '/services' },
  { name: 'AI Hub', href: '/ai-hub' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Contact', href: '/schedule' },
];

export function ShamrockHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#02060d]/85 backdrop-blur-xl border-b border-[#4f678e]/35 shadow-[0_1px_30px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-semibold text-white tracking-[0.2em] uppercase group-hover:text-[#8fffb6] transition-colors duration-300">
              TradeHax
            </span>
            <span className="text-sm font-semibold bg-gradient-to-r from-[#00ff41] to-[#8fffb6] text-transparent bg-clip-text uppercase tracking-[0.2em]">
              AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[#8fffb6]'
                      : 'text-[#9cadcc] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right side - Wallet CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/schedule"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-[#00ff41]/10 border border-[#00ff41]/35 text-[#8fffb6] text-sm font-medium hover:bg-[#00ff41]/20 hover:border-[#00ff41]/55 transition-all duration-300"
            >
              Book Now
            </Link>

            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-[#9cadcc] hover:text-white hover:bg-white/[0.06] transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-[#4f678e]/35 animate-slide-up-fade">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#00ff41]/10 text-[#8fffb6]'
                      : 'text-[#9cadcc] hover:bg-white/[0.04] hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile primary CTA */}
            <div className="pt-3 mt-3 border-t border-[#4f678e]/35">
              <Link
                href="/schedule"
                className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-[#00ff41]/10 border border-[#00ff41]/35 text-[#8fffb6] text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
