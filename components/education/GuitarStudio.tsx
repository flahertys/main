"use client";
import React from 'react';

const curriculum = [
  { id: '01', title: "Neural_Theory", status: "STAGING", dur: "45m" },
  { id: '02', title: "Advanced_Fretwork_Hacking", status: "STAGING", dur: "1h" },
  { id: '03', title: "High_Bandwidth_Improvisation", status: "LOCKED", dur: "30m" },
];

export const GuitarStudio = () => {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6">
        {/* Header: The Meat & Potatoes */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-12 bg-cyan-500" />
            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.5em]">Primary_Transmission</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
            GUITAR_<span className="text-cyan-500">STUDIO</span>
          </h2>
          <p className="text-zinc-500 mt-6 max-w-2xl text-lg font-medium leading-relaxed">
            Direct 1-on-1 elite instruction from the TradeHax lead architect. 
            Bridging the gap between raw talent and high-performance session mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Visual: YouTube Console */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative p-1 glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl group">
              <div className="scanline" />
              <div className="aspect-video rounded-[2.2rem] overflow-hidden bg-black relative">
                <iframe 
                  className="w-full h-full relative z-10 opacity-90 group-hover:opacity-100 transition-opacity"
                  src="https://www.youtube.com/embed?listType=user_uploads&list=tradehax" 
                  title="TradeHax Masterclass"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            
            {/* Telemetry Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl">
                <p className="text-[10px] text-zinc-600 font-mono uppercase mb-2 tracking-widest">Active_Students</p>
                <p className="text-2xl font-black text-white italic">0x42_SECURED</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl">
                <p className="text-[10px] text-zinc-600 font-mono uppercase mb-2 tracking-widest">Latency_Rating</p>
                <p className="text-2xl font-black text-cyan-500 italic">LOW_FILTER</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl">
                <p className="text-[10px] text-zinc-600 font-mono uppercase mb-2 tracking-widest">Audio_Spec</p>
                <p className="text-2xl font-black text-white italic">48KHZ_SYNC</p>
              </div>
            </div>
          </div>

          {/* Instructor & Booking Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Solo Instructor Card */}
            <div className="p-8 bg-zinc-900/40 border border-cyan-500/20 rounded-[2.5rem] backdrop-blur-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-zinc-800 mb-6 border border-white/10 flex items-center justify-center overflow-hidden">
                  <span className="text-3xl">🎸</span>
                </div>
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">Michael S. Flaherty</h4>
                <p className="text-cyan-500 font-mono text-[10px] uppercase tracking-widest mb-6">Lead_Instructor // TradeHax_Architect</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">Methodology</span>
                    <span className="text-white">Neural_Logic</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">Focus</span>
                    <span className="text-white">Session_Mastery</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href="#" className="flex-1 py-3 bg-white text-black text-[10px] font-black rounded-xl text-center hover:bg-cyan-500 hover:text-white transition-all">ZOOM_LINK</a>
                  <a href="#" className="flex-1 py-3 border border-zinc-800 text-zinc-400 text-[10px] font-black rounded-xl text-center hover:bg-zinc-800 hover:text-white transition-all uppercase">Meet</a>
                </div>
              </div>
            </div>

            {/* Google Calendar Hub */}
            <div className="p-2 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="aspect-[4/5] rounded-[2.2rem] overflow-hidden bg-zinc-950">
                <iframe 
                  src="https://calendar.google.com/calendar/embed?src=40882fe82e5e28335d1c2cd7682e70419af64178afd29e3f81395fb43a7c253d%40group.calendar.google.com&ctz=America%2FNew_York" 
                  className="w-full h-full border-none opacity-60 hover:opacity-100 transition-opacity invert" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum Preview: The Depth */}
        <div className="mt-20 border-t border-white/5 pt-20">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-black text-white italic uppercase">Session_Archive</h3>
            <span className="text-[10px] font-mono text-zinc-600">ENCRYPTED_DATA_POOL</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {curriculum.map(lesson => (
              <div key={lesson.id} className="p-8 bg-zinc-950 border border-white/5 rounded-3xl group hover:border-cyan-500/30 transition-all cursor-pointer">
                <span className="text-[10px] font-mono text-zinc-700 block mb-4">#{lesson.id}</span>
                <h5 className="text-lg font-bold text-zinc-300 mb-2 group-hover:text-white transition-colors uppercase italic">{lesson.title}</h5>
                <div className="flex justify-between items-center mt-6">
                  <span className="text-[9px] font-mono text-cyan-500/50">{lesson.status}</span>
                  <span className="text-[9px] font-mono text-zinc-700">{lesson.dur}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
