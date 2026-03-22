import React, { useState, useEffect } from 'react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  id?: string;
}

export default function ShareLinkModal({ isOpen, onClose, className = "Kelas", id }: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [mockLink, setMockLink] = useState("");

  // Generate link once per open so it doesn't change on render
  useEffect(() => {
    if (isOpen) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      // Use actual ID if provided, otherwise fallback to mock for safety
      if (id) {
        setMockLink(`${baseUrl}/join/${id}`);
      } else {
        const slug = className.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setMockLink(`${baseUrl}/join/${slug}-${Math.floor(Math.random() * 1000)}`);
      }
      setCopied(false);
    }
  }, [isOpen, className, id]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mockLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text: ', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-outline-variant/30 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 flex items-start justify-between">
          <div className="w-12 h-12 bg-primary-container/50 text-primary rounded-2xl flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[24px]">link</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-6 pb-8">
          <h2 className="text-xl font-black font-headline text-on-surface mb-2 tracking-tight">Bagikan Tautan Kelas</h2>
          <p className="text-sm font-medium text-on-surface-variant mb-6 leading-relaxed">
            Kirimkan tautan ini kepada siswa untuk bergabung secara otomatis ke kelas <strong className="text-on-surface drop-shadow-sm">{className}</strong> beserta seluruh modul silabusnya.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 p-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl relative">
            <input 
              readOnly 
              value={mockLink} 
              className="flex-1 bg-transparent px-3 py-2 text-sm text-on-surface outline-none font-mono selection:bg-primary-container overflow-hidden text-ellipsis whitespace-nowrap"
            />
            <button 
              onClick={handleCopy}
              className={`px-4 py-3 sm:py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-primary text-white hover:bg-primary-fixed hover:text-on-primary-fixed shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95'}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
