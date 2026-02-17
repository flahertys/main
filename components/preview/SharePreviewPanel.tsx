"use client";

import type { SharePlatform } from "@/lib/social-preview";
import {
  Check,
  Copy,
  ExternalLink,
  Facebook,
  Globe,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Twitter,
} from "lucide-react";
import { useMemo, useState } from "react";

type SharePreviewPanelProps = {
  primaryPreviewUrl: string;
  platforms: SharePlatform[];
};

function getPlatformIcon(platformId: string) {
  switch (platformId) {
    case "x":
      return <Twitter className="h-4 w-4" />;
    case "facebook":
      return <Facebook className="h-4 w-4" />;
    case "linkedin":
      return <Linkedin className="h-4 w-4" />;
    case "reddit":
      return <Globe className="h-4 w-4" />;
    case "whatsapp":
      return <MessageCircle className="h-4 w-4" />;
    case "telegram":
      return <Send className="h-4 w-4" />;
    case "email":
      return <Mail className="h-4 w-4" />;
    default:
      return <ExternalLink className="h-4 w-4" />;
  }
}

export function SharePreviewPanel({
  primaryPreviewUrl,
  platforms,
}: SharePreviewPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const labelById = useMemo(
    () =>
      platforms.reduce<Record<string, string>>((acc, platform) => {
        acc[platform.id] = platform.label;
        return acc;
      }, {}),
    [platforms],
  );

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="theme-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="theme-title text-2xl font-bold">Primary Preview Link</h2>
            <p className="theme-subtitle text-sm mt-1">
              Use this as the universal share URL across campaigns.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(primaryPreviewUrl, "primary")}
            className="theme-cta theme-cta--loud px-4 py-2.5"
          >
            {copiedId === "primary" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedId === "primary" ? "Copied" : "Copy Link"}
          </button>
        </div>
        <div className="mt-4 rounded-lg border border-[#4f678e]/40 bg-[#051222] p-3 text-xs sm:text-sm break-all text-[#cde0f3]">
          {primaryPreviewUrl}
        </div>
      </section>

      <section className="theme-panel p-5 sm:p-6">
        <h2 className="theme-title text-2xl font-bold">Platform Share Links</h2>
        <p className="theme-subtitle text-sm mt-1 mb-5">
          Each platform includes source tracking for campaign analytics.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((platform) => (
            <article key={platform.id} className="theme-grid-card">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-[#96ffc5] font-semibold">
                  {getPlatformIcon(platform.id)}
                  <span>{platform.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(platform.trackingUrl, platform.id)}
                  className="theme-cta theme-cta--compact px-3 py-1.5"
                >
                  {copiedId === platform.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-lg border border-[#4f678e]/40 bg-[#051222] p-2.5 text-[11px] sm:text-xs break-all text-[#cde0f3]">
                {platform.trackingUrl}
              </div>

              <a
                href={platform.shareComposerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="theme-cta theme-cta--secondary theme-cta--compact self-start"
              >
                Open {labelById[platform.id]} Share
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
