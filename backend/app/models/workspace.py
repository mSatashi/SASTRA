"""Validated contracts for the TypeScript teacher workspace (/api/v1)."""
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, FiniteFloat, StringConstraints

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20000)]


class ContentInput(BaseModel):
    topic: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    objective: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1500)]
    subject: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)] = "IPAS"
    assessmentType: Literal["TUGAS", "KUIS", "UTS", "UAS"] = "KUIS"
    semester: Literal["GANJIL", "GENAP"] = "GANJIL"
    materials: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]] = Field(default_factory=list, max_length=10)
    duration: Literal[40, 80, 120] = 40
    className: Literal["IV A"] = "IV A"
    weight: Annotated[FiniteFloat, Field(gt=0, le=100)] = 1


class VersionInput(BaseModel):
    expectedVersion: int = Field(ge=1, strict=True)


class GradeInput(VersionInput):
    # Evidence in gradeItems is ignored. The server retains its original evidence.
    gradeItems: list[dict] = Field(min_length=1, max_length=20)
    identityConfirmed: bool = Field(strict=True)


class ReportInput(BaseModel):
    studentId: str = Field(min_length=1, max_length=100)
    subject: str = Field(default="", max_length=80)
    semester: Literal["", "GANJIL", "GENAP"] = ""
    assessmentType: Literal["", "TUGAS", "KUIS", "UTS", "UAS"] = ""
    material: str = Field(default="", max_length=120)


class FinalizeInput(VersionInput):
    narrative: Text


class AnswerKeyItem(BaseModel):
    type: Literal["multiple_choice", "essay"]
    question: Text
    options: list[str] = Field(default_factory=list, max_length=5)
    correctAnswer: Text
    rubric: Text
    max: Annotated[FiniteFloat, Field(gt=0, le=1000)]


class GeneratedContent(BaseModel):
    module: Text
    answerKey: list[AnswerKeyItem] = Field(min_length=1, max_length=20)


class ExternalContentInput(ContentInput, GeneratedContent):
    """Teacher-supplied questions must follow the same approval flow as AI drafts."""


class GradedAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")
    number: int = Field(ge=1, le=20, strict=True)
    answer: Text
    feedback: Text
    score: Annotated[FiniteFloat, Field(ge=0)]


class GeneratedGrades(BaseModel):
    items: list[GradedAnswer] = Field(min_length=1, max_length=20)


class GeneratedReport(BaseModel):
    narrative: Text
