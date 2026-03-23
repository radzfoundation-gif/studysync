import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn("API Key Resend tidak ditemukan.");
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    const data = await resend.emails.send({
      from: 'StudySync <onboarding@resend.dev>',
      to: email, // Ingat: Karena domain belum diverifikasi, email hanya akan terkirim ke email yang didaftarkan di portal Resend Anda.
      subject: 'Selamat Datang di StudySync!',
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo-text { font-size: 26px; font-weight: 900; color: #0284c7; margin-top: 12px; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 16px; }
          .text { font-size: 16px; color: #475569; line-height: 1.6; text-align: center; margin-bottom: 32px; }
          .footer { font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="https://api.iconify.design/material-symbols:school.svg?color=%230ea5e9" width="56" height="56" alt="StudySync Logo">
            <div class="logo-text">StudySync</div>
          </div>
          
          <div class="title">Selamat Bergabung!</div>
          
          <div class="text">
            Halo! Selamat bergabung di <strong>StudySync</strong>.<br><br>
            Akun Anda berhasil dibuat. Anda sekarang sudah siap untuk menjelajahi semua fitur belajar interaktif kami!
          </div>
          
          <div class="footer">
            © 2026 StudySync. Hak Cipta Dilindungi.<br>
            Pesan dikirim secara otomatis oleh StudySync.
          </div>
        </div>
      </body>
      </html>
      `
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gagal mengirim email:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
