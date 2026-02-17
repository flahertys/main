"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { id: 1, title: "Level_Scan", desc: "Select your current proficiency." },
  { id: 2, title: "Style_Selection", desc: "Which data-stream do you want to master?" },
  { id: 3, title: "Objective_Lock", desc: "What is your primary mission?" }
];

export const DiscoveryPortal = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  const nextStep = () => currentStep < steps.length ? setCurrentStep(prev => prev + 1) : setIsComplete(true);

  return (
    <div className="w-full glass-panel rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
      <div className="scanline opacity-10" />
      
      {!isComplete ? (
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Progress Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-xs font-mono text-cyan-500 tracking-[0.4em] uppercase mb-2">Step_0{currentStep}</h3>
              <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter">{steps[currentStep-1].title}</h4>
            </div>
            <div className="text-right font-mono text-[10px] text-zinc-600">
              QUALIFICATION_ACTIVE<br/>
              {currentStep}/{steps.length}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1">
            <p className="text-zinc-500 mb-8 font-mono italic text-sm">{steps[currentStep-1].desc}</p>
            
            <div className="grid grid-cols-1 gap-3">
              {currentStep === 1 && ["BEGINNER_INIT", "INTERMEDIATE_RELAY", "ADVANCED_NODE"].map(lvl => (
                <button key={lvl} onClick={nextStep} className="w-full p-5 bg-white/5 border border-white/5 rounded-xl text-left text-xs font-black text-zinc-400 hover:bg-cyan-500 hover:text-black transition-all hover:translate-x-2">
                  {lvl}
                </button>
              ))}
              {currentStep === 2 && ["BLUES_FUSION", "METAL_DYNAMICS", "JAZZ_IMPROV", "ROCK_SESSION"].map(sty => (
                <button key={sty} onClick={nextStep} className="w-full p-5 bg-white/5 border border-white/5 rounded-xl text-left text-xs font-black text-zinc-400 hover:bg-purple-500 hover:text-white transition-all hover:translate-x-2">
                  {sty}
                </button>
              ))}
              {currentStep === 3 && ["PROFESSIONAL_SESSION", "CREATIVE_FREEDOM", "TECHNICAL_SPEED"].map(obj => (
                <button key={obj} onClick={nextStep} className="w-full p-5 bg-white/5 border border-white/5 rounded-xl text-left text-xs font-black text-zinc-400 hover:bg-white hover:text-black transition-all hover:translate-x-2">
                  {obj}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex-1 flex flex-col items-center justify-center text-center"
        >
          <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-8 border border-cyan-500/50 animate-pulse">
            <span className="text-3xl text-cyan-500 font-black italic">✓</span>
          </div>
          <h3 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tighter">Profile_Verified</h3>
          <p className="text-zinc-500 max-w-sm mb-10 font-mono text-sm leading-relaxed">
            Data analysis complete. Your profile matches our elite training parameters. Finalize your link below.
          </p>
          <a 
            href="https://calendar.google.com/calendar/embed?src=40882fe82e5e28335d1c2cd7682e70419af64178afd29e3f81395fb43a7c253d%40group.calendar.google.com&ctz=America%2FNew_York"
            className="px-12 py-6 bg-cyan-500 text-black font-black rounded-2xl hover:bg-white transition-all shadow-[0_20px_50px_rgba(6,182,212,0.3)] uppercase italic"
          >
            Schedule_Masterclass
          </a>
        </motion.div>
      )}

      {/* Progress Bar Footer */}
      {!isComplete && (
        <div className="mt-12 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-500"
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
