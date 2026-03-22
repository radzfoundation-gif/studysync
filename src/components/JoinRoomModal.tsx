import React, { useState } from 'react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (link: string) => Promise<void>;
}

export default function JoinRoomModal({ isOpen, onClose, onJoin }: JoinRoomModalProps) {
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!link.trim()) {
      setError('Tautan ruangan tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    try {
      await onJoin(link);
      setSuccess('Berhasil bergabung ke Ruang Belajar!');
      setTimeout(() => {
        setSuccess('');
        setLink('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal bergabung ke ruangan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={() => { if (!isLoading) onClose(); }}
      />
      <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="px-6 py-5 flex items-start justify-between relative z-10 border-b border-outline-variant/20 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">vpn_key</span>
            </div>
            <h2 className="text-lg font-black font-headline text-on-surface tracking-tight">Join Study Room</h2>
          </div>
          <button 
            disabled={isLoading}
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 relative z-10">
          <p className="text-sm font-medium text-on-surface-variant mb-6 leading-relaxed">
            Tempelkan tautan (link) undangan dari guru atau teman Anda untuk segera mendapatkan akses ke materi kelas.
          </p>

          <div className="mb-6">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Tautan Undangan</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/50 text-[20px]">link</span>
              <input 
                type="text"
                disabled={isLoading || !!success}
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError('');
                }}
                placeholder="https://studysync.app/join/biologi-dasar-123" 
                className={`w-full bg-surface-container-lowest border ${error ? 'border-error focus:ring-error/20' : 'border-outline-variant/50 focus:border-primary focus:ring-primary/20'} rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:ring-4 shadow-inner`}
              />
            </div>
            {error && (
              <p className="text-error text-[11px] font-bold mt-2 flex items-center gap-1 animate-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-[14px]">error</span> {error}
              </p>
            )}
            {success && (
              <p className="text-green-600 text-[11px] font-bold mt-2 flex items-center gap-1 animate-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> {success}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              disabled={isLoading || !!success}
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl text-sm transition-colors outline-none disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isLoading || !link.trim() || !!success}
              className="flex-[2] px-4 py-3 bg-primary text-white font-bold rounded-xl text-sm transition-all hover:bg-primary-fixed hover:text-on-primary-fixed hover:shadow-lg shadow-primary/20 active:scale-95 outline-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Menyambungkan...
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  Berhasil!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Gabung Sekarang
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
