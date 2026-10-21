# PPT pembelajaran

Pada halaman **Materi & kuis**, pilih materi berstatus disetujui. Panel **PPT pembelajaran** menyediakan 4–12 slide termasuk sampul. Gemini menyusun isi dari judul, tujuan, modul dan pertanyaan sumber, lalu Python membuat PPTX 16:9 dengan teks editable dan catatan guru. Kunci jawaban, rubrik penilaian dan identitas siswa tidak dikirim ke generator.

Pratinjau isi muncul sebelum unduhan. Semua hasil masih draf AI yang perlu ditinjau guru. File tidak berisi ilustrasi AI atau render preview visual dalam website. Guru dapat mengubah desain dan teks setelah mengunduh PowerPoint.

Endpoint sesi tim yang sama:

- `GET /api/v1/assessment-versions/{id}/presentations`: 20 draf terakhir untuk materi.
- `POST /api/v1/assessment-versions/{id}/presentations`: `expectedVersion`, `slideCount` 4–12.
- `GET /api/v1/presentations/{id}/file`: unduhan `.pptx`.

Kontrak membatasi panjang teks tiap slide. AI harus mengembalikan jumlah slide yang tepat; kegagalan format tidak menghasilkan file contoh. Perubahan versi materi selama generasi membatalkan penyimpanan. File, rencana slide, versi sumber dan aktivitas disimpan dalam satu transaksi SQLite. Mode demo menampilkan petunjuk koneksi backend, tanpa mengklaim telah menghasilkan file.

## Deployment SQLite

SQLite tetap penyimpanan aktif. Untuk menjaga data contoh saat deployment awal fitur ini, revisi baru dapat membaca **satu snapshot privat** menggunakan `SASTRA_SQLITE_SEED_URI`, `SASTRA_SQLITE_SEED_GENERATION`, dan `SASTRA_SQLITE_SEED_SHA256`.

Snapshot dibaca hanya bila berkas database lokal belum ada. Aplikasi memverifikasi hash dan integritas SQLite sebelum menyalinnya secara atomik; kegagalan menghentikan startup. Berkas lokal yang sudah ada tidak ditimpa. Ini adalah bootstrap dari cadangan, bukan penyimpanan cloud untuk perubahan baru.

**Batas tetap berlaku:** SQLite Cloud Run bersifat sementara. Instance baru dapat kembali ke snapshot lama; PPT dan data yang dibuat setelah snapshot dapat hilang. Sebelum deployment berikutnya, ambil cadangan terbaru. Konfigurasi ini untuk demo sementara, bukan data sekolah sungguhan. Deploy dengan `SASTRA_STORAGE_BACKEND=sqlite`, hapus konfigurasi SQL cloud yang tertinggal, dan batasi satu instance.

MCP belum diperlukan untuk endpoint ini. Fungsi pembuat file dapat dibungkus menjadi tool MCP pada tahap berikutnya tanpa mengganti format file atau UI guru.
