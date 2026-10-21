# 🎓 SASTRA: Student Assessment, Tracker, and Report Assistance
> **Staf Asisten Guru Berbasis Agentic AI untuk Mewujudkan Pembelajaran Mendalam (Deep Learning)**  
> **Diselaraskan dengan Standar Kurikulum & Asesmen Permendikdasmen No. 13 Tahun 2025**

---

## 🌟 Tentang SASTRA
**SASTRA** adalah platform Agentic AI yang dirancang sebagai staf asisten guru mandiri. SASTRA mengambil alih beban administratif berulang yang menguras energi guru, sehingga guru dapat kembali fokus pada esensi utamanya: mendidik dan membentuk generasi masa depan.

Platform ini mengintegrasikan 3 fitur utama:
1. **Interactive Assessment & Content Studio:** Menghasilkan modul ajar berpendekatan *Deep Learning* (*Mindful, Meaningful, Joyful*), pertanyaan pemantik kritis (*inquiry-based*), paket kuis campuran (Pilihan Ganda + Esai penalaran terbuka), dan Lembar Kerja Peserta Didik (LKPD).
2. **Multi-Modal Vision OCR Grader:** Mengoreksi lembar jawaban siswa dari foto/PDF (baik tulisan tangan maupun ketikan) secara instan. Auto-scoring untuk Pilihan Ganda dan evaluasi rubrik semantik logika penalaran untuk soal Esai dengan umpan balik personal (*constructive feedback*).
3. **Academic Tracker & Semester Report Assistance:** Mengakumulasikan nilai tugas, kuis, dan ujian formatif/sumatif ke dalam Buku Nilai digital, mendeteksi materi yang telah dikuasai vs butuh remedial, dan menyusun narasi deskripsi capaian rapor semester resmi sesuai standar Permendikdasmen No. 13 Tahun 2025.

---

## 🚀 Cara Menjalankan Aplikasi

Frontend pada branch `feat/teacher-dashboard` adalah prototipe ruang kerja guru berbasis React + TypeScript. Default memakai data sintetis di browser, tanpa akun, Docker, atau API key. Backend FastAPI tetap tersedia di repositori; adapter frontend baru belum diselaraskan dengan endpoint backend tersebut. Petunjuk lengkap, kontrak integrasi, dan batas demo ada di [frontend/README.md](frontend/README.md).

Untuk mencoba frontend saja (Node.js 22.12+):

```bash
cd frontend
npm ci
npm run dev
```

Buka **http://127.0.0.1:3000/**. Hasil pada mode demo adalah template/fixture, bukan inferensi Gemini atau OCR nyata.

### Opsi 1: Satu Klik di Windows
Cukup klik ganda file [`start-sastra.bat`](start-sastra.bat). Script ini akan otomatis menyalakan server backend dan frontend.

### Opsi 2: Manual lewat Terminal

**1. Jalankan Backend (FastAPI):**
```bash
python backend/run.py
```
* Backend API berjalan di: `http://127.0.0.1:8000`
* Swagger Interactive Docs: `http://127.0.0.1:8000/docs`

**2. Jalankan Frontend (Vite + React):**
```bash
cd frontend
npm run dev
```
* Frontend Dashboard berjalan di: `http://127.0.0.1:3000`

---

## 🤖 Arsitektur Multi-Agent

* **Master Orchestrator Agent (`backend/app/agents/orchestrator.py`):** Mengelola sesi guru, konteks rombel kelas, dan meneruskan data antar fitur.
* **Assessment & Content Agent (`backend/app/agents/assessment_agent.py`):** Merancang modul *Deep Learning*, pemantik, kuis PG + Esai, dan LKPD.
* **Vision Grader Agent (`backend/app/agents/vision_grader_agent.py`):** Multimodal OCR handwriting reader, matching kunci jawaban PG, dan evaluasi logika esai dengan feedback personal.
* **Academic Tracker & Report Agent (`backend/app/agents/report_agent.py`):** Menganalisis ketuntasan kompetensi dan menyusun narasi rapor akhir semester.

---

## 🔑 Mode Frontend Demo dan Provider AI Backend

* **Frontend demo:** Tidak memerlukan API key. Generator materi, transkripsi dan narasi memakai template/fixture sintetis yang diberi label dalam UI.
* **Integrasi live berikutnya:** Selaraskan adapter di `frontend/src/client.ts` dengan backend FastAPI, autentikasi, job AI, dan penyimpanan bukti. Konfigurasi kredensial Gemini di sisi backend; jangan memasukkan API key ke variabel `VITE_*` atau bundle frontend.

Backend SASTRA mendukung dua penyedia model yang dapat dipilih lewat `backend/.env` atau endpoint konfigurasi backend. Frontend TypeScript pada branch ini belum menyediakan panel pengaturan provider; kontrak integrasinya masih perlu diselaraskan.

| Provider | Kapan dipakai | Konfigurasi |
| :--- | :--- | :--- |
| **Google Gemini** (cloud) | Kualitas tertinggi, butuh internet & API key | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| **Ollama** (lokal) | Data siswa tidak keluar dari komputer sekolah, bisa offline | `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_VISION_MODEL` |

* **Mode Demo Standby:** Bila provider aktif belum siap (tanpa API key / server Ollama mati / model belum di-pull), SASTRA otomatis memakai simulator cerdas bawaan berstandar Permendikdasmen No. 13/2025.

### Menyiapkan Ollama
1. Pasang Ollama dari https://ollama.com/download, lalu pastikan server berjalan (`ollama serve`; di Windows/macOS biasanya otomatis jalan di tray).
2. Unduh model. Satu model multimodal sudah cukup untuk semua fitur:
   ```bash
   ollama pull gemma3:4b
   ```
   Opsional, model vision terpisah yang lebih kuat untuk membaca tulisan tangan: `ollama pull qwen2.5vl:7b`.
3. Salin `backend/.env.example` menjadi `backend/.env` dan atur:
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=gemma3:4b
   OLLAMA_VISION_MODEL=        # kosong = sama dengan OLLAMA_MODEL
   OLLAMA_NUM_CTX=8192
   OLLAMA_TIMEOUT=300
   ```
4. Jalankan backend seperti biasa. Backend juga menyediakan endpoint untuk mengubah provider saat runtime tanpa restart; pengaturan runtime tersebut tidak disimpan ke `.env`. Panel pengaturan frontend lama tidak termasuk frontend demo TypeScript ini.

**Catatan Ollama:**
* Vision Grader membutuhkan model multimodal (gemma3, qwen2.5vl, llava, llama3.2-vision) dan hanya menerima **gambar** (JPG/PNG). Upload PDF akan memakai mode fallback saat provider Ollama aktif.
* Respons diminta dalam mode JSON (`format: "json"`), dan blok `<think>` dari model reasoning (qwen3, deepseek-r1) dibersihkan otomatis.
* Di CPU tanpa GPU, satu permintaan modul ajar bisa memakan waktu beberapa menit; naikkan `OLLAMA_TIMEOUT` bila perlu.

### Endpoint terkait
* `GET  /api/data/status` — provider aktif, model, dan kesiapan Gemini/Ollama.
* `POST /api/data/llm-config` — ganti provider & konfigurasi Ollama: `{"provider": "ollama", "ollama_base_url": "...", "ollama_model": "gemma3:4b", "ollama_vision_model": ""}`.
* `GET  /api/data/ollama/models` — daftar model yang sudah di-pull di server Ollama.
* `POST /api/data/update-key` — memperbarui Gemini API key.
