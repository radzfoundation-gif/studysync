import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AttendanceTab({ classes }: { classes: any[] }) {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          classes (
            name
          )
        `)
        .order('joined_at', { ascending: false });

      if (data) {
        setAttendanceData(data);
        setFilteredData(data);
      }
      setLoading(false);
    };

    fetchAttendance();

    // Subscribe to changes
    const channel = supabase.channel('realtime_attendance_admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, (payload) => {
        setAttendanceData(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedClass === 'Semua Kelas') {
      setFilteredData(attendanceData);
    } else {
      setFilteredData(attendanceData.filter(a => a.class_name === selectedClass || a.classes?.name === selectedClass));
    }
  }, [selectedClass, attendanceData]);

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ["Nama Siswa", "NISN", "Kelas Atribut", "No. Absen", "Waktu Hadir", "Link Foto Bukti"];
    const rows = filteredData.map(row => [
      row.student_name,
      row.nisn || "-",
      row.class_name || row.classes?.name || "Umum",
      row.student_number || "-",
      new Date(row.joined_at).toLocaleString('id-ID'),
      row.photo_url || "-"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Absensi_${selectedClass.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-xl font-headline">Laporan Absensi Siswa</h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-outline-variant/50 rounded-xl text-sm bg-white text-on-surface outline-none focus:border-primary appearance-none cursor-pointer pr-10 shadow-sm"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </div>
          </div>

          <button 
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Ekspor ke CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low/30 text-[10px] uppercase tracking-wider text-outline border-b border-outline-variant/20">
                <th className="px-6 py-4 font-black">Absen / NISN</th>
                <th className="px-6 py-4 font-black">Nama Siswa</th>
                <th className="px-6 py-4 font-black text-center">Bukti Foto</th>
                <th className="px-6 py-4 font-black">Kelas</th>
                <th className="px-6 py-4 font-black">Waktu Hadir</th>
                <th className="px-6 py-4 font-black text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    Belum ada data absensi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary text-xs tracking-tight">#{row.student_number || '-'}</p>
                      {row.nisn && <p className="text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-tighter">NISN: {row.nisn}</p>}
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface">{row.student_name}</td>
                    <td className="px-6 py-4 flex justify-center">
                      {row.photo_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-outline-variant shadow-sm cursor-zoom-in hover:scale-110 transition-transform bg-black/5">
                          <img 
                            src={row.photo_url} 
                            alt="Bukti Kehadiran" 
                            className="w-full h-full object-cover"
                            onClick={() => window.open(row.photo_url, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant/30">
                          <span className="material-symbols-outlined text-[20px]">no_photography</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-on-surface-variant">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-surface-container text-[10px] font-black uppercase tracking-tighter">
                        {row.class_name || row.classes?.name || 'Umum'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                      {new Date(row.joined_at).toLocaleString('id-ID', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Hadir
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
