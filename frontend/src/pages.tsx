import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  History,
  ImagePlus,
  Info,
  PencilLine,
  Plus,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { client, isDemo } from "./client";
import {
  approvedFor,
  averageFor,
  percentage,
  snapshotFor,
  type Report,
  type Submission,
} from "./domain";
import { useWorkspace } from "./store";
import {
  AgentIcon,
  Avatar,
  Badge,
  dateLabel,
  DemoNote,
  DownloadButton,
  Empty,
  PageHeading,
  SectionTitle,
} from "./ui";
export function ContentPage() {
  const { data: w, busy, run } = useWorkspace();
  const [topic, setTopic] = useState(""),
    [objective, setObjective] = useState(""),
    [duration, setDuration] = useState(40),
    [selected, setSelected] = useState("");
  if (!w) return null;
  const content = w.contents.find((c) => c.id === selected) || w.contents[0];
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (
      await run(
        () => client.generateContent({ topic, objective, duration }),
        "Draf materi siap ditinjau.",
      )
    )
      setSelected("");
  }
  return (
    <>
      <PageHeading
        eyebrow="CONTENTAGENT"
        title="Dari rasa ingin tahu, jadi pembelajaran."
        description="Rancang materi dan kuis yang dekat dengan dunia siswa."
      />
      {isDemo && (
        <DemoNote>
          Generator demo menggunakan pola teks contoh. Materi belum dibuat oleh
          Gemini; tinjau kesesuaian isi sebelum digunakan.
        </DemoNote>
      )}
      <div className="editor-grid">
        <section className="panel form-panel">
          <SectionTitle
            title="Rancang materi baru"
            subtitle="Mulai dengan tujuan yang ingin dicapai."
          />
          <form onSubmit={submit}>
            <label htmlFor="topic">Topik pembelajaran</label>
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Siklus air di sekitar kita"
              maxLength={120}
              required
            />
            <div className="form-row">
              <div>
                <label htmlFor="subject">Mata pelajaran</label>
                <input id="subject" value="IPAS" readOnly />
              </div>
              <div>
                <label htmlFor="phase">Fase / kelas</label>
                <input id="phase" value="Fase B · Kelas IV" readOnly />
              </div>
            </div>
            <label htmlFor="objective">Tujuan pembelajaran</label>
            <textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Siswa mampu menjelaskan…"
              rows={4}
              required
              maxLength={1500}
            />
            <label htmlFor="duration">Alokasi waktu</label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={40}>40 menit · 1 pertemuan</option>
              <option value={80}>80 menit · 2 pertemuan</option>
              <option value={120}>120 menit · 3 pertemuan</option>
            </select>
            <div className="principles">
              <span>Mindful</span>
              <span>Meaningful</span>
              <span>Joyful</span>
            </div>
            <button className="btn primary full" disabled={busy}>
              <Sparkles size={17} />
              {busy ? "Menyiapkan draf…" : "Buat draf materi & kuis"}
            </button>
          </form>
        </section>
        <section className="panel content-preview">
          <div className="section-title">
            <div>
              <span className="eyebrow">PERPUSTAKAAN PEMBELAJARAN</span>
              <h2>Pratinjau materi</h2>
            </div>
            <Badge tone={content?.status === "APPROVED" ? "green" : "amber"}>
              {content?.status === "APPROVED" ? "Disetujui" : "Draf"}
            </Badge>
          </div>
          <label className="sr-only" htmlFor="content-select">
            Pilih materi
          </label>
          <select
            id="content-select"
            value={content?.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {w.contents.map((c) => (
              <option value={c.id} key={c.id}>
                {c.title} · v{c.version}
              </option>
            ))}
          </select>
          {content ? (
            <>
              <div className="document-preview">
                <div className="document-label">
                  <BookOpen size={18} /> MODUL PEMBELAJARAN{" "}
                  <span>{content.duration} MENIT</span>
                </div>
                <h2>{content.title}</h2>
                <p className="document-objective">{content.objective}</p>
                <h3>Amati. Temukan. Ceritakan.</h3>
                <p className="preserve-lines">{content.module}</p>
                <h3>Pertanyaan pemantik & kuis</h3>
                <ol>
                  {content.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
                <div className="rubric-box">
                  <strong>Rubrik penalaran · contoh</strong>
                  <p>
                    Ketepatan konsep (0–50) dan penjelasan sebab-akibat (0–50).
                    Guru perlu menyelaraskan rubrik dengan topik sebelum
                    asesmen.
                  </p>
                </div>
              </div>
              <div className="button-row">
                <DownloadButton
                  text={`${content.title}\n\n${content.objective}\n\n${content.module}\n\n${content.questions.join("\n")}`}
                  filename="sastra-materi.txt"
                >
                  <ArrowDownToLine size={16} />
                  Unduh teks
                </DownloadButton>
                {content.status === "DRAFT" && (
                  <button
                    disabled={busy}
                    className="btn primary"
                    onClick={() =>
                      run(
                        () =>
                          client.approveContent(content.id, content.version),
                        "Materi disetujui.",
                      )
                    }
                  >
                    <Check size={16} />
                    Setujui materi
                  </button>
                )}
              </div>
            </>
          ) : (
            <Empty title="Belum ada materi">
              Buat draf materi pertama Anda.
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
export function AssessmentPage() {
  const { data: w, busy, run } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [showUpload, setShowUpload] = useState(false),
    [filter, setFilter] = useState("pending"),
    [studentId, setStudentId] = useState("s1"),
    [file, setFile] = useState<File | null>(null),
    [validation, setValidation] = useState(""),
    [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview("");
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!w) return null;
  const rows = w.submissions.filter(
    (s) => filter === "all" || s.status === "AWAITING_REVIEW",
  );
  const chosen =
    w.submissions.find((s) => s.id === params.get("id")) || rows[0];
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setValidation("Pilih file jawaban terlebih dahulu.");
      return;
    }
    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setValidation("Gunakan JPG, PNG, atau PDF berukuran maksimal 10 MB.");
      return;
    }
    const ok = await run(
      () => client.upload({ file, studentId, title: "Kuis 02 · Fotosintesis" }),
      "Unggahan demo siap ditinjau.",
    );
    if (ok) {
      setShowUpload(false);
      setFile(null);
      setFilter("pending");
      setParams({});
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="VISIONAGENT"
        title="Pahami proses berpikir siswa."
        description="Tinjau jawaban, beri umpan balik, lalu tetapkan nilai dengan yakin."
      >
        <button
          className="btn primary"
          onClick={() => setShowUpload((v) => !v)}
        >
          {showUpload ? <X size={16} /> : <Plus size={16} />}
          {showUpload ? "Tutup unggahan" : "Unggah jawaban"}
        </button>
      </PageHeading>
      {isDemo && (
        <DemoNote>
          OCR dan penilaian di sini adalah simulasi. File tetap di browser;
          transkripsi dan rubrik yang ditampilkan berasal dari data contoh.
        </DemoNote>
      )}
      {showUpload && (
        <section className="panel upload-panel">
          <SectionTitle
            title="Unggah lembar jawaban"
            subtitle="Satu file untuk satu siswa. Maksimal 10 MB."
          />
          <form onSubmit={submit}>
            <div className="form-row">
              <div>
                <label htmlFor="student-upload">Siswa</label>
                <select
                  id="student-upload"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  {w.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assessment-upload">Asesmen</label>
                <input
                  id="assessment-upload"
                  value="Kuis 02 · Fotosintesis"
                  readOnly
                />
              </div>
            </div>
            <label className="upload-zone" htmlFor="answer-file">
              <ImagePlus size={27} />
              <strong>
                {file ? file.name : "Pilih foto atau scan jawaban siswa"}
              </strong>
              <span>JPG, PNG, atau PDF · maksimal 10 MB</span>
              <input
                id="answer-file"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setValidation("");
                }}
                aria-describedby={validation ? "file-error" : undefined}
              />
            </label>
            {preview && (
              <img
                className="upload-preview"
                src={preview}
                alt="Pratinjau file jawaban yang dipilih"
              />
            )}
            {validation && (
              <p id="file-error" role="alert" className="field-error">
                {validation}
              </p>
            )}
            <button className="btn primary" disabled={busy}>
              <Upload size={16} />
              {busy
                ? "Menyiapkan contoh review…"
                : isDemo
                  ? "Simulasikan review"
                  : "Kirim untuk dievaluasi"}
            </button>
          </form>
        </section>
      )}
      <div className="assessment-grid">
        <section className="panel submission-list">
          <SectionTitle title="Lembar jawaban" />
          <div className="segmented">
            <button
              className={filter === "pending" ? "selected" : ""}
              aria-pressed={filter === "pending"}
              onClick={() => {
                setFilter("pending");
                setParams({});
              }}
            >
              Perlu review{" "}
              <span>
                {
                  w.submissions.filter((s) => s.status === "AWAITING_REVIEW")
                    .length
                }
              </span>
            </button>
            <button
              className={filter === "all" ? "selected" : ""}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              Semua
            </button>
          </div>
          {rows.length ? (
            rows.map((s) => {
              const student = w.students.find((p) => p.id === s.studentId)!;
              return (
                <button
                  key={s.id}
                  className={`submission-item ${chosen?.id === s.id ? "selected" : ""}`}
                  onClick={() => setParams({ id: s.id })}
                >
                  <Avatar student={student} />
                  <span>
                    <strong>{student.name}</strong>
                    <small>{s.title}</small>
                    <Badge tone={s.status === "APPROVED" ? "green" : "amber"}>
                      {s.status === "APPROVED" ? "Disetujui" : "Perlu review"}
                    </Badge>
                  </span>
                  <ChevronRight size={16} />
                </button>
              );
            })
          ) : (
            <Empty icon={FileCheck2} title="Review selesai">
              Semua jawaban sudah ditinjau. Pilih Semua untuk melihat atau
              merevisi nilai.
            </Empty>
          )}
        </section>
        {chosen ? (
          <AssessmentReview
            key={`${chosen.id}:${chosen.version}`}
            submission={chosen}
          />
        ) : (
          <section className="panel">
            <Empty icon={CheckCircle2} title="Semua sudah beres">
              Unggah jawaban berikutnya atau lihat buku nilai siswa.
              <Link to="/students" className="text-link">
                Buka buku nilai <ArrowRight size={14} />
              </Link>
            </Empty>
          </section>
        )}
      </div>
    </>
  );
}
function AssessmentReview({ submission: s }: { submission: Submission }) {
  const { data: w, busy, run } = useWorkspace();
  const [items, setItems] = useState(() => structuredClone(s.items)),
    [confirmed, setConfirmed] = useState(s.identityConfirmed),
    [editing, setEditing] = useState(false);
  if (!w) return null;
  const student = w.students.find((p) => p.id === s.studentId)!;
  const approved = s.status === "APPROVED";
  const readOnly = approved && !editing;
  return (
    <section className="panel assessment-review">
      <div className="review-heading">
        <div className="person-cell">
          <Avatar student={student} />
          <div>
            <h2>{student.name}</h2>
            <p>
              {s.title} · versi {s.version}
            </p>
          </div>
        </div>
        <Badge tone={approved ? "green" : "amber"}>
          {approved ? "Nilai disetujui" : "Menunggu guru"}
        </Badge>
      </div>
      <div className="evidence-banner">
        <ScanLine size={21} />
        <div>
          <strong>{s.assetName || "Bukti jawaban contoh"}</strong>
          <p>
            {isDemo
              ? "Bukti sintetis · transkripsi contoh di bawah bukan hasil pembacaan file unggahan."
              : "Tinjau transkripsi dan bukti sebelum menyetujui."}
          </p>
        </div>
      </div>
      {items.map((item, n) => (
        <article className="question-review" key={item.question}>
          <div className="question-number">
            SOAL {n + 1}
            <span>Esai · Penalaran</span>
          </div>
          <h3>{item.question}</h3>
          <div className="answer-evidence">
            <span>TRANSKRIPSI {isDemo ? "CONTOH" : "JAWABAN"}</span>
            <p>“{item.answer}”</p>
          </div>
          <div className="rubric-detail">
            <ShieldCheck size={16} />
            <p>
              <strong>Rubrik penilaian</strong>
              {item.rubric}
            </p>
          </div>
          <div className="feedback">
            <Sparkles size={15} />
            <p>{item.feedback}</p>
          </div>
          <div className="score-editor">
            <label htmlFor={`score-${s.id}-${n}`}>
              {readOnly ? "Skor disetujui" : "Skor usulan · dapat Anda ubah"}
            </label>
            <div>
              <input
                id={`score-${s.id}-${n}`}
                type="number"
                min="0"
                max={item.max}
                step="1"
                value={Number.isNaN(item.score) ? "" : item.score}
                readOnly={readOnly}
                onChange={(e) =>
                  setItems((current) =>
                    current.map((i, index) =>
                      index === n
                        ? {
                            ...i,
                            score:
                              e.target.value === ""
                                ? NaN
                                : Number(e.target.value),
                          }
                        : i,
                    ),
                  )
                }
              />
              <span>/ {item.max}</span>
            </div>
          </div>
        </article>
      ))}
      <div className="approval-box">
        {s.history && s.history.length > 0 && (
          <details className="grade-history">
            <summary>
              Riwayat nilai sebelumnya ({s.history.length} versi)
            </summary>
            {s.history.map((h) => (
              <p key={h.version}>
                Versi {h.version} · {percentage(h.items)}/100 · skor per soal:{" "}
                {h.items.map((i) => i.score).join(", ")}
              </p>
            ))}
          </details>
        )}
        <div className="total-score">
          <div>
            <span>TOTAL NILAI</span>
            <p>
              {readOnly
                ? "Sudah tercatat di buku nilai"
                : "Tercatat setelah Anda menyetujui"}
            </p>
          </div>
          <strong>
            {items.every((i) => Number.isFinite(i.score))
              ? percentage(items)
              : "—"}
            <small>/100</small>
          </strong>
        </div>
        {!readOnly && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Saya sudah memeriksa identitas {student.name} dan skor pada jawaban
            ini.
          </label>
        )}
        {readOnly ? (
          <div className="button-row">
            <span className="approved-caption">
              <CheckCircle2 size={17} />
              Disetujui guru
            </span>
            <button className="btn secondary" onClick={() => setEditing(true)}>
              <PencilLine size={15} />
              Revisi nilai
            </button>
          </div>
        ) : (
          <>
            <button
              className="btn primary full"
              disabled={
                busy ||
                !confirmed ||
                items.some(
                  (i) =>
                    !Number.isFinite(i.score) || i.score < 0 || i.score > i.max,
                )
              }
              onClick={() =>
                run(
                  () => client.approveGrade(s.id, s.version, items, confirmed),
                  "Nilai disetujui dan buku nilai diperbarui.",
                )
              }
            >
              <CheckCircle2 size={17} />
              {busy
                ? "Menyimpan persetujuan…"
                : editing
                  ? "Setujui revisi nilai"
                  : "Setujui & simpan nilai"}
            </button>
            {editing && (
              <p className="muted small-text">
                Revisi membuat versi nilai baru. Draf laporan terkait akan
                ditandai perlu diperbarui; laporan final tetap menyimpan versi
                sumbernya.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
export function StudentsPage() {
  const { data: w } = useWorkspace();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  if (!w) return null;
  const students = w.students.filter((s) =>
    s.name.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id")),
  );
  const chosen = w.students.find((s) => s.id === selected);
  const csv =
    "Nama,Jumlah asesmen disetujui,Rata-rata\n" +
    w.students
      .map(
        (s) =>
          `${s.name},${approvedFor(w, s.id).length},${averageFor(w, s.id) ?? ""}`,
      )
      .join("\n");
  return (
    <>
      <PageHeading
        eyebrow="BUKU NILAI"
        title="Kenali capaian, temukan potensi."
        description="Nilai yang sudah Anda setujui, tersusun dalam satu tempat."
      >
        <DownloadButton text={csv} filename="sastra-buku-nilai.csv">
          <ArrowDownToLine size={16} />
          Ekspor CSV
        </DownloadButton>
      </PageHeading>
      {isDemo && <DemoNote />}
      <section className="panel gradebook">
        <div className="section-title">
          <div>
            <h2>
              Kelas IV A <Badge tone="green">{w.students.length} siswa</Badge>
            </h2>
            <p>IPAS · Semester ganjil 2026/2027</p>
          </div>
          <div className="search-field">
            <Search size={17} />
            <label className="sr-only" htmlFor="student-search">
              Cari nama siswa
            </label>
            <input
              id="student-search"
              placeholder="Cari nama siswa…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Siswa</th>
                <th scope="col">Asesmen disetujui</th>
                <th scope="col">Rata-rata</th>
                <th scope="col">Tindak lanjut</th>
                <th scope="col">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const avg = averageFor(w, s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="person-cell">
                        <Avatar student={s} small />
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>{approvedFor(w, s.id).length} asesmen</td>
                    <td>
                      <strong className="table-score">{avg ?? "—"}</strong>
                      <span className="muted"> /100</span>
                    </td>
                    <td>
                      <Badge
                        tone={
                          avg === null
                            ? "neutral"
                            : avg >= 80
                              ? "green"
                              : "amber"
                        }
                      >
                        {avg === null
                          ? "Belum ada bukti"
                          : avg >= 80
                            ? "Pengayaan"
                            : "Pendampingan"}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() =>
                          setSelected(selected === s.id ? "" : s.id)
                        }
                      >
                        {selected === s.id ? "Tutup" : "Detail"}
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!students.length && (
          <Empty icon={Search} title="Siswa tidak ditemukan">
            Coba kata pencarian yang berbeda.
          </Empty>
        )}
        <div className="panel-foot">
          <Info size={14} />
          <span>
            Tindak lanjut contoh memakai batas rata-rata 80; keputusan
            pembelajaran tetap pada guru.
          </span>
        </div>
      </section>
      {chosen && (
        <section className="panel detail-panel">
          <SectionTitle
            title={`Riwayat ${chosen.name}`}
            subtitle="Telusuri sumber nilai sebelum menyusun laporan."
          />
          {approvedFor(w, chosen.id).map((s) => (
            <div className="history-row" key={s.id}>
              <span className="file-icon">
                <FileCheck2 size={20} />
              </span>
              <div>
                <strong>{s.title}</strong>
                <p>
                  {dateLabel(s.date)} · versi {s.version}
                </p>
              </div>
              <strong>{percentage(s.items)}/100</strong>
              <Link className="text-link" to={`/assessment?id=${s.id}`}>
                Tinjau <ArrowRight size={14} />
              </Link>
            </div>
          ))}
          <Link className="btn secondary" to={`/reports?student=${chosen.id}`}>
            <FileText size={16} />
            Susun laporan siswa
          </Link>
        </section>
      )}
    </>
  );
}
export function ReportsPage() {
  const { data: w, busy, run } = useWorkspace();
  const [params] = useSearchParams();
  const [student, setStudent] = useState(params.get("student") || "s1"),
    [selected, setSelected] = useState("");
  if (!w) return null;
  const r = w.reports.find((r) => r.id === selected) || w.reports[0];
  return (
    <>
      <PageHeading
        eyebrow="REPORTAGENT"
        title="Setiap perkembangan layak diceritakan."
        description="Susun narasi yang empatik dari bukti belajar yang sudah diverifikasi."
      />
      {isDemo && (
        <DemoNote>
          Narasi demo memakai template dari rata-rata nilai disetujui. Belum ada
          analisis kompetensi atau generasi AI.
        </DemoNote>
      )}
      <section className="panel report-generator">
        <div>
          <span className="report-generate-icon">
            <FileText size={23} />
          </span>
          <div>
            <h2>Mulai laporan perkembangan</h2>
            <p>Nilai yang belum disetujui tidak disertakan.</p>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await run(
                () => client.generateReport(student),
                "Draf laporan siap ditinjau.",
              )
            )
              setSelected("");
          }}
        >
          <label className="sr-only" htmlFor="report-student">
            Pilih siswa untuk laporan
          </label>
          <select
            id="report-student"
            value={student}
            onChange={(e) => setStudent(e.target.value)}
          >
            {w.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            className="btn primary"
            disabled={busy || !approvedFor(w, student).length}
          >
            <Sparkles size={16} />
            {busy ? "Menyiapkan draf…" : "Buat draf"}
          </button>
        </form>
      </section>
      {!w.reports.length ? (
        <section className="panel">
          <Empty icon={FileText} title="Cerita perkembangan dimulai di sini">
            Pilih siswa di atas untuk menyusun draf laporan pertamanya. Anda
            dapat meninjau dan menyunting narasi sebelum finalisasi.
          </Empty>
          <div className="report-empty-flow">
            <span>
              <CheckCircle2 size={18} />
              Nilai disetujui
            </span>
            <ArrowRight size={15} />
            <span>
              <PencilLine size={18} />
              Draf & review guru
            </span>
            <ArrowRight size={15} />
            <span>
              <FileCheck2 size={18} />
              Laporan final
            </span>
          </div>
        </section>
      ) : (
        <div className="report-grid">
          <section className="panel report-list">
            <SectionTitle title="Dokumen laporan" />
            {w.reports.map((report) => {
              const p = w.students.find((s) => s.id === report.studentId)!;
              return (
                <button
                  key={report.id}
                  className={`report-list-item ${r?.id === report.id ? "selected" : ""}`}
                  onClick={() => setSelected(report.id)}
                >
                  <Avatar student={p} small />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{dateLabel(report.createdAt)}</small>
                    <Badge tone={report.status === "FINAL" ? "green" : "amber"}>
                      {report.status === "FINAL"
                        ? "Final"
                        : report.status === "STALE"
                          ? "Sumber berubah"
                          : "Draf review"}
                    </Badge>
                  </span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </section>
          {r && <ReportEditor key={`${r.id}:${r.version}`} report={r} />}
        </div>
      )}
    </>
  );
}
function ReportEditor({ report: r }: { report: Report }) {
  const { data: w, busy, run } = useWorkspace();
  const [narrative, setNarrative] = useState(r.narrative),
    [reviewed, setReviewed] = useState(false);
  if (!w) return null;
  const s = w.students.find((s) => s.id === r.studentId)!;
  const changed = r.snapshot !== snapshotFor(w, r.studentId);
  return (
    <section className="panel report-document">
      <div className="report-doc-header">
        <span className="eyebrow">CATATAN PERKEMBANGAN SISWA</span>
        <Badge tone={r.status === "FINAL" ? "green" : "amber"}>
          {r.status === "FINAL"
            ? "Final"
            : r.status === "STALE"
              ? "Perlu diperbarui"
              : "Draf"}
        </Badge>
      </div>
      <h2>{s.name}</h2>
      <p className="muted">IPAS · Kelas IV A · Semester ganjil 2026/2027</p>
      <div className="report-source">
        <span>
          Rata-rata pada versi sumber <strong>{r.average}/100</strong>
        </span>
        <span>
          Versi laporan <strong>v{r.version}</strong>
        </span>
      </div>
      {(r.status === "STALE" || changed) && (
        <div className="notice warning">
          <History size={18} />
          <span>
            {r.status === "FINAL"
              ? "Nilai sumber telah berubah. Laporan final ini menyimpan data saat finalisasi; buat draf baru untuk merevisinya."
              : "Ada perubahan nilai setelah draf dibuat. Buat draf baru menggunakan nilai terbaru."}
          </span>
        </div>
      )}
      <label htmlFor={`narrative-${r.id}`}>Narasi capaian belajar</label>
      <textarea
        id={`narrative-${r.id}`}
        rows={9}
        value={narrative}
        maxLength={5000}
        onChange={(e) => setNarrative(e.target.value)}
        readOnly={r.status !== "DRAFT" || changed}
      />
      <div className="source-trace">
        <ShieldCheck size={15} />
        <div>
          <strong>Jejak sumber</strong>
          <code>{r.snapshot}</code>
          <p>Hanya mencakup asesmen disetujui pada saat draf dibuat.</p>
        </div>
      </div>
      {r.status === "DRAFT" && !changed && (
        <>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            Saya telah meninjau narasi dan kesesuaiannya dengan bukti capaian
            siswa.
          </label>
          <button
            disabled={busy || !reviewed || !narrative.trim()}
            className="btn primary"
            onClick={() =>
              run(
                () => client.finalizeReport(r.id, r.version, narrative),
                "Laporan difinalisasi. Versi sumber telah dikunci.",
              )
            }
          >
            <FileCheck2 size={17} />
            {busy ? "Menyimpan…" : "Finalisasi laporan"}
          </button>
        </>
      )}
      {r.status === "FINAL" && (
        <DownloadButton
          text={`SASTRA — Laporan perkembangan\n${s.name} | Kelas IV A | IPAS\nRata-rata: ${r.average}\n\n${r.narrative}\n\nVersi laporan: ${r.version}\nSumber: ${r.snapshot}`}
          filename={`laporan-${s.name.toLowerCase().replaceAll(" ", "-")}.txt`}
        >
          <ArrowDownToLine size={16} />
          Unduh laporan final (.txt)
        </DownloadButton>
      )}
    </section>
  );
}
export function ActivityPage() {
  const { data: w } = useWorkspace();
  const [filter, setFilter] = useState("all");
  if (!w) return null;
  const activities = w.activities.filter(
    (a) => filter === "all" || a.agent === filter,
  );
  return (
    <>
      <PageHeading
        eyebrow="AKTIVITAS AGEN"
        title="Kerja asisten, tetap transparan."
        description="Lihat apa yang disiapkan asisten dan keputusan yang dibuat guru."
      />
      {isDemo && (
        <DemoNote>
          Riwayat ini mencatat tindakan pada simulasi lokal. Tidak ada agen AI
          yang berjalan di server.
        </DemoNote>
      )}
      <section className="panel activity-page">
        <div className="section-title">
          <div>
            <h2>Jejak aktivitas</h2>
            <p>{activities.length} aktivitas tercatat</p>
          </div>
          <div>
            <label className="sr-only" htmlFor="agent-filter">
              Filter aktivitas agen
            </label>
            <select
              id="agent-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Semua aktivitas</option>
              {["ContentAgent", "VisionAgent", "ReportAgent", "Guru"].map(
                (a) => (
                  <option key={a}>{a}</option>
                ),
              )}
            </select>
          </div>
        </div>
        {activities.length ? (
          activities.map((a) => (
            <div className="activity-row" key={a.id}>
              <AgentIcon agent={a.agent} />
              <div>
                <strong>{a.agent}</strong>
                <p>{a.text}</p>
                <time dateTime={a.time}>{dateLabel(a.time)}</time>
              </div>
              <Badge tone={a.agent === "Guru" ? "green" : "purple"}>
                {a.agent === "Guru" ? "Keputusan guru" : "Disiapkan asisten"}
              </Badge>
            </div>
          ))
        ) : (
          <Empty title="Belum ada aktivitas">
            Aktivitas asisten akan muncul setelah Anda menjalankan alurnya.
          </Empty>
        )}
      </section>
    </>
  );
}
