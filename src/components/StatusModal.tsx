"use client";

import React from 'react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  buttonText?: string;
}

export default function StatusModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  buttonText = "Mengerti" 
}: StatusModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10' },
    error: { icon: 'error', color: 'text-error', bg: 'bg-error/10' },
    info: { icon: 'info', color: 'text-primary', bg: 'bg-primary/10' }
  };

  const current = icons[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-300 text-center">
        <div className={`w-20 h-20 ${current.bg} ${current.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {current.icon}
          </span>
        </div>
        
        <h3 className="text-xl font-black text-on-surface mb-2 font-headline leading-tight">
          {title}
        </h3>
        
        <p className="text-on-surface-variant font-medium text-sm leading-relaxed mb-8">
          {message}
        </p>
        
        <button 
          onClick={onClose}
          className={`w-full py-4 ${type === 'error' ? 'bg-error text-white shadow-error/20' : 'bg-primary text-white shadow-primary/20'} rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
