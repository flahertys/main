import { Calendar, Clock, Video } from 'lucide-react';

export function BookingCalendar() {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
      <h3 className="text-2xl font-bold text-white mb-6">Schedule Your Lesson</h3>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3 text-gray-300">
          <Calendar className="w-5 h-5 text-[#0366d6]" />
          <span>Choose your preferred date and time</span>
        </div>
        <div className="flex items-center gap-3 text-gray-300">
          <Clock className="w-5 h-5 text-[#0366d6]" />
          <span>60-minute personalized sessions</span>
        </div>
        <div className="flex items-center gap-3 text-gray-300">
          <Video className="w-5 h-5 text-[#0366d6]" />
          <span>Zoom link sent automatically</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 text-center">
        <p className="text-gray-300 mb-4">
          Booking integration coming soon! For now, please contact us to schedule.
        </p>
        <a
          href="mailto:support@tradehaxai.tech"
          className="shamrock-button inline-block px-6 py-3 font-semibold"
        >
          Contact to Book
        </a>
      </div>
    </div>
  );
}
