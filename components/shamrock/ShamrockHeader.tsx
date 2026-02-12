"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface NavItem {
  name: string;
  href: string;
  submenu?: Array<{ name: string; href: string }>;
}

const navigation: NavItem[] = [
  { name: "Home", href: "/" },
  // Portal 1: Music
  {
    name: "Music",
    href: "/music",
    submenu: [
      { name: "Guitar Lessons", href: "/music#lessons" },
      { name: "Artist Showcase", href: "/music#artists" },
      { name: "Token Roadmap", href: "/music#token" },
    ],
  },
  // Portal 2: Fintech
  {
    name: "Trading",
    href: "/dashboard",
    submenu: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Community", href: "/dashboard" },
      { name: "Livestreams", href: "/dashboard" },
    ],
  },
  // Portal 3: Tech Services
  {
    name: "Services",
    href: "/services",
    submenu: [
      { name: "Web Development", href: "/services" },
      { name: "Tech Support", href: "/services" },
      { name: "Marketing", href: "/services" },
      { name: "All Services", href: "/services" },
    ],
  },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Blog", href: "/blog" },
];

/**
 * Main navigation header with 3-pronged business structure
 * Integrates shamrock theme styling with dropdown menus
 */
export function ShamrockHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedOutside = Object.values(dropdownRefs.current).every(
        (ref) => ref && !ref.contains(target),
      );
      if (clickedOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent, itemName: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpenDropdown(openDropdown === itemName ? null : itemName);
    } else if (event.key === "Escape") {
      setOpenDropdown(null);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-black/95 via-black/90 to-black/95 backdrop-blur-xl border-b border-[#00FF41]/30 shadow-2xl shadow-[#00FF41]/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#00FF41] via-[#39FF14] to-[#00FF41] text-transparent bg-clip-text drop-shadow-[0_0_12px_rgba(0,255,65,0.6)] group-hover:drop-shadow-[0_0_20px_rgba(57,255,20,0.8)] transition-all duration-300">
              TradeHax AI
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              if (item.submenu) {
                return (
                  <div
                    key={item.name}
                    ref={(el) => {
                      dropdownRefs.current[item.name] = el;
                    }}
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(item.name)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1 text-sm font-medium transition-all duration-300 relative ${
                        isActive
                          ? "text-[#00FF41] drop-shadow-[0_0_10px_rgba(0,255,65,0.8)]"
                          : "text-gray-300 hover:text-[#39FF14] hover:drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]"
                      }`}
                      onFocus={() => setOpenDropdown(item.name)}
                      onKeyDown={(e) => handleKeyDown(e, item.name)}
                      aria-expanded={openDropdown === item.name}
                      aria-haspopup="true"
                    >
                      {item.name}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${openDropdown === item.name ? "rotate-180" : ""}`}
                      />
                    </Link>

                    {openDropdown === item.name && (
                      <div
                        className="absolute top-full left-0 mt-2 w-48 bg-gradient-to-b from-black/95 to-gray-950/90 backdrop-blur-xl border border-[#00FF41]/30 rounded-xl shadow-2xl shadow-[#00FF41]/20 py-2 animate-fade-in"
                        role="menu"
                      >
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gradient-to-r hover:from-[#003B00]/40 hover:to-[#001F00]/40 hover:text-[#00FF41] hover:drop-shadow-[0_0_8px_rgba(0,255,65,0.4)] hover:border-l-2 hover:border-[#39FF14] hover:pl-3 transition-all duration-200"
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
                  className={`text-sm font-medium transition-all duration-300 relative px-3 py-2 rounded-lg ${
                    isActive
                      ? "text-[#00FF41] drop-shadow-[0_0_10px_rgba(0,255,65,0.8)] bg-[#003B00]/20"
                      : "text-gray-300 hover:text-[#39FF14] hover:drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] hover:bg-[#001F00]/30"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-gray-300 hover:text-[#39FF14] hover:drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] transition-all duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-[#00FF41]/20 bg-gradient-to-b from-transparent to-[#003B00]/10 animate-fade-in">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#003B00]/50 to-[#001F00]/30 text-[#00FF41] drop-shadow-[0_0_8px_rgba(0,255,65,0.4)] border border-[#39FF14]/30"
                        : "text-gray-300 hover:bg-[#003B00]/30 hover:text-[#39FF14] hover:drop-shadow-[0_0_6px_rgba(57,255,20,0.5)]"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="block px-3 py-1 text-sm text-gray-400 hover:text-[#00FF41] hover:pl-4 transition-all duration-200"
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
          </div>
        )}
      </nav>
    </header>
  );
}
