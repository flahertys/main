"use client";
import React from 'react';
import Link from 'next/link';
import { GuitarStudio } from '@/components/education/GuitarStudio';

export default function MusicPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="pt-24 px-6">
        <div className="container mx-auto max-w-5xl relative z-10">
          <Link href="/" className="text-zinc-500 hover:text-white font-mono mb-12 inline-block transition-colors">
            &lt; RETURN_TO_SYSTEM
          </Link>
        </div>
      </div>
      
      <GuitarStudio />
      
      <div className="pb-24 px-6 text-center">
        <Link href="/about">
          <button className="px-10 py-5 bg-white text-black font-black rounded-full hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-105">
            MEET_THE_INSTRUCTOR
          </button>
        </Link>
      </div>
    </main>
  );
}
