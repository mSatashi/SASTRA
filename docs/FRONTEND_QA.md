# Frontend QA — 21 Oktober 2026

## Hasil pemeriksaan

- Build produksi TypeScript strict + Vite berhasil. noUnusedLocals/noUnusedParameters aktif.
- 7 tes Vitest lulus: nilai usulan tidak dihitung; konfirmasi identitas dan batas skor; konflik expectedVersion; bukti/rubrik tidak dapat ditimpa dari payload skor; draf STALE; snapshot final; riwayat nilai sebelumnya dan kebutuhan bukti tren.
- Format Prettier diperiksa. HTTP GET halaman lokal menghasilkan 200.
- Browser desktop: antrean review → ubah skor Alya menjadi 44+40 → konfirmasi identitas → approve. Buku nilai menampilkan 2 asesmen disetujui dengan rata-rata 86.
- Buat laporan: narasi dan snapshot `new-s1:2|old-s1:1` ditampilkan; finalisasi terkunci sebelum checkbox review.
- Revisi skor pertama menjadi 40 → approve → draf lama berubah menjadi Sumber berubah dan tidak menawarkan finalisasi. Draf baru menggunakan rata-rata 84 dan snapshot `new-s1:3|old-s1:1`, kemudian berhasil difinalisasi.
- Browser mobile: drawer membuka semua route; form topik/tujuan menghasilkan template Siklus air, lalu approval tercatat dalam aktivitas. Dialog panduan mengambil fokus dan memakai native dialog untuk membatasi fokus ke dalamnya.
- Dashboard diperiksa pada area konten kecil (~300 CSS px) dan desktop (~1187 CSS px). scrollWidth sama dengan clientWidth pada kedua pemeriksaan. Ukuran efektif browser berbeda dari permintaan override viewport; angka di sini adalah pengukuran DOM aktual.
- Tidak ada error/warning browser yang tercatat pada pemeriksaan alur review/laporan. Font memiliki fallback saat Google Fonts tidak tersedia.

## Catatan batas pengujian

Pengunduhan teks dicoba, tetapi event download pada konektor browser timeout; file hasil unduhan belum terverifikasi. Fungsi download memakai Blob dan anchor download; format PDF/Word/Excel belum tersedia. Pemilihan file dan respons API nyata belum diuji end-to-end karena kontrak adapter baru belum diselaraskan dengan backend yang ada di main. Ini bukan audit kepatuhan WCAG lengkap; label form, focus ring, skip link, navigasi keyboard, native dialog dan reduced motion telah disiapkan.

Screenshot preview tersimpan lokal di docs/qa (diabaikan Git). Screenshot full-page dengan viewport override mengalami pemotongan di sisi kanan oleh konektor; gunakan frontend-preview.png dari ukuran preview normal sebagai bukti visual.

## Review kode frontend

Komponen halaman terpisah dari service/domain; route non-dashboard dimuat lazy. Hook tidak bersyarat; object URL dihapus setelah tidak digunakan; effect pembacaan data mengabaikan hasil setelah unmount; daftar memakai ID stabil; data localStorage berversi. Tidak ada API key atau credential cloud di bundle. Pemeriksaan otorisasi/skor/versi tetap wajib diulang secara otoritatif oleh backend produksi.
