import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  Clock3,
  FileText,
  ScanLine,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { averageFor, percentage } from "./domain";
import { isDemo } from "./client";
import { useWorkspace } from "./store";
import {
  AgentIcon,
  Avatar,
  Badge,
  dateLabel,
  DemoNote,
  PageHeading,
  SectionTitle,
} from "./ui";
export default function Dashboard() {
  const { data: w } = useWorkspace();
  if (!w) return null;
  const pending = w.submissions.filter((s) => s.status === "AWAITING_REVIEW");
  const approved = w.submissions.filter((s) => s.status === "APPROVED");
  const avg = Math.round(
    approved.reduce((n, s) => n + percentage(s.items), 0) /
      Math.max(1, approved.length),
  );
  const greeting = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return (
    <>
      <PageHeading
        eyebrow={greeting}
        title="Selamat datang, Bu Nadia 👋"
        description="Ruang untuk mengajar lebih bermakna, setiap harinya."
      >
        <Link className="btn secondary" to="/students">
          <Users size={16} />
          Lihat kelas <ArrowUpRight size={15} />
        </Link>
      </PageHeading>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span className="live-dot" /> ASISTEN GURU ANDA
          </span>
          <h2>
            Lebih sedikit administrasi.
            <br />
            <em>Lebih banyak inspirasi.</em>
          </h2>
          <p>
            Dari merancang materi hingga memahami perkembangan siswa,
            <br className="desktop-break" /> SASTRA siap menemani setiap langkah
            Anda.
          </p>
          <Link to="/content" className="btn lime">
            <Sparkles size={17} />
            Buat materi pembelajaran <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-star star-one">✳</span>
          <span className="art-star star-two">✦</span>
          <div className="floating-note note-a">
            <span className="note-icon">
              <BookOpen size={21} />
            </span>
            <div>
              <strong>Materi yang bermakna</strong>
              <span>Berangkat dari rasa ingin tahu</span>
            </div>
            <span className="note-check">✓</span>
          </div>
          <div className="floating-note note-b">
            <div className="note-chart">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <strong>
              Setiap siswa punya
              <br />
              cerita bertumbuh.
            </strong>
            <span className="note-trend">↗</span>
          </div>
          <span className="art-caption">
            DIRANCANG UNTUK GURU. BERMAKNA UNTUK SISWA.
          </span>
        </div>
      </section>
      <div className="metrics-grid">
        {[
          {
            label: "Siswa di kelas",
            value: w.students.length,
            note: "Kelas IV A · IPAS",
            icon: Users,
            color: "sage",
          },
          {
            label: "Menunggu review",
            value: pending.length.toString().padStart(2, "0"),
            note: "Jawaban perlu sentuhan Anda",
            icon: ScanLine,
            color: "sand",
          },
          {
            label: "Rata-rata nilai",
            value: avg,
            note: `${approved.length} asesmen disetujui`,
            icon: CheckCheck,
            color: "lavender",
          },
          {
            label: "Laporan final",
            value: w.reports
              .filter((r) => r.status === "FINAL")
              .length.toString()
              .padStart(2, "0"),
            note: "Sudah ditinjau guru",
            icon: FileText,
            color: "rose",
          },
        ].map(({ label, value, note, icon: Icon, color }) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <span className={`metric-icon ${color}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong className="metric-value">{value}</strong>
            <span className="metric-note">{note}</span>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel review-panel">
          <SectionTitle
            title="Butuh perhatian Anda"
            subtitle="Satu tinjauan kecil, dampak yang berarti."
            to="/assessment"
            link="Buka koreksi"
          />
          <div className="review-table">
            <div className="table-header">
              <span>SISWA & ASESMEN</span>
              <span>USULAN NILAI</span>
              <span />
            </div>
            {pending.length ? (
              pending.slice(0, 3).map((s) => {
                const student = w.students.find((p) => p.id === s.studentId)!;
                return (
                  <div className="review-row" key={s.id}>
                    <div className="person-cell">
                      <Avatar student={student} />
                      <div>
                        <strong>{student.name}</strong>
                        <span>{s.title}</span>
                      </div>
                    </div>
                    <div className="score-cell">
                      <strong>
                        {percentage(s.items)}
                        <small>/100</small>
                      </strong>
                      <Badge tone="amber">Perlu review</Badge>
                    </div>
                    <Link
                      className="review-action"
                      aria-label={`Tinjau jawaban ${student.name}`}
                      to={`/assessment?id=${s.id}`}
                    >
                      <ArrowUpRight size={19} />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="inline-empty">
                <CheckCheck size={24} />
                <strong>Semua jawaban sudah ditinjau.</strong>
                <p>Kerja bagus. Buku nilai Anda sudah diperbarui.</p>
              </div>
            )}
          </div>
          <div className="panel-foot">
            <ShieldText />{" "}
            <span>Persetujuan Anda membuat nilai resmi tercatat.</span>
          </div>
        </section>
        <section className="panel progress-panel">
          <SectionTitle
            title="Potret kelas"
            subtitle="Berdasarkan nilai yang disetujui"
          />
          <div className="progress-summary">
            <strong>
              {
                w.students.filter((s) => (averageFor(w, s.id) ?? 0) >= 80)
                  .length
              }
              <span> / {w.students.length} siswa</span>
            </strong>
            <Badge tone="green">Rata-rata ≥ 80</Badge>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={w.students
              .map(
                (s) => `${s.name}: ${averageFor(w, s.id) ?? "belum ada nilai"}`,
              )
              .join("; ")}
          >
            <div className="chart-grid">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div className="chart-bars">
              {w.students.map((s) => (
                <div className="chart-bar" key={s.id}>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${(averageFor(w, s.id) || 0) >= 80 ? "high" : ""}`}
                      style={{ height: `${averageFor(w, s.id) || 0}%` }}
                    >
                      <span>{averageFor(w, s.id)}</span>
                    </div>
                  </div>
                  <span>{s.initials}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span />
            <span>Rata-rata per siswa · skala 0–100</span>
          </div>
          <Link className="text-link" to="/students">
            Jelajahi buku nilai <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="dashboard-columns bottom-columns">
        <section className="panel">
          <SectionTitle
            title="Ruang kerja Anda"
            subtitle="Tiga asisten, satu alur pembelajaran."
          />
          <div className="workflow-cards">
            {[
              {
                to: "/content",
                icon: BookOpen,
                color: "sage",
                no: "01",
                title: "Rancang pembelajaran",
                text: "Modul & kuis yang memantik rasa ingin tahu.",
              },
              {
                to: "/assessment",
                icon: ScanLine,
                color: "lavender",
                no: "02",
                title: "Pahami jawaban siswa",
                text: "Tinjau bukti, skor, dan umpan balik personal.",
              },
              {
                to: "/reports",
                icon: FileText,
                color: "sand",
                no: "03",
                title: "Ceritakan perkembangan",
                text: "Susun laporan dari capaian yang terverifikasi.",
              },
            ].map(({ to, icon: Icon, color, no, title, text }) => (
              <Link key={to} className="workflow-card" to={to}>
                <div>
                  <span className={`workflow-icon ${color}`}>
                    <Icon size={20} />
                  </span>
                  <span className="workflow-no">{no}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <ArrowUpRight className="workflow-arrow" size={17} />
              </Link>
            ))}
          </div>
        </section>
        <section className="panel">
          <SectionTitle title="Jejak aktivitas" to="/activity" link="Semua" />
          <div className="timeline">
            {w.activities.slice(0, 3).map((a) => (
              <div className="timeline-item" key={a.id}>
                <AgentIcon agent={a.agent} />
                <div>
                  <strong>{a.agent}</strong>
                  <p>{a.text}</p>
                  <time dateTime={a.time}>
                    <Clock3 size={11} />
                    {dateLabel(a.time)}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <DemoNote>
        {isDemo
          ? undefined
          : "Terhubung ke backend. Daftar siswa dan profil kelas masih contoh; generasi AI memerlukan ADC atau service account pada backend."}
      </DemoNote>
    </>
  );
}
function ShieldText() {
  return <ArrowDownToLine size={14} />;
}
