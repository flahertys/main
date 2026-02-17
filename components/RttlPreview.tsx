// Code provided by user
'use client';

import { useState } from 'react';
import { Eye, Code, Smartphone, Monitor, Tablet, Share2, Download, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RttlPreviewProps {
  content?: string;
  title?: string;
  showPremiumFeatures?: boolean;
}

/**
 * RTTL Preview Component - Real-Time Trading Live Preview
 * SEO-optimized preview system for TradeHax AI platform
 * Includes responsive preview, code view, and premium features
 */
export function RttlPreview({ 
  content = '', 
  title = 'TradeHax AI - Preview',
  showPremiumFeatures = true 
}: RttlPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'seo'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const deviceSizes = {
    desktop: 'w-full',
    tablet: 'w-[768px] mx-auto',
    mobile: 'w-[375px] mx-auto',
  };

  const handlePremiumFeature = (feature: string) => {
    // Track premium feature click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'premium_feature_click', {
        event_category: 'conversion',
        event_label: feature,
        value: 9.99,
      });
    }
    setShowPremiumModal(true);
  };

  // Generate SEO metadata from content
  const generateSEOData = () => {
    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // avg 200 words/min
    
    return {
      title: title,
      wordCount,
      charCount,
      readingTime,
      keywords: extractKeywords(content),
      metaDescription: content.slice(0, 160),
    };
  };

  const extractKeywords = (text: string): string[] => {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const words: string[] = text.toLowerCase().match(/\b\w+\b/g) ?? [];
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
    
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  };

  const seoData = generateSEOData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                RTTL Preview Studio
              </h1>
              <p className="text-gray-400">Real-Time Trading Live - SEO-Optimized Content Preview</p>
            </div>
            
            {showPremiumFeatures && (
              <Button
                onClick={() => handlePremiumFeature('preview_studio')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>
          
          {/* SEO Score Badge */}
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg border border-green-500/30">
              <span className="font-bold">SEO Score: 92/100</span>
            </div>
            <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/30">
              <span className="font-bold">Reading Time: {seoData.readingTime} min</span>
            </div>
            <div className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg border border-purple-500/30">
              <span className="font-bold">Words: {seoData.wordCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1 border border-gray-800">
            <TabButton
              icon={<Eye className="w-4 h-4" />}
              label="Preview"
              active={activeTab === 'preview'}
              onClick={() => setActiveTab('preview')}
            />
            <TabButton
              icon={<Code className="w-4 h-4" />}
              label="Code"
              active={activeTab === 'code'}
              onClick={() => setActiveTab('code')}
            />
            <TabButton
              icon={<Zap className="w-4 h-4" />}
              label="SEO"
              active={activeTab === 'seo'}
              onClick={() => setActiveTab('seo')}
            />
          </div>

          {/* Device Toggle (only for preview) */}
          {activeTab === 'preview' && (
            <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1 border border-gray-800">
              <DeviceButton
                icon={<Monitor className="w-4 h-4" />}
                active={deviceView === 'desktop'}
                onClick={() => setDeviceView('desktop')}
                tooltip="Desktop"
              />
              <DeviceButton
                icon={<Tablet className="w-4 h-4" />}
                active={deviceView === 'tablet'}
                onClick={() => setDeviceView('tablet')}
                tooltip="Tablet"
              />
              <DeviceButton
                icon={<Smartphone className="w-4 h-4" />}
                active={deviceView === 'mobile'}
                onClick={() => setDeviceView('mobile')}
                tooltip="Mobile"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePremiumFeature('share')}
              className="border-gray-700 hover:border-purple-500"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePremiumFeature('export')}
              className="border-gray-700 hover:border-purple-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 min-h-[600px]">
          
          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className={`transition-all duration-300 ${deviceSizes[deviceView]}`}> 
              <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-700 overflow-hidden shadow-2xl"> 
                {/* Browser Chrome */}
                <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700"> 
                  <div className="flex gap-2"> 
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-400 ml-4"> 
                    https://tradehaxai.tech
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-8 prose prose-invert max-w-none"> 
                  {content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: content }}
                      className="text-gray-200"
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl">No content to preview</p>
                      <p className="text-sm mt-2">Start typing to see your content come to life</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">HTML Code</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(content);
                    alert('Code copied to clipboard!');
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Copy Code
                </Button>
              </div>
              <pre className="bg-gray-950 border border-gray-800 rounded-lg p-6 overflow-auto max-h-[500px]"> 
                <code className="text-green-400 text-sm font-mono"> 
                  {content || '<!-- No content -->'}
                </code>
              </pre>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">SEO Analysis</h3>
              
              {/* SEO Metrics Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <SEOMetric
                  title="Meta Title"
                  value={seoData.title}
                  status="good"
                  detail={`${seoData.title.length} characters (optimal: 50-60)`}
                />
                <SEOMetric
                  title="Meta Description"
                  value={seoData.metaDescription + '...'}
                  status="good"
                  detail={`${seoData.metaDescription.length} characters (optimal: 150-160)`}
                />
                <SEOMetric
                  title="Word Count"
                  value={seoData.wordCount.toString()}
                  status={seoData.wordCount > 300 ? 'good' : 'warning'}
                  detail="Optimal range: 300-2000 words for SEO"
                />
                <SEOMetric
                  title="Reading Time"
                  value={`${seoData.readingTime} minutes`}
                  status="good"
                  detail="Average reading speed: 200 words/min"
                />
              </div>

              {/* Keywords */}
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-4">Top Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {seoData.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* SEO Recommendations */}
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-4">SEO Recommendations</h4>
                <ul className="space-y-3">
                  <Recommendation
                    status="good"
                    text="Title tag is optimized for length and keywords"
                  />
                  <Recommendation
                    status="good"
                    text="Meta description provides clear value proposition"
                  />
                  <Recommendation
                    status={seoData.wordCount > 300 ? 'good' : 'warning'}
                    text={seoData.wordCount > 300 
                      ? "Content length is sufficient for SEO" 
                      : "Consider adding more content (300+ words recommended)"}
                  />
                  <Recommendation
                    status="warning"
                    text="Add internal links to boost SEO authority"
                    isPremium
                    onUpgrade={() => handlePremiumFeature('seo_recommendations')}
                  />
                  <Recommendation
                    status="warning"
                    text="Optimize images with alt text for better ranking"
                    isPremium
                    onUpgrade={() => handlePremiumFeature('seo_recommendations')}
                  />
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Premium Modal */}
        {showPremiumModal && (
          <PremiumModal onClose={() => setShowPremiumModal(false)} />
        )}
      </div>
    </div>
  );
}

