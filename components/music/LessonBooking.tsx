'use client';

import { Calendar, Clock, Video } from 'lucide-react';
import { bookingLinks } from '@/lib/booking';

/**
 * Lesson booking component with Calendly integration
 * Handles scheduling, payment, and Zoom link distribution
 */
export function LessonBooking() {
  const handleBooking = () => {
    window.open(bookingLinks.guitarLessons, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-8">
      <h3 className="text-2xl font-bold text-white mb-6">Book Your Guitar Lesson</h3>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-[#00FF41] flex-shrink-0 mt-1" />
          <div>
            <p className="text-white font-semibold">Flexible Scheduling</p>
            <p className="text-gray-400 text-sm">Choose times that work for your schedule</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#00FF41] flex-shrink-0 mt-1" />
          <div>
            <p className="text-white font-semibold">60-Minute Sessions</p>
            <p className="text-gray-400 text-sm">Full hour of one-on-one instruction</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Video className="w-5 h-5 text-[#00FF41] flex-shrink-0 mt-1" />
          <div>
            <p className="text-white font-semibold">Remote via Zoom</p>
            <p className="text-gray-400 text-sm">Link sent automatically after booking</p>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleBooking}
        className="w-full px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-[#FF6B35] transition-all font-semibold"
      >
        Schedule Your Lesson
      </button>
    </div>
  );
}
