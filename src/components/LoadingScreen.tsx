"use client";

import React from 'react';

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingScreen({ fullScreen = true, message = "Memuat StudySync..." }: LoadingScreenProps) {
  return (
    <div className={`${fullScreen ? 'fixed inset-0 z-[100]' : 'w-full h-full min-h-[400px] rounded-3xl overflow-hidden'} flex flex-col items-center justify-center bg-surface/90 backdrop-blur-md`}>
      <div className="relative w-28 h-28 flex items-center justify-center mb-6">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        {/* Inner pulsing ring */}
        <div className="absolute inset-3 bg-primary/30 rounded-full animate-pulse"></div>
        {/* Core Logo */}
        <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-primary to-primary-fixed text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,119,255,0.4)] transition-transform hover:scale-105">
          <span className="material-symbols-outlined text-[36px] animate-[pulse_2s_ease-in-out_infinite]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
      </div>
      
      {/* Animated Text */}
      <h2 className="text-xl font-black font-headline text-on-surface tracking-tight flex items-center gap-1">
        {message.split('').map((char, i) => (
          <span 
            key={i} 
            className="animate-[bounce_1.5s_infinite]" 
            style={{ animationDelay: `${i * 0.05}s`, display: char === ' ' ? 'inline-block' : 'inline', width: char === ' ' ? '6px' : 'auto' }}
          >
            {char}
          </span>
        ))}
      </h2>
    </div>
  );
}
