'use client'

import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/todo-analytics'

export function PremiumUpsell({ onClose }: { onClose: () => void }) {
  
  const handleUpgrade = async () => {
    trackEvent.premiumUpgradeClick('todo_modal')
    
    // TODO: Implement Stripe checkout
    // For demo purposes, show alert
    alert('Premium upgrade feature coming soon! This will redirect to Stripe checkout.')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Upgrade to Premium</h2>
          <p className="text-gray-600 dark:text-gray-400">Unlock unlimited productivity power</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <div className="text-2xl mb-2">∞</div>
            <div className="font-semibold text-gray-900 dark:text-white">Unlimited Tasks</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">No more limits</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
            <div className="text-2xl mb-2">☁️</div>
            <div className="font-semibold text-gray-900 dark:text-white">Cloud Sync</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Access anywhere</div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-950/30 p-4 rounded-lg">
            <div className="text-2xl mb-2">📅</div>
            <div className="font-semibold text-gray-900 dark:text-white">Due Dates</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Never miss deadlines</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
            <div className="text-2xl mb-2">🚫</div>
            <div className="font-semibold text-gray-900 dark:text-white">Ad-Free</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Focus on work</div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl mb-6 text-center">
          <div className="text-5xl font-bold mb-2">$4.99</div>
          <div className="text-lg">per month</div>
          <div className="text-sm opacity-80 mt-2">Cancel anytime • 7-day money-back guarantee</div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          <Button 
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
          >
            Upgrade Now
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            className="px-8"
          >
            Maybe Later
          </Button>
        </div>

        {/* Social Proof */}
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          ⭐⭐⭐⭐⭐ Rated 4.9/5 by 1,247 users
        </div>
      </div>
    </div>
  )
}
