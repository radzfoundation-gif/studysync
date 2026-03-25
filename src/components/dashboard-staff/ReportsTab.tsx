"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ReportsTabProps {
  stats: {
    students: number;
    teachers: number;
    classes: number;
    assignments: number;
  };
}

export default function ReportsTab({ stats }: ReportsTabProps) {
  const [reportType, setReportType] = useState("siswa");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateReport = async (type: string) => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const exportToPDF = async () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert("Laporan berhasil di-export! (Fitur ini memerlukan implementasi backend PDF)");
    }, 1500);
  };

  const reportTypes = [
    { id: 'siswa', icon: 'school', label: 'Laporan Data Siswa', description: 'Cetak data lengkap siswa sekolah' },
    { id: 'guru', icon: 'groups', label: 'Laporan Data Guru', description: 'Cetak data guru dan staff pengajar' },
    { id: 'kelas', icon: 'meeting_room', label: 'Laporan Kelas', description: 'Cetak statistik kelas dan peserta' },
    { id: 'tugas', icon: 'assignment', label: 'Laporan Tugas', description: 'Cetak rekap tugas dan pengumpulan' },
    { id: 'kehadiran', icon: 'fact_check', label: 'Laporan Kehadiran', description: 'Cetak rekap kehadiran siswa' },
    { id: 'keuangan', icon: 'payments', label: 'Laporan Keuangan', description: 'Cetak laporan keuangan sekolah' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-on-surface">Laporan</h2>
          <p className="text-xs text-on-surface-variant">Buat dan export laporan akademik</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            Pilih Jenis Laporan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-5 rounded-2xl border text-left transition-all group ${
                  reportType === type.id 
                    ? 'border-tertiary bg-tertiary-container/20 shadow-lg' 
                    : 'border-outline-variant/30 bg-white hover:border-tertiary/40 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    reportType === type.id ? 'bg-tertiary text-white' : 'bg-surface-container text-on-surface-variant group-hover:text-tertiary'
                  } transition-colors`}>
                    <span className="material-symbols-outlined text-xl">{type.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${reportType === type.id ? 'text-tertiary' : 'text-on-surface'}`}>
                      {type.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{type.description}</p>
                  </div>
                  {reportType === type.id && (
                    <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/30">
            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px]">preview</span>
              Preview
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
                <span className="text-xs font-medium text-on-surface-variant">Total Data</span>
                <span className="text-xs font-black text-on-surface">
                  {reportType === 'siswa' ? stats.students : 
                   reportType === 'guru' ? stats.teachers : 
                   reportType === 'kelas' ? stats.classes : 
                   reportType === 'tugas' ? stats.assignments : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
                <span className="text-xs font-medium text-on-surface-variant">Tahun Ajaran</span>
                <span className="text-xs font-black text-on-surface">2025/2026</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container">
                <span className="text-xs font-medium text-on-surface-variant">Semester</span>
                <span className="text-xs font-black text-on-surface">Genap</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => generateReport(reportType)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-tertiary text-white rounded-2xl font-bold text-xs shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                )}
                Preview Laporan
              </button>
              
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-tertiary text-tertiary rounded-2xl font-bold text-xs hover:bg-tertiary-container/20 transition-all disabled:opacity-50"
              >
                {exporting ? (
                  <span className="w-4 h-4 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">download</span>
                )}
                Export PDF
              </button>
            </div>
          </div>

          <div className="bg-tertiary-container/10 rounded-2xl p-4 border border-tertiary/20">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-tertiary text-[18px]">info</span>
              <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                Laporan dapat di-export dalam format PDF untuk keperluan arsip dan distribusi ke bagian terkait.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-outline-variant/30">
        <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px]">history</span>
          Riwayat Laporan
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-[16px]">description</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Laporan Siswa - Januari 2026</p>
                <p className="text-[10px] text-on-surface-variant">Diesport 23 Mar 2026</p>
              </div>
            </div>
            <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">download</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600 text-[16px]">description</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Laporan Guru - Februari 2026</p>
                <p className="text-[10px] text-on-surface-variant">Diesport 15 Feb 2026</p>
              </div>
            </div>
            <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}