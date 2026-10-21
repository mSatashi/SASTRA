import json
import uuid
from typing import Dict, Any, List, Optional
from pathlib import Path
from ..config import settings

class StorageService:
    def __init__(self):
        self.db_path = settings.DB_PATH
        self._init_db()

    def _init_db(self):
        if not self.db_path.exists():
            default_data = {
                "classes": [
                    {"id": "cls_7a", "name": "Kelas 7A", "grade_level": "Fase D", "academic_year": "2025/2026"}
                ],
                "students": [
                    {
                        "id": "std_01",
                        "nisn": "0081234561",
                        "name": "Ahmad Fauzi",
                        "class_id": "cls_7a",
                        "class_name": "Kelas 7A",
                        "grades": [
                            {
                                "assessment_id": "asm_01",
                                "assessment_title": "Asesmen Formatif: Konsep Berpikir Komputasional",
                                "date": "2026-09-15",
                                "score": 92.0,
                                "max_score": 100.0,
                                "topic": "Berpikir Komputasional & Dekomposisi Masalah"
                            },
                            {
                                "assessment_id": "asm_02",
                                "assessment_title": "Kuis Esai: Algoritma & Logika Pemrograman",
                                "date": "2026-10-04",
                                "score": 85.0,
                                "max_score": 100.0,
                                "topic": "Logika Pemrograman Dasar"
                            },
                            {
                                "assessment_id": "asm_03",
                                "assessment_title": "Sumatif Tengah Semester: Etika Kecerdasan Artifisial",
                                "date": "2026-10-18",
                                "score": 78.0,
                                "max_score": 100.0,
                                "topic": "Kecerdasan Artifisial & Dampak Sosial"
                            }
                        ]
                    },
                    {
                        "id": "std_02",
                        "nisn": "0081234562",
                        "name": "Siti Nurhaliza",
                        "class_id": "cls_7a",
                        "class_name": "Kelas 7A",
                        "grades": [
                            {
                                "assessment_id": "asm_01",
                                "assessment_title": "Asesmen Formatif: Konsep Berpikir Komputasional",
                                "date": "2026-09-15",
                                "score": 74.0,
                                "max_score": 100.0,
                                "topic": "Berpikir Komputasional & Dekomposisi Masalah"
                            },
                            {
                                "assessment_id": "asm_02",
                                "assessment_title": "Kuis Esai: Algoritma & Logika Pemrograman",
                                "date": "2026-10-04",
                                "score": 68.0,
                                "max_score": 100.0,
                                "topic": "Logika Pemrograman Dasar"
                            },
                            {
                                "assessment_id": "asm_03",
                                "assessment_title": "Sumatif Tengah Semester: Etika Kecerdasan Artifisial",
                                "date": "2026-10-18",
                                "score": 88.0,
                                "max_score": 100.0,
                                "topic": "Kecerdasan Artifisial & Dampak Sosial"
                            }
                        ]
                    },
                    {
                        "id": "std_03",
                        "nisn": "0081234563",
                        "name": "Budi Pratama",
                        "class_id": "cls_7a",
                        "class_name": "Kelas 7A",
                        "grades": [
                            {
                                "assessment_id": "asm_01",
                                "assessment_title": "Asesmen Formatif: Konsep Berpikir Komputasional",
                                "date": "2026-09-15",
                                "score": 96.0,
                                "max_score": 100.0,
                                "topic": "Berpikir Komputasional & Dekomposisi Masalah"
                            },
                            {
                                "assessment_id": "asm_02",
                                "assessment_title": "Kuis Esai: Algoritma & Logika Pemrograman",
                                "date": "2026-10-04",
                                "score": 94.0,
                                "max_score": 100.0,
                                "topic": "Logika Pemrograman Dasar"
                            },
                            {
                                "assessment_id": "asm_03",
                                "assessment_title": "Sumatif Tengah Semester: Etika Kecerdasan Artifisial",
                                "date": "2026-10-18",
                                "score": 91.0,
                                "max_score": 100.0,
                                "topic": "Kecerdasan Artifisial & Dampak Sosial"
                            }
                        ]
                    }
                ],
                "assessments": [],
                "gradings": [],
                "reports": []
            }
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(default_data, f, indent=2, ensure_ascii=False)

    def _read_db(self) -> Dict[str, Any]:
        with open(self.db_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_db(self, data: Dict[str, Any]):
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_classes(self) -> List[Dict[str, Any]]:
        return self._read_db().get("classes", [])

    def get_students(self, class_id: Optional[str] = None) -> List[Dict[str, Any]]:
        db = self._read_db()
        students = db.get("students", [])
        if class_id:
            return [s for s in students if s.get("class_id") == class_id]
        return students

    def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        for s in self.get_students():
            if s.get("id") == student_id:
                return s
        return None

    def save_assessment(self, assessment: Dict[str, Any]):
        db = self._read_db()
        if "assessments" not in db:
            db["assessments"] = []
        db["assessments"].append(assessment)
        self._write_db(db)
        return assessment

    def get_assessments(self) -> List[Dict[str, Any]]:
        return self._read_db().get("assessments", [])

    def save_grading(self, grading: Dict[str, Any]):
        db = self._read_db()
        if "gradings" not in db:
            db["gradings"] = []
        db["gradings"].append(grading)
        
        # Juga perbarui data nilai siswa di daftar siswa jika student_id cocok
        student_id = grading.get("student_id")
        if student_id:
            for s in db.get("students", []):
                if s["id"] == student_id:
                    s["grades"].append({
                        "assessment_id": grading.get("id", str(uuid.uuid4())),
                        "assessment_title": grading.get("assignment_title", "Asesmen"),
                        "date": "2026-10-21",
                        "score": grading.get("percentage", 0),
                        "max_score": 100.0,
                        "topic": grading.get("subject", "Umum")
                    })
                    break
        self._write_db(db)
        return grading

    def get_gradings(self) -> List[Dict[str, Any]]:
        return self._read_db().get("gradings", [])

    def save_report(self, report: Dict[str, Any]):
        db = self._read_db()
        if "reports" not in db:
            db["reports"] = []
        db["reports"].append(report)
        self._write_db(db)
        return report

    def get_reports(self) -> List[Dict[str, Any]]:
        return self._read_db().get("reports", [])

storage_service = StorageService()
