# SASTRA frontend

Prototipe ruang kerja guru: React, TypeScript, Vite, React Router dan Lucide. Default adalah **mode demo dengan data siswa sintetis**. Tidak memerlukan Docker, database, akun, password, atau API key.

Mode API kini tersedia lewat `/api/v1`: lihat [setup Vertex dan backend](../docs/VERTEX_INTEGRATION.md).
Set `VITE_DATA_MODE=api` sebelum menjalankan/build frontend. Mode ini memerlukan backend
dan autentikasi AI di server, serta masih memakai profil kelas contoh.

## Jalankan di komputer teman

Install Node.js 22.12+ atau Node.js 24 LTS serta Git. Di CMD Windows, dari folder yang diinginkan:

```bat
git clone --branch feat/teacher-dashboard https://github.com/mSatashi/SASTRA.git
cd SASTRA\frontend
npm ci
npm run dev
```

Buka http://127.0.0.1:3000. Terminal harus tetap berjalan; Ctrl+C menghentikan server. Perintah clone di atas menggunakan branch frontend yang dapat direview. Setelah digabungkan, frontend juga tersedia di branch main.

Untuk checkout lokal saat ini:

```bat
cd /d "D:\BELAJAR ITB\HACKATHON ITB\SASTRA\frontend"
npm ci
npm run dev
```

## Apa yang sudah dapat dicoba

- Dashboard, navigasi mobile, grafik nilai dengan ringkasan aksesibel, antrean review dan aktivitas.
- Form topik/tujuan/waktu; generator template contoh, pratinjau dan persetujuan materi.
- Pemilihan file JPG/PNG/PDF ≤10 MB dan pratinjau gambar lokal. Simulasi memakai transkripsi fixture, **bukan membaca isi file**. File asli tidak disimpan atau diunggah pada mode demo.
- Tinjau bukti contoh, konfirmasi identitas, ubah skor, setujui nilai dan revisinya. Hanya nilai disetujui dihitung dalam buku nilai. Versi nilai sebelumnya dipertahankan setelah revisi.
- Cari siswa, detail riwayat, ekspor CSV. Susun/sunting draf laporan, konfirmasi review, finalisasi dan unduh teks. Draf menjadi STALE saat nilai sumber berubah. Laporan final menyimpan snapshot dan tidak ditimpa oleh revisi berikutnya.
- State loading/error/empty/success, retry dan reset demo dengan dialog konfirmasi.

State demo disimpan di localStorage `sastra-demo-v1` pada origin browser ini. Gunakan **Reset demo** untuk mengulang. Jangan masukkan data siswa asli. Profil Bu Nadia, SD Nusantara, kelas IV A dan IPAS adalah konteks contoh tetap, bukan akun terautentikasi atau pemilih kelas.

## Kontrak integrasi backend

Salin `.env.example` menjadi `.env.local`, lalu set:

```dotenv
VITE_DATA_MODE=api
VITE_API_URL=/api/v1
```

Restart Vite setelah mengubah env. Semua variabel VITE_* tampil dalam bundle klien; **jangan taruh Gemini key/Cloud credential di sini**. Mode API mengirim cookie dengan credentials include dan tidak fallback ke demo ketika server gagal.

`src/client.ts` memisahkan SastraClient, DemoClient dan BackendClient. Backend menyediakan kontrak berikut di `/api/v1`; Vite memproksikan `/api` ke port 8000. GET /dashboard mengembalikan **Workspace lengkap**: students, submissions, contents, reports, activities, dan schema=1. Setiap mutasi berhasil diikuti GET /dashboard untuk memuat data terbaru. Default tetap demo; autentikasi AI berada pada backend.

| Method | Endpoint                          | Payload                                        |
| ------ | --------------------------------- | ---------------------------------------------- |
| GET    | /dashboard                        | Workspace lengkap                              |
| POST   | /assessment-versions/generate     | topic, objective, duration                     |
| POST   | /assessment-versions/{id}/approve | expectedVersion                                |
| POST   | /submissions                      | multipart: file, studentId, contentId, title   |
| POST   | /submissions/{id}/approve-grade   | expectedVersion, gradeItems, identityConfirmed |
| POST   | /reports/generate                 | studentId                                      |
| POST   | /report-versions/{id}/finalize    | expectedVersion, narrative                     |

Backend menyediakan validasi file/skor, transaksi expectedVersion (409 untuk konflik), bukti asli, riwayat revisi, snapshot laporan dan integrasi Gemini melalui ADC. Mode ini masih prototipe satu kelas, belum memiliki login guru, otorisasi sekolah, job queue atau penyimpanan lintas instance Cloud Run. Gunakan data sintetis. Batas dan setup ada di [panduan Vertex](../docs/VERTEX_INTEGRATION.md).

## Verifikasi

```bat
npm run build
npm test
npm run format:check
```

Tes domain mencakup pengecualian skor usulan, batas skor/identitas, konflik versi, perlindungan bukti/rubrik, riwayat revisi, invalidasi draf, snapshot laporan final dan kebutuhan bukti untuk tren. Pengujian browser dicatat di ../docs/FRONTEND_QA.md.

## Container dan Cloud Build

Dari root repository, jalankan `docker build -t sastra-frontend:local ./frontend`, lalu `docker run --rm -p 127.0.0.1:8080:8080 -e PORT=8080 sastra-frontend:local`. Runtime Nginx mendukung refresh route React dan endpoint `/healthz`. Build image otomatis menjalankan format check, tes, dan build produksi.

Konfigurasi root `cloudbuild.yaml` membangun dan memublikasikan image ke Artifact Registry; deployment Cloud Run merupakan langkah terpisah. Panduan Cloud Shell dan prasyarat ada di [../docs/FRONTEND_CLOUD_BUILD.md](../docs/FRONTEND_CLOUD_BUILD.md). Mode demo dan URL backend merupakan build arguments Vite; perubahan memerlukan build image baru.

## Batas versi awal

Belum ada login/register, pilihan sekolah/kelas, OCR atau model AI nyata, analisis capaian per tujuan pembelajaran, kuis PG interaktif, ekspor PDF/Word/Excel, editor materi lengkap, persistensi multi-pengguna, maupun deploy cloud. Unduhan saat ini CSV dan teks (.txt). Review file visual berdampingan dan verifikasi citasi OCR perlu diintegrasikan dengan API asset backend.

## Kredit

Konsep SASTRA ada di ../AGENTS.md; rencana frontend ada di ../docs/FRONTEND_PLAN.md. UI awal dibuat khusus untuk proyek ini tanpa template Figma. Font DM Sans dan Manrope disediakan lewat Google Fonts (fallback sans-serif jika offline). Ikon memakai Lucide (ISC); React dan Vite memakai lisensi MIT. Tidak ada aset foto/ilustrasi pihak ketiga.
