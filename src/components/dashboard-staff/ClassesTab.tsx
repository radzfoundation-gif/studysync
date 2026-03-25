"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ClassData {
  id: string;
  name: string;
  grade: string;
  theme_color: string;
  students: number;
  created_at: string;
}

export default function ClassesTab() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClasses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setClasses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.grade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const themeColors: Record<string, string> = {
    'bg-primary': 'bg-blue-500',
    'bg-secondary': 'bg-purple-500',
    'bg-tertiary': 'bg-orange-500',
    'bg-error': 'bg-red-500',
  };

  const getThemeColor = (theme: string) => themeColors[theme] || 'bg-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-on-surface">Kelas</h2>
          <p className="text-xs text-on-surface-variant">Lihat semua kelas yang tersedia</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/30 p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-medium focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant animate-spin">sync</span>
            <p className="text-xs text-on-surface-variant mt-2">Memuat data...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">meeting_room</span>
            <p className="text-xs text-on-surface-variant mt-2">Belum ada kelas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="group relative bg-white rounded-2xl border border-outline-variant/30 p-5 hover:border-tertiary/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${getThemeColor(cls.theme_color)} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                  </div>
                  <span className="text-[10px] font-black text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                    {cls.grade || 'Umum'}
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-on-surface mb-1 group-hover:text-tertiary transition-colors">
                  {cls.name}
                </h3>
                
                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">people</span>
                  <span>{cls.students || 0} siswa</span>
                </div>

                <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-[9px] text-on-surface-variant">
                    Dibuat: {cls.created_at ? new Date(cls.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-xl">meeting_room</span>
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface">{classes.length}</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase">Total Kelas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-600 text-xl">groups</span>
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface">
                {classes.reduce((acc, c) => acc + (c.students || 0), 0)}
              </p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase">Total Siswa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}