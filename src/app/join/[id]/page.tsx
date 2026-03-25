"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/LoadingScreen";

export default function JoinRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const resolveId = async () => {
      try {
        // 1. Check if it's a Quiz ID
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('id')
          .eq('id', id)
          .single();

        if (quiz) {
          router.replace(`/quiz/${quiz.id}`);
          return;
        }

        // 2. Check if it's a Class ID
        const { data: room } = await supabase
          .from('rooms')
          .select('id')
          .eq('id', id)
          .single();

        if (room) {
          router.replace(`/rooms/${room.id}`);
          return;
        }

        // 3. Not found
        setError("Tautan tidak valid atau kuis/kelas sudah dihapus.");
        setTimeout(() => router.replace('/dashboard'), 3000);
      } catch (err) {
        console.error("Join resolution error:", err);
        setError("Terjadi kesalahan saat mencoba bergabung.");
        setTimeout(() => router.replace('/dashboard'), 3000);
      }
    };

    resolveId();
  }, [id, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Gagal Bergabung</h1>
        <p className="text-on-surface-variant text-sm">{error}</p>
        <p className="mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Mengarahkan kembali ke Dashboard...</p>
      </div>
    );
  }

  return <LoadingScreen message="Menghubungkan ke Ruang Belajar..." />;
}
