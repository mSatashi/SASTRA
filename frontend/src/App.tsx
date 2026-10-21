import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { isDemo, resetDemo } from "./client";
import { useWorkspace } from "./store";
import { Badge, Logo, Modal } from "./ui";
import Dashboard from "./Dashboard";
const ContentPage = lazy(() =>
  import("./pages").then((m) => ({ default: m.ContentPage })),
);
const AssessmentPage = lazy(() =>
  import("./pages").then((m) => ({ default: m.AssessmentPage })),
);
const StudentsPage = lazy(() =>
  import("./pages").then((m) => ({ default: m.StudentsPage })),
);
const ReportsPage = lazy(() =>
  import("./pages").then((m) => ({ default: m.ReportsPage })),
);
const ActivityPage = lazy(() =>
  import("./pages").then((m) => ({ default: m.ActivityPage })),
);
const links = [
  { to: "/", label: "Ringkasan", icon: LayoutDashboard },
  { to: "/content", label: "Materi & kuis", icon: BookOpen },
  { to: "/assessment", label: "Koreksi jawaban", icon: ScanLine },
  { to: "/students", label: "Buku nilai", icon: Users },
  { to: "/reports", label: "Laporan siswa", icon: FileText },
  { to: "/activity", label: "Aktivitas agen", icon: Activity },
];
export default function App() {
  const { data, loading, error, reload, toast } = useWorkspace();
  const [open, setOpen] = useState(false),
    [help, setHelp] = useState(false),
    [reset, setReset] = useState(false);
  const location = useLocation(),
    closeRef = useRef<HTMLButtonElement>(null),
    menuRef = useRef<HTMLButtonElement>(null),
    wasOpen = useRef(false);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [location.pathname]);
  useLayoutEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) menuRef.current?.focus();
    wasOpen.current = open;
  }, [open]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
    };
  }, [open]);
  const pending =
    data?.submissions.filter((s) => s.status === "AWAITING_REVIEW").length || 0;
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Langsung ke konten
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Tutup navigasi"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${open ? "open" : ""}`}
        aria-label="Navigasi utama"
        onKeyDown={(e) => {
          if (e.key !== "Tab" || !open) return;
          const nodes =
            e.currentTarget.querySelectorAll<HTMLElement>("a,button");
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="sidebar-brand">
          <Link
            to="/"
            aria-label="SASTRA beranda"
            onClick={() => setOpen(false)}
          >
            <Logo />
          </Link>
          <button
            ref={closeRef}
            className="icon-btn mobile-close"
            aria-label="Tutup navigasi"
            onClick={() => {
              setOpen(false);
            }}
          >
            <X size={22} />
          </button>
        </div>
        <span className="workspace-label">RUANG KERJA GURU</span>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              end={to === "/"}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {to === "/assessment" && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="assistant-card">
            <span className="assistant-ornament">✳</span>
            <strong>Lebih dekat dengan siswa.</strong>
            <p>
              Biarkan asisten membantu administrasi, Anda fokus menginspirasi.
            </p>
            <Link to="/content">
              Mulai dari materi <ArrowRight size={15} />
            </Link>
          </div>
          <button className="help-link" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            Panduan penggunaan
          </button>
          <div className="profile">
            <span className="teacher-avatar">N</span>
            <div>
              <strong>Bu Nadia</strong>
              <span>Guru kelas · profil contoh</span>
            </div>
            <Badge tone="green">Guru</Badge>
          </div>
        </div>
      </aside>
      <div className="main-wrap" inert={open}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              ref={menuRef}
              className="icon-btn menu-btn"
              aria-label="Buka navigasi"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={23} />
            </button>
            <span className="breadcrumb">
              Ruang kerja <span>/</span>{" "}
              <strong>
                {links.find((l) => l.to === location.pathname)?.label ||
                  "Halaman"}
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <Badge tone={isDemo ? "amber" : "green"}>
              {isDemo ? "● Mode demo" : "Terhubung API"}
            </Badge>
            <span className="topbar-divider" />
            <span className="semester">Semester ganjil 2026/2027</span>
            <span className="teacher-avatar small">N</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="context-row">
            <span>
              <GraduationCap size={17} /> SD Nusantara{" "}
              <span className="context-dot">·</span> <strong>Kelas IV A</strong>
            </span>
            <span className="context-sub">
              IPAS <ChevronDown size={14} />
            </span>
          </div>
          {error && (
            <div className="notice error" role="alert">
              <span>{error}</span>
              <button className="text-link" onClick={reload}>
                Muat ulang
              </button>
              {isDemo && (
                <button className="text-link" onClick={() => setReset(true)}>
                  Reset demo
                </button>
              )}
            </div>
          )}
          {loading ? (
            <div className="loading-state" role="status">
              <span className="spinner" />
              <h2>Menyiapkan ruang kerja…</h2>
              <p>Memuat materi dan perkembangan siswa.</p>
            </div>
          ) : data ? (
            <Suspense
              fallback={
                <div className="loading-state" role="status">
                  Memuat halaman…
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/content" element={<ContentPage />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route
                  path="*"
                  element={
                    <div className="empty">
                      <h1>Halaman tidak ditemukan</h1>
                      <Link to="/" className="btn primary">
                        Kembali ke ringkasan
                      </Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          ) : (
            <div className="empty">
              <h1>Ruang kerja belum dapat dibuka</h1>
              <p>Periksa koneksi, lalu muat ulang data.</p>
              <button className="btn primary" onClick={reload}>
                Coba lagi
              </button>
            </div>
          )}
          <footer>
            <span>
              <ShieldCheck size={14} /> Nilai tetap dalam kendali guru
            </span>
            <span>SASTRA · Asisten belajar, ruang bertumbuh.</span>
            {isDemo && (
              <button onClick={() => setReset(true)}>
                <RotateCcw size={12} /> Reset demo
              </button>
            )}
          </footer>
        </main>
      </div>
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={20} />
          {toast}
        </div>
      )}
      {help && (
        <Modal titleId="help-title" onClose={() => setHelp(false)}>
          <button
            autoFocus
            className="modal-close icon-btn"
            aria-label="Tutup panduan"
            onClick={() => setHelp(false)}
          >
            <X />
          </button>
          <span className="eyebrow">MULAI DARI SINI</span>
          <h2 id="help-title">Alur kerja SASTRA</h2>
          <ol className="help-steps">
            <li>
              <strong>Siapkan materi & kuis.</strong>
              <p>Isi topik dan tujuan, lalu tinjau draf sebelum disetujui.</p>
            </li>
            <li>
              <strong>Periksa jawaban siswa.</strong>
              <p>
                Tinjau transkripsi dan bukti jawaban, konfirmasi identitas,
                sesuaikan skor dan setujui.
              </p>
            </li>
            <li>
              <strong>Pantau & susun laporan.</strong>
              <p>
                Hanya nilai disetujui yang digunakan. Perubahan nilai akan
                membuat draf lama perlu diperbarui.
              </p>
            </li>
          </ol>
          <p className="muted">
            {isDemo
              ? "Demo memakai profil dan data sintetis. Belum ada OCR atau panggilan Gemini pada mode demo."
              : "Mode API memakai backend untuk generasi dan penyimpanan. Profil kelas masih contoh; gunakan data sintetis sampai autentikasi guru dan penyimpanan produksi tersedia."}
          </p>
          <button className="btn primary" onClick={() => setHelp(false)}>
            Mengerti <CheckCircle2 size={16} />
          </button>
        </Modal>
      )}
      {reset && (
        <Modal titleId="reset-title" onClose={() => setReset(false)}>
          <h2 id="reset-title">Ulangi demo dari awal?</h2>
          <p>
            Materi, persetujuan nilai, dan laporan yang Anda buat pada demo di
            browser ini akan dihapus dan diganti data contoh awal.
          </p>
          <div className="button-row">
            <button
              autoFocus
              className="btn secondary"
              onClick={() => setReset(false)}
            >
              Batal
            </button>
            <button
              className="btn primary"
              onClick={() => {
                resetDemo();
                setReset(false);
                reload();
              }}
            >
              Ya, reset demo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
