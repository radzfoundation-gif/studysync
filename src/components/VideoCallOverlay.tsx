"use client";

import React, { useState, useEffect } from "react";

interface VideoCallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  userName: string;
}

export default function VideoCallOverlay({ isOpen, onClose, roomName, userName }: VideoCallOverlayProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [copying, setCopying] = useState(false);

  if (!isOpen) return null;

  // Jitsi Meet Room URL Construction
  const jitsiRoomId = `StudySync_${roomName.replace(/\s+/g, '_')}_${roomName.length}_${Math.floor(Date.now() / 1000000)}`;
  const jitsiUrl = `https://meet.jit.si/${jitsiRoomId}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName="${userName}"`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://meet.jit.si/${jitsiRoomId}`);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Overlay Header */}
      <div className="h-14 bg-surface-container-highest px-6 flex items-center justify-between border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]">videocam</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-none">Sesi Daring: {roomName}</h3>
            <p className="text-white/50 text-[10px] uppercase font-black tracking-widest mt-1">Powered by StudySync Video</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 ${
              copying ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{copying ? 'check' : 'content_copy'}</span>
            {copying ? 'Tersalin!' : 'Salin Link'}
          </button>
          
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-1.5 bg-error text-white font-bold rounded-full text-xs hover:bg-error-fixed transition-all shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">call_end</span>
            Akhiri Pertemuan
          </button>
        </div>
      </div>

      {/* Jitsi Iframe Container */}
      <div className="flex-1 relative bg-[#1e1e1e]">
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold animate-pulse">Menghubungkan ke Server Video...</p>
          </div>
        )}
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          className="w-full h-full border-none"
          onLoad={() => setIsLoaded(true)}
        ></iframe>
      </div>

      {/* Integration Tip */}
      <div className="bg-primary/10 py-2 px-4 text-center">
        <p className="text-[10px] text-primary-fixed-dim font-bold uppercase tracking-widest">
           Saran: Gunakan Headset untuk kualitas audio terbaik selama sesi daring.
        </p>
      </div>
    </div>
  );
}
