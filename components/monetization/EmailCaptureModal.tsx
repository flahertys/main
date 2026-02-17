'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface EmailCaptureModalProps {
  title?: string;
  description?: string;
  leadMagnet?: string;
  delay?: number; // Delay before showing (ms)
}

/**
 * Exit-intent email capture modal
 * Triggers when user's mouse leaves viewport
 */
export function EmailCaptureModal({
  title = "Wait! Get Your Free Crypto Trading Guide 📈",
  description = "Join 5,000+ traders receiving daily market insights and exclusive trading strategies.",
  leadMagnet = "Crypto Trading Guide PDF",
  delay = 5000,
}: EmailCaptureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal (localStorage)
    if (typeof window === 'undefined') return;
    
    const hasSeenModal = localStorage.getItem('emailCaptureShown');
    if (hasSeenModal) return;

    const timer = setTimeout(() => {
      const handleMouseLeave = (e: MouseEvent) => {
        // Trigger when mouse leaves from top of viewport
        if (e.clientY <= 0 && !hasShown) {
          setIsOpen(true);
          setHasShown(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('emailCaptureShown', 'true');
          }
          // Track modal shown - using custom event
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'exit_intent_modal_shown', {
              event_category: 'engagement',
              event_label: 'email_capture',
            });
          }
        }
      };

      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, delay);

    return () => clearTimeout(timer);
  }, [hasShown, delay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit_intent_modal' }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        trackEvent.emailSignup('exit_intent_modal');
        
        // Close modal after 2 seconds
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Track modal closed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exit_intent_modal_closed', {
        event_category: 'engagement',
        event_label: 'email_capture',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="theme-overlay-shell fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="theme-panel relative max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#93adbb] hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text mb-4">
            {title}
          </h2>
          <p className="theme-subtitle mb-6">
            {description}
          </p>

          {status === 'success' ? (
            <div className="py-8">
              <div className="w-16 h-16 rounded-full border border-[#75f0b0]/40 bg-[#0c2519]/80 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-400 font-semibold text-lg">
                🎉 Success! Check your email for the {leadMagnet}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full rounded-lg border border-[#4aa978]/55 bg-[#081811]/82 px-4 py-3 text-[#d4ffe7] placeholder-[#7ca393] focus:outline-none focus:ring-2 focus:ring-[#76f3ad]/50 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="theme-cta theme-cta--loud w-full px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  `Get My Free ${leadMagnet} →`
                )}
              </button>
              {status === 'error' && (
                <p className="text-red-400 text-sm">
                  ✗ Something went wrong. Please try again.
                </p>
              )}
            </form>
          )}

          <p className="text-[#8ca4b2] text-xs mt-4">
            🔒 We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
