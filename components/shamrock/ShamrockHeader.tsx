'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Wallet } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NavItem {
  name: string;
  href: string;
  submenu?: Array<{ name: string; href: string }>;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/' },
  {
    name: 'Music',
    href: '/music',
    submenu: [
      { name: 'Guitar Lessons', href: '/music#lessons' },
      { name: 'Artist Showcase', href: '/music#artists' },
      { name: 'Token Roadmap', href: '/music#token' },
    ],
  },
  {
    name: 'Trading',
    href: '/dashboard',
    submenu: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Community', href: '/dashboard' },
      { name: 'Livestreams', href: '/dashboard' },
    ],
  },
  {
    name: 'Services',
    href: '/services',
    submenu: [
      { name: 'Web Development', href: '/services' },
      { name: 'Tech Support', href: '/services' },
      { name: 'Marketing', href: '/services' },
      { name: 'All Services', href: '/services' },
    ],
  },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Blog', href: '/blog' },
];

export function ShamrockHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutside = Object.values(dropdownRefs.current).every(
        (ref) => ref && !ref.contains(target)
      );
      if (clickedOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent, itemName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpenDropdown(openDropdown === itemName ? null : itemName);
    } else if (event.key === 'Escape') {
      setOpenDropdown(null);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_30px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold text-white tracking-tight group-hover:text-[#00F0FF] transition-colors duration-300">
              Trade
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] text-transparent bg-clip-text">
              Hax
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + '/');

              if (item.submenu) {
                return (
                  <div
                    key={item.name}
                    ref={(el) => {
                      dropdownRefs.current[item.name] = el;
                    }}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.name)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-[#00F0FF]'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                      onFocus={() => setOpenDropdown(item.name)}
                      onKeyDown={(e) => handleKeyDown(e, item.name)}
                      aria-expanded={openDropdown === item.name}
                      aria-haspopup="true"
                    >
                      {item.name}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          openDropdown === item.name ? 'rotate-180' : ''
                        }`}
                      />
                    </Link>

                    {openDropdown === item.name && (
                      <div
                        className="absolute top-full left-0 mt-1 w-52 bg-[#111111]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 py-1.5 animate-slide-up-fade"
                        role="menu"
                      >
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150 mx-1.5 rounded-lg"
                            role="menuitem"
                          >
                            {subitem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[#00F0FF]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right side — Wallet CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium hover:bg-[#00F0FF]/20 hover:border-[#00F0FF]/30 transition-all duration-300"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Link>

            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
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
          <div className="md:hidden py-4 space-y-1 border-t border-white/[0.06] animate-slide-up-fade">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + '/');
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#00F0FF]/10 text-[#00F0FF]'
                        : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="block px-3 py-2 text-sm text-gray-500 hover:text-white transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile wallet CTA */}
            <div className="pt-3 mt-3 border-t border-white/[0.06]">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
