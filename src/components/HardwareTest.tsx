"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function HardwareTest() {
  const [ip, setIp] = useState<string>("Loading...");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Fetch IP
    fetch('https://api64.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp("Gagal memuat IP"));

    // Fetch Location - navigator is safe on client
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
           console.warn("Geolocation error:", err);
           setLocError("Akses lokasi ditolak atau tidak tersedia");
        },
        { timeout: 10000 }
      );
    } else {
      setLocError("Geolokasi tidak didukung oleh browser Anda");
    }

    return () => {
      // Cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err: any) {
      alert("Gagal mengakses kamera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 space-y-6 shadow-sm animate-in fade-in duration-700 h-full flex flex-col">
      <h3 className="text-[11px] font-black text-on-surface uppercase tracking-[0.2em] flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
        Security & Hardware Audit
      </h3>

      <div className="grid grid-cols-1 gap-4 flex-grow">
        {/* Network & Location Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-inner">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-[16px]">public</span>
              <p className="text-[9px] font-black uppercase tracking-widest">Client IP Address</p>
            </div>
            <p className="text-xs font-black text-on-surface font-mono break-all">{ip}</p>
          </div>
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-inner">
             <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <p className="text-[9px] font-black uppercase tracking-widest">Coordinates</p>
            </div>
            {location ? (
              <p className="text-xs font-black text-on-surface font-mono">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            ) : (
              <p className="text-[9px] text-on-surface-variant font-medium italic">{locError || "Mengambil data..."}</p>
            )}
          </div>
        </div>

        {/* Camera Visualizer */}
        <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-outline-variant/30 bg-surface-container shadow-inner aspect-[16/9] md:aspect-auto md:flex-grow">
          {!cameraActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white">
                <span className="material-symbols-outlined text-slate-400 text-3xl">videocam_off</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-on-surface uppercase tracking-widest">Uji Coba Visual</p>
                <p className="text-[9px] text-on-surface-variant font-medium">Verifikasi kamera sistem Anda di sini</p>
              </div>
              <button 
                onClick={startCamera}
                className="mt-2 px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-xs">videocam</span>
                Aktifkan Kamera
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 group">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Preview</span>
                 </div>
                 <button 
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/30 hover:bg-white/40 transition-all"
                >
                  Matikan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-2">
        <p className="text-[9px] text-on-surface-variant/70 font-medium italic text-center">
          *Data ini hanya bersifat lokal untuk sesi pengecekan hardware Administrator.
        </p>
      </div>
    </div>
  );
}
