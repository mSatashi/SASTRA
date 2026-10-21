from typing import Dict, Any, List, Optional
from .assessment_agent import assessment_agent
from .vision_grader_agent import vision_grader_agent
from .report_agent import academic_report_agent
from ..services.storage_service import storage_service

class MasterOrchestrator:
    """Master Orchestrator Agent yang mengelola sesi kerja guru,
    menjembatani aliran data antar ketiga fitur SASTRA, dan memelihara konteks pembelajaran."""

    def __init__(self):
        self.assessment_agent = assessment_agent
        self.vision_grader_agent = vision_grader_agent
        self.report_agent = academic_report_agent
        self.storage = storage_service

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Menyajikan metrik performa kelas dan ringkasan pekerjaan guru."""
        classes = self.storage.get_classes()
        students = self.storage.get_students()
        assessments = self.storage.get_assessments()
        gradings = self.storage.get_gradings()
        reports = self.storage.get_reports()

        total_students = len(students)
        all_grades = [g["score"] for s in students for g in s.get("grades", [])]
        class_average = round(sum(all_grades) / len(all_grades), 1) if all_grades else 84.5

        return {
            "total_classes": len(classes),
            "total_students": total_students,
            "total_assessments_created": len(assessments),
            "total_papers_graded": len(gradings),
            "total_reports_generated": len(reports),
            "class_average_score": class_average,
            "recent_activity": [
                {"type": "grading", "title": "Koreksi Lembar Jawaban: Ahmad Fauzi", "score": "87%", "time": "Hari ini"},
                {"type": "assessment", "title": "Modul Ajar Deep Learning: Berpikir Komputasional", "time": "Kemarin"},
                {"type": "report", "title": "Narasi Rapor Semester Ganjil: Budi Pratama", "grade": "A", "time": "2 hari lalu"}
            ]
        }

orchestrator = MasterOrchestrator()
