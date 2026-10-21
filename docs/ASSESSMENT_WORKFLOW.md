# Alur asesmen guru

Workspace saat ini memakai satu roster contoh: kelas IV A. Pengelolaan banyak kelas dan akun guru belum tersedia.

1. Pada **Materi & kuis**, pilih sumber AI atau **Soal dari luar SASTRA**. Isi nama/topik, mapel, jenis (Tugas/Kuis/UTS/UAS), semester, beberapa materi dipisahkan koma, tujuan, dan bobot relatif.
2. Untuk soal luar, masukkan setiap pertanyaan, opsi PG bila ada, kunci, rubrik, dan skor maksimum. Simpan sebagai draf.
3. Periksa pratinjau soal, kunci, rubrik dan metadata, lalu setujui. Draf tidak dapat digunakan untuk koreksi.
4. Pada **Koreksi jawaban**, pilih mapel, jenis dan semester untuk menyaring asesmen. Tinjau versi/kunci/rubrik, pilih siswa, lalu unggah satu JPG/PNG/PDF maksimal 10 MB.
5. Submission menyimpan ID serta versi asesmen yang disetujui, mapel, semester, jenis, daftar materi, kelas dan bobot. Server mengambil metadata dan kunci dari asesmen, bukan dari metadata unggahan pengguna.
6. Guru memeriksa bukti dan mengonfirmasi identitas sebelum menyetujui nilai. Hanya nilai disetujui yang masuk buku nilai/laporan.

## Buku nilai dan laporan

Filter mapel, semester, jenis dan materi berlaku pada buku nilai (termasuk ekspor CSV), dan pada sumber generasi laporan. ReportAgent menyimpan cakupan dan snapshot versi bukti yang dipakai. Finalisasi ditolak jika sumber berubah.

Rata-rata = jumlah(nilai persentase asesmen × bobot relatif) / jumlah bobot. Default bobot 1 untuk semua jenis; guru menentukan bobot saat menyiapkan asesmen. Bobot 2 berarti dua kali kontribusi asesmen berbobot 1. Skor tiap asesmen tetap dihitung dari jumlah skor dibagi jumlah skor maksimum.

Filter materi memilih asesmen yang mencakup materi tersebut. Nilai asesmen multi-materi bukan nilai kompetensi per materi; model diminta hanya menyarankan pendampingan berdasarkan jawaban/rubrik yang mendukungnya.

## Kontrak API tambahan

- `POST /api/v1/assessment-versions/import`: metadata `ContentInput`, `module`, dan `answerKey` (1–20 soal dengan `type`, `question`, `options`, `correctAnswer`, `rubric`, `max`). Menghasilkan draf; tidak memanggil AI.
- `POST /api/v1/reports/generate`: `studentId` dan filter opsional `subject`, `semester`, `assessmentType`, `material`. Filter kosong mencakup semua nilai disetujui.
- `ContentInput` menerima `weight` > 0 hingga 100 dan `className: "IV A"`. Semester `GANJIL/GENAP`, jenis `TUGAS/KUIS/UTS/UAS`, maksimal 10 materi.

Penyimpanan prototipe masih SQLite; penyimpanan permanen lintas revisi Cloud Run perlu disiapkan sebelum memasukkan data sekolah sungguhan.