// Helper Components

function TabButton({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
        active
          ? 'bg-purple-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DeviceButton({ 
  icon, 
  active, 
  onClick, 
  tooltip 
}: { 
  icon: React.ReactNode; 
  active: boolean; 
  onClick: () => void; 
  tooltip: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`p-2 rounded-md transition-all ${
        active
          ? 'bg-purple-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {icon}
    </button>
  );
}

function SEOMetric({ 
  title, 
  value, 
  status, 
  detail 
}: { 
  title: string; 
  value: string; 
  status: 'good' | 'warning' | 'error';
  detail: string;
}) {
  const statusColors = {
    good: 'border-green-500/30 bg-green-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    error: 'border-red-500/30 bg-red-500/10',
  };

  const statusIcons = {
    good: '✓',
    warning: '!',
    error: '✗',
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}> 
      <div className="flex items-start justify-between mb-2"> 
        <h4 className="font-bold text-white">{title}</h4>
        <span className={`text-lg ${
          status === 'good' ? 'text-green-400' :
          status === 'warning' ? 'text-yellow-400' :
          'text-red-400'}
        `}>
          {statusIcons[status]}
        </span>
      </div>
      <p className="text-gray-300 text-sm mb-2 break-words">{value}</p>
      <p className="text-gray-500 text-xs">{detail}</p>
    </div>
  );
}

function Recommendation({ 
  status, 
  text, 
  isPremium, 
  onUpgrade 
}: { 
  status: 'good' | 'warning' | 'error';
  text: string;
  isPremium?: boolean;
  onUpgrade?: () => void;
}) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <li className="flex items-start gap-3"> 
      <span className={`text-lg ${statusColors[status]} flex-shrink-0`}> 
        {status === 'good' ? '✓' : status === 'warning' ? '!' : '✗'}
      </span>
      <span className="text-gray-300 flex-1">{text}</span>
      {isPremium && (
        <button
          onClick={onUpgrade}
          className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1 flex-shrink-0"
        >
          <Star className="w-3 h-3" />
          PRO
        </button>
      )}
    </li>
  );
}

function PremiumModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"> 
      <div className="bg-gray-900 border-2 border-purple-500 rounded-2xl max-w-2xl w-full p-8 shadow-2xl"> 
        <div className="text-center mb-6"> 
          <div className="text-6xl mb-4">⭐</div> 
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> 
            Upgrade to Premium
          </h2> 
          <p className="text-gray-400">Unlock advanced SEO tools and preview features</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8"> 
          <PremiumFeature icon="🚀" title="Advanced SEO Analysis" /> 
          <PremiumFeature icon="📊" title="Competitor Insights" /> 
          <PremiumFeature icon="🎯" title="Keyword Research" /> 
          <PremiumFeature icon="💼" title="Export Reports" /> 
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl mb-6 text-center"> 
          <div className="text-5xl font-bold mb-2">$9.99</div> 
          <div className="text-lg">per month</div> 
        </div>

        <div className="flex gap-3"> 
          <Button 
            onClick={() => {
              window.location.href = '/api/stripe/checkout';
            }} 
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
          > 
            Upgrade Now
          </Button> 
          <Button 
            onClick={onClose}
            variant="outline" 
            className="border-gray-700 hover:border-purple-500"
          > 
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  ); 
}

function PremiumFeature({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg"> 
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-white text-sm">{title}</div>
    </div>
  );
}
