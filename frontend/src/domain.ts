export type GradeItem = {
  question: string;
  answer: string;
  rubric: string;
  feedback: string;
  score: number;
  max: number;
  type?: "multiple_choice" | "essay";
};
export type Submission = {
  id: string;
  studentId: string;
  title: string;
  date: string;
  status: "AWAITING_REVIEW" | "APPROVED";
  version: number;
  identityConfirmed: boolean;
  assessmentMatch?: "MATCH" | "UNCERTAIN";
  items: GradeItem[];
  assetName?: string;
  assetMimeType?: string;
  contentId?: string;
  contentVersion?: number;
  className?: string;
  weight?: number;
  subject?: string;
  assessmentType?: AssessmentType;
  semester?: "GANJIL" | "GENAP";
  materials?: string[];
  history?: { version: number; items: GradeItem[] }[];
};
export type Student = {
  id: string;
  name: string;
  initials: string;
  color: string;
};
export type Content = {
  id: string;
  title: string;
  objective: string;
  duration: number;
  status: "DRAFT" | "APPROVED";
  version: number;
  module: string;
  questions: string[];
  rubric?: string;
  answerKey?: AnswerKeyItem[];
  className?: string;
  weight?: number;
  origin?: string;
  subject?: string;
  assessmentType?: AssessmentType;
  semester?: "GANJIL" | "GENAP";
  materials?: string[];
};
export type Report = {
  id: string;
  studentId: string;
  status: "DRAFT" | "FINAL" | "STALE";
  version: number;
  snapshot: string;
  scope?: EvidenceScope;
  narrative: string;
  average: number;
  createdAt: string;
};
export type Activity = {
  id: string;
  agent: "ContentAgent" | "VisionAgent" | "ReportAgent" | "Guru";
  text: string;
  time: string;
};
export type Workspace = {
  schema: 1;
  students: Student[];
  submissions: Submission[];
  contents: Content[];
  reports: Report[];
  activities: Activity[];
  rosterIsSample?: boolean;
};
export type AssessmentType = "TUGAS" | "KUIS" | "UTS" | "UAS";
export type EvidenceScope = {
  subject?: string;
  semester?: string;
  assessmentType?: string;
  material?: string;
};
export type AnswerKeyItem = {
  type: "essay" | "multiple_choice";
  question: string;
  options: string[];
  correctAnswer: string;
  rubric: string;
  max: number;
};
export type ExternalContentInput = ContentInput & {
  module: string;
  answerKey: AnswerKeyItem[];
};
export function matchesEvidence(s: Submission, f: EvidenceScope) {
  return (
    (!f.subject || (s.subject || "IPAS") === f.subject) &&
    (!f.semester || (s.semester || "GANJIL") === f.semester) &&
    (!f.assessmentType || (s.assessmentType || "KUIS") === f.assessmentType) &&
    (!f.material || (s.materials || [s.title]).includes(f.material))
  );
}
export type ContentInput = {
  topic: string;
  objective: string;
  duration: number;
  className?: "IV A";
  weight?: number;
  subject: string;
  assessmentType: AssessmentType;
  semester: "GANJIL" | "GENAP";
  materials: string[];
};
export type UploadInput = {
  studentId: string;
  title: string;
  file: File;
  contentId?: string;
};
export function percentage(items: GradeItem[]) {
  return Math.round(
    (items.reduce((s, i) => s + i.score, 0) /
      items.reduce((s, i) => s + i.max, 0)) *
      100,
  );
}
export function approvedFor(
  w: Workspace,
  studentId: string,
  scope: EvidenceScope = {},
) {
  return w.submissions.filter(
    (s) =>
      s.studentId === studentId &&
      s.status === "APPROVED" &&
      matchesEvidence(s, scope),
  );
}
export function averageFor(
  w: Workspace,
  studentId: string,
  scope: EvidenceScope = {},
) {
  const a = approvedFor(w, studentId, scope);
  return a.length
    ? Math.round(
        a.reduce((n, s) => n + percentage(s.items) * (s.weight ?? 1), 0) /
          a.reduce((n, s) => n + (s.weight ?? 1), 0),
      )
    : null;
}
export function snapshotFor(
  w: Workspace,
  studentId: string,
  scope: EvidenceScope = {},
) {
  return approvedFor(w, studentId, scope)
    .map((s) => `${s.id}:${s.version}`)
    .sort()
    .join("|");
}
export function addActivity(
  w: Workspace,
  agent: Activity["agent"],
  text: string,
) {
  w.activities.unshift({
    id: crypto.randomUUID(),
    agent,
    text,
    time: new Date().toISOString(),
  });
}
export function approveGrade(
  w: Workspace,
  id: string,
  expectedVersion: number,
  items: GradeItem[],
  identityConfirmed: boolean,
): Workspace {
  const s = w.submissions.find((s) => s.id === id);
  if (!s || s.version !== expectedVersion)
    throw new Error(
      "Data telah berubah. Muat ulang sebelum menyimpan persetujuan.",
    );
  if (!identityConfirmed)
    throw new Error("Konfirmasi identitas siswa terlebih dahulu.");
  if (
    items.length !== s.items.length ||
    items.some(
      (i, n) =>
        !Number.isFinite(i.score) || i.score < 0 || i.score > s.items[n].max,
    )
  )
    throw new Error("Skor harus berada di antara 0 dan skor maksimum rubrik.");
  if (s.status === "APPROVED")
    s.history = [
      ...(s.history || []),
      { version: s.version, items: structuredClone(s.items) },
    ];
  // Keep evidence and rubrics authoritative; only accept teacher-edited scores.
  s.items = s.items.map((i, n) => ({ ...i, score: items[n].score }));
  s.status = "APPROVED";
  s.identityConfirmed = true;
  s.version += 1;
  w.reports
    .filter((r) => r.studentId === s.studentId && r.status === "DRAFT")
    .forEach((r) => {
      r.status = "STALE";
      r.version += 1;
    });
  addActivity(
    w,
    "Guru",
    `Nilai ${w.students.find((p) => p.id === s.studentId)?.name} disetujui: ${percentage(s.items)}/100.`,
  );
  return w;
}
export function generateReport(
  w: Workspace,
  studentId: string,
  scope: EvidenceScope = {},
): Workspace {
  const average = averageFor(w, studentId, scope),
    student = w.students.find((s) => s.id === studentId);
  if (average === null || !student)
    throw new Error("Belum ada nilai yang disetujui untuk siswa ini.");
  const count = approvedFor(w, studentId, scope).length;
  w.reports.unshift({
    id: crypto.randomUUID(),
    studentId,
    status: "DRAFT",
    version: 1,
    scope,
    snapshot: snapshotFor(w, studentId, scope),
    average,
    createdAt: new Date().toISOString(),
    narrative: `${student.name} memperoleh rata-rata ${average} dari ${count} asesmen yang telah disetujui guru. ${average >= 80 ? "Pemahaman konsep sudah baik. Latihan menjelaskan alasan dengan contoh sehari-hari dapat memperdalam pemahamannya." : "Pemahaman konsep dasar mulai terbentuk. Pendampingan bertahap dan latihan menggunakan contoh konkret disarankan untuk menguatkan penalarannya."} ${count < 2 ? "Bukti asesmen berikutnya diperlukan untuk menilai perkembangan dari waktu ke waktu." : "Gunakan rincian tiap asesmen untuk merencanakan tindak lanjut pembelajaran."}`,
  });
  addActivity(
    w,
    "ReportAgent",
    `Draf laporan contoh untuk ${student.name} disiapkan dari ${count} nilai disetujui.`,
  );
  return w;
}
export function finalizeReport(
  w: Workspace,
  id: string,
  expectedVersion: number,
  narrative: string,
): Workspace {
  const r = w.reports.find((r) => r.id === id);
  if (
    !r ||
    r.version !== expectedVersion ||
    r.status !== "DRAFT" ||
    r.snapshot !== snapshotFor(w, r.studentId, r.scope)
  )
    throw new Error(
      "Sumber laporan berubah atau laporan sudah final. Buat draf baru dari nilai terbaru.",
    );
  if (!narrative.trim()) throw new Error("Narasi laporan tidak boleh kosong.");
  r.narrative = narrative.trim();
  r.status = "FINAL";
  r.version += 1;
  addActivity(w, "Guru", "Laporan perkembangan ditinjau dan difinalisasi.");
  return w;
}
export function makeFixture(): Workspace {
  const students = [
    ["s1", "Alya Putri", "AP", "rose"],
    ["s2", "Bima Pratama", "BP", "sage"],
    ["s3", "Citra Maharani", "CM", "lavender"],
    ["s4", "Daffa Ramadhan", "DR", "sand"],
    ["s5", "Elena Safitri", "ES", "rose"],
    ["s6", "Farhan Akbar", "FA", "sage"],
    ["s7", "Gita Azzahra", "GA", "lavender"],
    ["s8", "Hafiz Maulana", "HM", "sand"],
  ].map(([id, name, initials, color]) => ({ id, name, initials, color }));
  const item = (score: number): GradeItem[] => [
    {
      question: "Mengapa tumbuhan membutuhkan cahaya matahari?",
      answer:
        "Cahaya matahari membantu tumbuhan membuat makanan melalui fotosintesis.",
      rubric:
        "Menjelaskan peran cahaya dan menghubungkannya dengan proses fotosintesis.",
      feedback:
        "Konsep utama sudah tepat. Tambahkan penjelasan mengenai perubahan energi.",
      score,
      max: 50,
    },
    {
      question:
        "Apa yang terjadi jika tanaman disimpan di tempat gelap? Jelaskan alasanmu.",
      answer:
        "Daunnya akan pucat dan pertumbuhannya terganggu karena tidak mendapat cahaya yang cukup.",
      rubric:
        "Menyebutkan dampak dan memberikan alasan sebab-akibat yang masuk akal.",
      feedback:
        "Hubungan sebab-akibat terlihat. Perjelas peran cahaya dalam pembentukan makanan.",
      score: Math.max(0, score - 4),
      max: 50,
    },
  ];
  const submissions: Submission[] = students.map((s, n) => ({
    id: `old-${s.id}`,
    studentId: s.id,
    title: "Kuis 01 · Bagian tumbuhan",
    date: "2026-10-14T08:00:00+07:00",
    status: "APPROVED",
    version: 1,
    identityConfirmed: true,
    items: item([46, 40, 48, 36, 43, 38, 45, 41][n]),
  }));
  submissions.unshift(
    ...students.slice(0, 3).map((s, n): Submission => ({
      id: `new-${s.id}`,
      studentId: s.id,
      title: "Kuis 02 · Fotosintesis",
      date: "2026-10-21T09:15:00+07:00",
      status: "AWAITING_REVIEW",
      version: 1,
      identityConfirmed: false,
      items: item([43, 37, 46][n]),
      assetName: `jawaban-${s.name.split(" ")[0].toLowerCase()}.jpg`,
    })),
  );
  return {
    schema: 1,
    students,
    submissions,
    contents: [
      {
        id: "c1",
        title: "Mengenal fotosintesis",
        objective:
          "Siswa mampu menjelaskan proses fotosintesis dan kaitannya dengan kehidupan sehari-hari.",
        duration: 40,
        status: "APPROVED",
        version: 1,
        module:
          "Tumbuhan membuat makanan dengan bantuan cahaya. Ajak siswa membandingkan tanaman di dekat jendela dan di tempat teduh, lalu merumuskan dugaan bersama.",
        questions: [
          "Mengapa tumbuhan membutuhkan cahaya matahari?",
          "Apa yang terjadi jika tanaman disimpan di tempat gelap? Jelaskan alasanmu.",
        ],
      },
    ],
    reports: [],
    activities: [
      {
        id: "a1",
        agent: "VisionAgent",
        text: "3 jawaban contoh siap ditinjau guru. Nilai belum masuk buku nilai.",
        time: "2026-10-21T09:15:00+07:00",
      },
      {
        id: "a2",
        agent: "ContentAgent",
        text: "Modul Mengenal fotosintesis telah disetujui guru.",
        time: "2026-10-21T08:30:00+07:00",
      },
      {
        id: "a3",
        agent: "Guru",
        text: "8 nilai Kuis 01 disetujui dan tercatat di buku nilai.",
        time: "2026-10-14T10:00:00+07:00",
      },
    ],
  };
}
