import json
import uuid
import re
from typing import Dict, Any, List
from ..models.schemas import AssessmentGenerateRequest, AssessmentPackageResponse, QuestionItem, LearningActivity
from ..services.gemini_service import gemini_service
from ..services.storage_service import storage_service

class AssessmentAgent:
    """Agent untuk merancang materi pembelajaran interaktif, pertanyaan pemantik, 
    dan paket asesmen (PG + Esai) berbasis paradigma Deep Learning (Permendikdasmen No. 13 Tahun 2025)."""
    
    SYSTEM_PROMPT = """Anda adalah Staf Asisten Guru Ahli Kurikulum dan Desain Instruksional berbasis Permendikdasmen No. 13 Tahun 2025 di Indonesia.
Prinsip utama Anda adalah Pembelajaran Mendalam (Deep Learning) dengan 3 pilar:
1. Mindful: Menggugah rasa ingin tahu, refleksi, kesadaran belajar.
2. Meaningful: Mengaitkan konsep dengan dunia nyata dan kehidupan sehari-hari siswa.
3. Joyful: Menyenangkan, interaktif, memicu kreativitas dan kolaborasi.

Tugas Anda adalah merancang paket asesmen lengkap dalam format JSON yang valid, berisi:
- learning_objectives (3-4 butir tujuan pembelajaran spesifik)
- trigger_questions (3 pertanyaan pemantik pemikiran kritis)
- activities (3 tahap pembelajaran: Mindful Ingestion, Meaningful Exploration, Joyful Creation)
- questions: Daftar soal campuran (Pilihan Ganda dengan 4 opsi A/B/C/D + Esai penalaran kritis dengan rubrik analitik)
- printable_lkpd_markdown: Lembar Kerja Peserta Didik format Markdown siap cetak.
"""

    def generate_assessment(self, req: AssessmentGenerateRequest) -> AssessmentPackageResponse:
        prompt = f"""Rancang paket asesmen dan modul pembelajaran mendalam untuk:
Mata Pelajaran: {req.subject}
Jenjang/Fase: {req.grade_level}
Topik Bahasan: {req.topic}
Alokasi Waktu: {req.duration_minutes} Menit
Jumlah Pilihan Ganda: {req.multiple_choice_count} soal
Jumlah Esai Penalaran: {req.essay_count} soal

Keluarkan respon HANYA dalam JSON format murni tanpa markdown triple-backtick dengan struktur persis berikut:
{{
  "learning_objectives": ["..."],
  "trigger_questions": ["..."],
  "activities": [
    {{
      "phase_name": "Fase 1: Mindful Ingestion (Membuka Kesadaran & Rasa Ingin Tahu)",
      "duration_minutes": 20,
      "activity_description": "...",
      "teacher_prompts": ["..."]
    }},
    {{
      "phase_name": "Fase 2: Meaningful Exploration (Eksplorasi Kontekstual)",
      "duration_minutes": 35,
      "activity_description": "...",
      "teacher_prompts": ["..."]
    }},
    {{
      "phase_name": "Fase 3: Joyful Creation & Reflection (Kreasi & Refleksi Bermakna)",
      "duration_minutes": 25,
      "activity_description": "...",
      "teacher_prompts": ["..."]
    }}
  ],
  "questions": [
    {{
      "id": 1,
      "type": "multiple_choice",
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": "A",
      "explanation": "...",
      "points": 10
    }},
    {{
      "id": 2,
      "type": "essay",
      "question": "...",
      "options": null,
      "correct_answer": "Inti jawaban logika...",
      "explanation": "Penjelasan konsep...",
      "rubric": {{
        "skor_maksimal": 20,
        "kriteria": "Menjelaskan minimal 2 argumen logis dan memberikan 1 contoh kontekstual nyata."
      }},
      "points": 20
    }}
  ],
  "printable_lkpd_markdown": "# LKPD: ..."
}}
"""
        generated_json = None
        if gemini_service.client:
            raw_response = gemini_service.generate_text(prompt, system_instruction=self.SYSTEM_PROMPT)
            if raw_response:
                try:
                    cleaned = re.sub(r"```json\s*", "", raw_response)
                    cleaned = re.sub(r"```\s*$", "", cleaned).strip()
                    generated_json = json.loads(cleaned)
                except Exception:
                    generated_json = None

        if not generated_json:
            generated_json = self._build_contextual_fallback(req)

        package_id = f"asm_{uuid.uuid4().hex[:8]}"
        res = AssessmentPackageResponse(
            id=package_id,
            subject=req.subject,
            grade_level=req.grade_level,
            topic=req.topic,
            learning_objectives=generated_json.get("learning_objectives", []),
            trigger_questions=generated_json.get("trigger_questions", []),
            activities=[LearningActivity(**act) for act in generated_json.get("activities", [])],
            questions=[QuestionItem(**q) for q in generated_json.get("questions", [])],
            printable_lkpd_markdown=generated_json.get("printable_lkpd_markdown", "")
        )
        
        storage_service.save_assessment(res.dict())
        return res

    def _build_contextual_fallback(self, req: AssessmentGenerateRequest) -> Dict[str, Any]:
        """Generator cerdas berbasis aturan kurikulum Permendikdasmen No. 13 Tahun 2025 jika API key belum aktif."""
        topic = req.topic
        subject = req.subject
        grade = req.grade_level
        
        questions = []
        qid = 1
        
        # Buat soal Pilihan Ganda
        for i in range(1, req.multiple_choice_count + 1):
            questions.append({
                "id": qid,
                "type": "multiple_choice",
                "question": f"Dalam konteks {topic}, mengapa analisis mendalam terhadap masalah nyata lebih diutamakan dibandingkan sekadar menghafal langkah penyelesaian? (Soal PG #{i})",
                "options": [
                    "A. Agar siswa mampu mentransfer konsep ke berbagai situasi yang belum pernah ditemui sebelumnya",
                    "B. Karena menghafal rumus membutuhkan waktu lebih lama dalam ujian",
                    "C. Supaya guru tidak perlu membuat kunci jawaban yang terstandarisasi",
                    "D. Hanya untuk memenuhi kriteria penilaian formatif semata"
                ],
                "correct_answer": "A",
                "explanation": "Berdasarkan pendekatan Deep Learning (Permendikdasmen 13/2025), pemahaman konseptual bermakna memungkinkan murid menerapkan pemikiran kritis pada situasi baru secara adaptif.",
                "points": 10
            })
            qid += 1
            
        # Buat soal Esai Penalaran
        for j in range(1, req.essay_count + 1):
            questions.append({
                "id": qid,
                "type": "essay",
                "question": f"Studi Kasus: Bayangkan Anda menghadapi tantangan sehari-hari yang berkaitan dengan {topic}. Jelaskan langkah sistematis yang akan Anda ambil, uraikan alasan logis di balik setiap langkah, dan identifikasikan potensi dampak positifnya bagi lingkungan sekitar Anda! (Soal Esai #{j})",
                "options": None,
                "correct_answer": "Analisis alur logika: (1) Identifikasi masalah kontekstual, (2) Solusi berbasis konsep materi, (3) Evaluasi dampak sosial/lingkungan.",
                "explanation": "Penilaian esai berfokus pada kedalaman penalaran, keterkaitan sebab-akibat, dan keotentikan contoh yang diajukan peserta didik.",
                "rubric": {
                    "skor_maksimal": 20,
                    "kriteria": "Skor 20: Alur berpikir sangat runtut, solusi kontekstual realistis, dan refleksi dampak lengkap. Skor 10-15: Konsep tepat namun argumen belum mendalam. Skor <10: Hanya menyebut definisi tanpa analisis."
                },
                "points": 20
            })
            qid += 1

        lkpd_markdown = f"""# LEMBAR KERJA PESERTA DIDIK (LKPD) INTERAKTIF
**Mata Pelajaran:** {subject}  
**Fase / Jenjang:** {grade}  
**Topik Pembelajaran:** {topic}  
**Pendekatan:** *Deep Learning (Mindful, Meaningful, Joyful)*

---

### 🌟 Petualangan Belajar & Pertanyaan Pemantik
1. *Bagaimana konsep {topic} bekerja dan memengaruhi kehidupan kita sehari-hari?*
2. *Jika Anda menemukan kesalahan logika dalam studi kasus ini, bagaimana cara Anda mengoreksinya?*

### 📝 Tugas Mandiri & Kolaboratif
Kerjakan kuis pilihan ganda untuk menguji ketajaman konsep dasar Anda, lalu selesaikan pertanyaan esai dengan menuangkan ide pemikiran orisinal Anda pada lembar jawab yang disediakan!
"""

        return {
            "learning_objectives": [
                f"Peserta didik mampu memahami dan menganalisis esensi konsep {topic} secara mindful.",
                f"Peserta didik mampu mengaitkan konsep {topic} dengan pemecahan masalah di kehidupan nyata (meaningful learning).",
                f"Peserta didik mampu mengekspresikan gagasan kritis dan berkolaborasi dalam menghasilkan karya/solusi (joyful learning)."
            ],
            "trigger_questions": [
                f"Mengapa pemahaman tentang {topic} sangat penting bagi masa depan kita?",
                f"Apa yang membedakan seseorang yang memahami konsep {topic} dengan yang hanya menghafal definisinya?",
                f"Bagaimana kita bisa menerapkan {topic} untuk membantu sesama di sekolah atau lingkungan rumah?"
            ],
            "activities": [
                {
                    "phase_name": "Fase 1: Mindful Ingestion (Rasa Ingin Tahu)",
                    "duration_minutes": 20,
                    "activity_description": f"Guru menampilkan fenomena menarik terkait {topic}, mengajak siswa berdiskusi dengan pertanyaan pemantik.",
                    "teacher_prompts": ["Apa yang pertama kali terlintas di pikiran kalian saat melihat fenomena ini?"]
                },
                {
                    "phase_name": "Fase 2: Meaningful Exploration (Eksplorasi)",
                    "duration_minutes": 35,
                    "activity_description": f"Siswa bekerja dalam kelompok kecil menganalisis studi kasus nyata dan menghubungkannya dengan teori {topic}.",
                    "teacher_prompts": ["Mengapa solusi kelompok kalian dinilai paling tepat untuk kasus tersebut?"]
                },
                {
                    "phase_name": "Fase 3: Joyful Creation & Refleksi (Kreasi)",
                    "duration_minutes": 25,
                    "activity_description": "Siswa mempresentasikan ringkasan solusi kreatif dan merefleksikan apa yang paling bermakna dari sesi belajar hari ini.",
                    "teacher_prompts": ["Apa wawasan baru paling berharga yang kalian dapatkan hari ini?"]
                }
            ],
            "questions": questions,
            "printable_lkpd_markdown": lkpd_markdown
        }

assessment_agent = AssessmentAgent()
