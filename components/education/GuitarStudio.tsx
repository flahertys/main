"use client";
import React from 'react';

export const GuitarStudio = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xs font-mono text-cyan-500 mb-4 tracking-[0.4em] uppercase">V_01: NEURAL_STUDIO</h2>
            <h3 className="text-5xl font-black text-white tracking-tighter uppercase italic">Guitar_Mastery</h3>
          </div>
          <p className="text-zinc-500 text-sm max-w-xs font-mono uppercase">Direct_Remote_Transmission_Enabled</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content & YouTube Feed */}
          <div className="lg:col-span-8 space-y-8">
            <div className="aspect-video bg-zinc-900/50 border border-white/5 rounded-[2rem] overflow-hidden relative group">
              <div className="absolute inset-0 flex items-center justify-center">
                 <p className="text-zinc-600 font-mono text-xs">INITIALIZING_YOUTUBE_API_FEED...</p>
              </div>
              {/* Replace with actual embed when ready */}
              <iframe 
                className="w-full h-full relative z-10"
                src="https://www.youtube.com/embed?listType=user_uploads&list=YOUR_CHANNEL_ID" 
                title="Latest Content"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="p-10 bg-zinc-900/40 border border-white/5 rounded-[2rem] backdrop-blur-3xl">
              <h4 className="text-2xl font-black text-white italic mb-6 uppercase">1-on-1_Remote_Training</h4>
              <p className="text-zinc-400 leading-relaxed mb-8">
                Personalized, high-bandwidth guitar instruction delivered via specialized neural links. 
                Focusing on technique, theory, and professional session preparation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="#" className="flex items-center justify-center p-4 bg-zinc-950 border border-white/5 rounded-xl hover:border-blue-500/50 transition-all text-xs font-bold text-zinc-400 hover:text-white">GOOGLE_MEET</a>
                <a href="#" className="flex items-center justify-center p-4 bg-zinc-950 border border-white/5 rounded-xl hover:border-cyan-500/50 transition-all text-xs font-bold text-zinc-400 hover:text-white">ZOOM_VIDEO</a>
                <a href="#" className="flex items-center justify-center p-4 bg-zinc-950 border border-white/5 rounded-xl hover:border-purple-500/50 transition-all text-xs font-bold text-zinc-400 hover:text-white">MS_TEAMS</a>
              </div>
            </div>
          </div>

          {/* Booking & Calendar Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2rem] h-full flex flex-col">
              <h4 className="text-xl font-black text-white italic mb-6 uppercase tracking-tight">System_Booking</h4>
              
              <div className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden mb-8 relative">
                {/* Google Calendar Embed Placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-4xl mb-4">📅</span>
                  <p className="text-xs text-zinc-500 font-mono mb-6 uppercase">Sync_with_Google_Calendar</p>
                  <button className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-cyan-500 hover:text-white transition-all">
                    BOOK_YOUR_SLOT
                  </button>
                </div>
                {/* When actual iframe is available: 
                <iframe src="https://calendar.google.com/calendar/appointments/..." className="w-full h-full border-none" /> 
                */}
              </div>

              <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                <p className="text-[10px] text-cyan-500 font-mono uppercase mb-2">Instructor_Status</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold text-white uppercase italic">LIVE_NOW</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
