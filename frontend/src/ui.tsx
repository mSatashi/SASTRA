import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileText,
  ScanLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Student } from "./domain";
export function Logo() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <BookOpen size={23} strokeWidth={1.7} />
      </span>
      <span>
        SASTRA<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "purple";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Avatar({
  student,
  small = false,
}: {
  student: Student;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${student.color} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      {student.initials}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function SectionTitle({
  title,
  subtitle,
  to,
  link,
}: {
  title: string;
  subtitle?: string;
  to?: string;
  link?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {link || "Lihat semua"}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Empty({
  icon: Icon = FileText,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function AgentIcon({ agent }: { agent: string }) {
  const Icon =
    agent === "ContentAgent"
      ? BookOpen
      : agent === "VisionAgent"
        ? ScanLine
        : agent === "Guru"
          ? Check
          : FileText;
  return (
    <span
      className={`agent-icon ${agent === "VisionAgent" ? "purple" : agent === "Guru" ? "amber" : ""}`}
    >
      <Icon size={18} />
    </span>
  );
}
export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-note">
      <Sparkles size={15} />
      <span>
        {children ||
          "Data sintetis untuk eksplorasi. Hasil pada demo ini berupa simulasi, belum terhubung ke AI."}
      </span>
    </div>
  );
}
export function DownloadButton({
  text,
  filename,
  children,
}: {
  text: string;
  filename: string;
  children: ReactNode;
}) {
  return (
    <button
      className="btn secondary"
      onClick={() => {
        const url = URL.createObjectURL(
          new Blob([text], { type: "text/plain;charset=utf-8" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      {children}
    </button>
  );
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
export function Modal({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom)
        )
          onClose();
      }}
    >
      {children}
    </dialog>
  );
}
