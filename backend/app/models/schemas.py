from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ----------------- FITUR 1: Assessment & Content Generator ----------------- #

class QuestionItem(BaseModel):
    id: int
    type: str = Field(..., description="'multiple_choice' atau 'essay'")
    question: str
    options: Optional[List[str]] = Field(default=None, description="Pilihan jawaban jika tipe multiple_choice")
    correct_answer: str = Field(..., description="Kunci jawaban (huruf A-E atau inti jawaban esai)")
    explanation: str = Field(..., description="Pembahasan konsep mendalam (Deep Learning)")
    rubric: Optional[Dict[str, Any]] = Field(default=None, description="Kriteria rubrik penilaian esai")
    points: int = 10

class LearningActivity(BaseModel):
    phase_name: str = Field(..., description="Contoh: Mindful Ingestion, Meaningful Exploration, Joyful Creation")
    duration_minutes: int
    activity_description: str
    teacher_prompts: List[str] = Field(default_factory=list, description="Pertanyaan pemantik berpikir kritis")

class AssessmentGenerateRequest(BaseModel):
    subject: str = Field(..., example="Informatika & Kecerdasan Artifisial")
    grade_level: str = Field(..., example="Fase D (Kelas 7 SMP)")
    topic: str = Field(..., example="Konsep Dasar Algoritma & Berpikir Komputasional")
    duration_minutes: int = Field(default=80, example=80)
    multiple_choice_count: int = Field(default=5, example=5)
    essay_count: int = Field(default=3, example=3)
    pedagogy_focus: str = Field(default="Deep Learning (Permendikdasmen No. 13 Tahun 2025)")

class AssessmentPackageResponse(BaseModel):
    id: str
    subject: str
    grade_level: str
    topic: str
    learning_objectives: List[str]
    trigger_questions: List[str]
    activities: List[LearningActivity]
    questions: List[QuestionItem]
    printable_lkpd_markdown: str


# ----------------- FITUR 2: Vision Grader (PG + Esai OCR) ----------------- #

class QuestionGradeResult(BaseModel):
    question_number: int
    question_type: str = "multiple_choice" # 'multiple_choice' or 'essay'
    extracted_student_answer: str
    correct_answer: str
    is_correct: Optional[bool] = None
    score: float
    max_score: float
    reasoning_analysis: str = ""
    feedback_for_student: str = ""

class VisionGradingRequest(BaseModel):
    student_id: Optional[str] = None
    student_name: str = "Nama Siswa"
    assignment_title: str = "Asesmen Formatif"
    subject: str = "Umum"
    answer_key: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Daftar kunci jawaban & rubrik per nomor"
    )

class VisionGradingResponse(BaseModel):
    id: str
    student_name: str
    assignment_title: str
    subject: str
    total_score: float
    max_possible_score: float
    percentage: float
    summary_feedback: str
    graded_questions: List[QuestionGradeResult]
    strengths: List[str]
    areas_for_improvement: List[str]
    needs_remedial: bool
    ocr_confidence: float = 0.95


# ----------------- FITUR 3: Tracker & Rapor Semester ----------------- #

class StudentGradeRecord(BaseModel):
    assessment_id: str
    assessment_title: str
    date: str
    score: float
    max_score: float
    topic: str

class StudentProfile(BaseModel):
    id: str
    nisn: str
    name: str
    class_name: str
    grades: List[StudentGradeRecord] = Field(default_factory=list)

class SemesterReportRequest(BaseModel):
    student_id: str
    subject: str
    semester: str = "Semester 1 (Ganjil)"
    academic_year: str = "2025/2026"

class CompetencyEvaluation(BaseModel):
    topic: str
    average_score: float
    mastery_status: str # "Tercapai Sangat Baik", "Tercapai", "Perlu Pendampingan"
    evidence_notes: str

class SemesterReportResponse(BaseModel):
    student_id: str
    student_name: str
    class_name: str
    subject: str
    semester: str
    academic_year: str
    final_score: float
    letter_grade: str # A, B, C, D
    competency_evaluations: List[CompetencyEvaluation]
    narrative_achievement: str = Field(
        ..., 
        description="Narasi capaian kompetensi Permendikdasmen No. 13 Tahun 2025"
    )
    recommendation_followup: str = Field(
        ...,
        description="Rekomendasi pengayaan atau intervensi remedial personal"
    )
    character_reflection: str = Field(
        ...,
        description="Catatan perkembangan sikap & kesadaran belajar (Mindful Learning)"
    )
