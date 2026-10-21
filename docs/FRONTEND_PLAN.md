# SASTRA — Frontend delivery plan

Status: baseline frontend, 21 Oktober 2026. Acuan: AGENTS.md dan dokumentasi workflow tim di Google Docs.

## Ruang lingkup peran frontend

Frontend mengerjakan pengalaman guru, komponen, validasi input, presentasi bukti, integrasi kontrak API, aksesibilitas dan pengujian UI. Backend menangani autentikasi nyata, izin kelas, penyimpanan file privat, orkestrasi Gemini, transaksi persetujuan nilai, dan perhitungan otoritatif. Nilai dan narasi pada mode demo adalah fixture sintetis, bukan hasil inferensi AI.

## Understand → Plan → Build → Test → Review → Ship

1. Understand: petakan FR-01..10 ke layar guru; nilai usulan selalu menunggu review.
2. Plan: shell responsif, route, state halaman, komponen dan service boundary di bawah.
3. Build: shell dan data statis dahulu; selanjutnya interaksi terhadap adapter demo yang terpisah.
4. Test: build TypeScript, pengujian transisi approval/revisi/stale, keyboard dan mobile.
5. Review: pengguna meninjau prototipe di browser; tim backend menyelaraskan kontrak API.
6. Ship: integrasi backend dan smoke test lingkungan tim sebelum rilis nyata.

## Layar dan alur pengguna

| Route | Tujuan | Kriteria penerimaan utama |
| --- | --- | --- |
| / | Dashboard guru | Ringkasan, pekerjaan perlu review, aktivitas dan progres dengan konteks kelas |
| /content | Materi & kuis | Form tujuan/topik, hasil draft, preview rubrik dan persetujuan versi |
| /assessment | Koreksi jawaban | Pilih siswa/asesmen, file lokal, state proses dan review skor per kriteria |
| /students | Buku nilai | Pencarian siswa, status nilai disetujui, detail bukti dan perubahan skor |
| /reports | Laporan perkembangan | Draf berbasis nilai disetujui, review, finalisasi serta penanda sumber berubah |
| /activity | Aktivitas agen | Tindakan, status dan kebutuhan guru; tidak mengungkap chain of thought |

Alur demo: buka antrean review → bandingkan bukti/transkripsi → ubah usulan skor bila perlu → setujui → buku nilai diperbarui → buat laporan → koreksi nilai sumber → laporan ditandai perlu diperbarui.

## Arah visual dan komponen

Dashboard guru dengan hijau pinus, putih hangat, aksen limau dan tipografi sans. Sidebar tetap pada desktop; navigasi drawer pada mobile. Konten dominan berupa pekerjaan guru, bukan istilah konfigurasi AI.

Komponen: AppShell, Sidebar, PageHeader, StatusBadge, MetricCard, SectionHeading, EmptyState, Notice, ConfirmDialog, StudentAvatar, AssessmentReview, EvidencePanel, AgentTimeline dan ProgressChart. Form memakai label nyata, pesan error terkait field, fokus terlihat dan tombol dengan nama aksesibel. Angka pada grafik memiliki ringkasan tekstual.

## State dan kontrak API

State utama: loading, empty, error dengan retry, ready, saving dan success. Job: QUEUED, RUNNING, NEEDS_INPUT, AWAITING_REVIEW, APPROVED, FAILED. Laporan: DRAFT, IN_REVIEW, FINAL, STALE. Identitas belum pasti dan file tidak terbaca tidak boleh lolos ke approval.

Semua akses data melalui SastraClient. Implementasi DemoClient memakai fixture dan penyimpanan browser berversi untuk prototipe. BackendClient mengirim fetch ke VITE_API_URL dengan credentials include; base URL kosong memakai endpoint relatif. Mode API tidak diam-diam kembali ke demo saat gagal. Data siswa asli dan kunci model tidak disimpan dalam frontend.

Kontrak minimum: GET /dashboard; GET /classes; GET /students; GET /submissions; POST /submissions; POST /submissions/{id}/approve-grade dengan expectedVersion dan gradeItems; POST /assessment-versions/generate; POST /assessment-versions/{id}/approve; GET /reports; POST /reports/generate; POST /report-versions/{id}/finalize; GET /activity. Kontrak ini adalah usulan handoff yang perlu diselaraskan dengan OpenAPI backend, bukan endpoint yang sudah tersedia.

## Definition of Done frontend awal

- Semua route utama dapat diakses dan setiap tindakan yang ditampilkan mempunyai hasil yang jelas.
- Data contoh dan simulasi proses AI diberi label di UI.
- Perubahan skor disetujui memperbarui agregat demo dan menandai laporan terkait sebagai STALE.
- Approval tidak terjadi hanya dari toast atau perubahan label; adapter harus mengonfirmasi hasil.
- Layout tidak overflow pada 375px dan desktop; keyboard dapat mencapai navigasi/form/dialog.
- npm run build dan pengujian logika domain lolos.
- Koneksi AI, login produksi dan cloud deployment dinyatakan sebagai pekerjaan integrasi backend berikutnya.

## Referensi

- https://react.dev/learn/thinking-in-react
- https://www.w3.org/TR/WCAG22/
- https://web.dev/articles/vitals
