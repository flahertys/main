import { ShamrockHeader } from '@/components/shamrock/ShamrockHeader';
import { ShamrockFooter } from '@/components/shamrock/ShamrockFooter';
import { AdSenseBlock, InContentAd } from '@/components/monetization/AdSenseBlock';
import { PremiumBanner } from '@/components/monetization/PremiumUpgrade';
import { EmailCapture } from '@/components/EmailCapture';
import { Calendar, Clock, Share2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

// Sample blog post - in production, fetch from CMS/database
const samplePost = {
  title: 'Getting Started with Solana Trading: A Complete Guide',
  excerpt: 'Learn how to start trading on the Solana blockchain.',
  date: '2024-01-15',
  readTime: 8,
  category: 'Tutorial',
  author: 'TradeHax AI Team',
  content: `
<p>Solana has emerged as one of the fastest and most cost-effective blockchains for cryptocurrency trading.</p>

<h2>Why Trade on Solana?</h2>
<p>Solana offers several advantages for traders including lightning-fast transactions and low fees.</p>

<h2>Getting Started</h2>
<p>Follow these steps to begin your Solana trading journey.</p>
  `,
};

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  
  return {
    title: `${samplePost.title} - TradeHax AI Blog`,
    description: samplePost.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = samplePost;

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="mb-12">
          <div className="mb-6">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
            <div>By {post.author}</div>
          </div>

          <div className="mb-8">
            <AdSenseBlock adSlot="blog-post-top" adFormat="horizontal" />
          </div>

          <div 
            className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="my-12">
            <InContentAd />
          </div>
        </article>

        <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Get More Trading Insights
          </h2>
          <p className="text-gray-300 mb-6">
            Subscribe to our newsletter for weekly market analysis.
          </p>
          <EmailCapture />
        </section>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <AdSenseBlock adSlot="blog-post-bottom" adFormat="auto" />
          </div>
          <div>
            <PremiumBanner />
          </div>
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}
