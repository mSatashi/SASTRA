import {
  addActivity,
  approveGrade,
  finalizeReport,
  generateReport,
  makeFixture,
  type ContentInput,
  type GradeItem,
  type UploadInput,
  type Workspace,
} from "./domain";
export const isDemo = import.meta.env.VITE_DATA_MODE !== "api";
const key = "sastra-demo-v1";
const apiBase = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");
export const assetUrl = (id: string) =>
  `${apiBase}/submissions/${encodeURIComponent(id)}/asset`;
const pause = () => new Promise<void>((r) => setTimeout(r, 550));
export interface SastraClient {
  load(): Promise<Workspace>;
  approveGrade(
    id: string,
    version: number,
    items: GradeItem[],
    confirmed: boolean,
  ): Promise<Workspace>;
  generateContent(input: ContentInput): Promise<Workspace>;
  approveContent(id: string, version: number): Promise<Workspace>;
  upload(input: UploadInput): Promise<Workspace>;
  generateReport(studentId: string): Promise<Workspace>;
  finalizeReport(
    id: string,
    version: number,
    narrative: string,
  ): Promise<Workspace>;
}
class DemoClient implements SastraClient {
  private read(): Workspace {
    const saved = localStorage.getItem(key);
    if (!saved) return makeFixture();
    const w = JSON.parse(saved) as Workspace;
    if (w.schema !== 1 || !Array.isArray(w.students))
      throw new Error(
        "Data demo tidak kompatibel. Reset data demo untuk memulai lagi.",
      );
    return w;
  }
  private async change(fn: (w: Workspace) => Workspace) {
    await pause();
    const next = fn(this.read());
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  }
  async load() {
    await pause();
    return this.read();
  }
  approveGrade(id: string, v: number, items: GradeItem[], confirmed: boolean) {
    return this.change((w) => approveGrade(w, id, v, items, confirmed));
  }
  generateContent(i: ContentInput) {
    return this.change((w) => {
      if (!i.topic.trim() || !i.objective.trim())
        throw new Error("Lengkapi topik dan tujuan pembelajaran.");
      w.contents.unshift({
        id: crypto.randomUUID(),
        title: i.topic.trim(),
        objective: i.objective.trim(),
        duration: i.duration,
        version: 1,
        status: "DRAFT",
        module: `Pemantik: apa hubungan ${i.topic.toLowerCase()} dengan pengalamanmu sehari-hari?\n\nEksplorasi: amati contoh di sekitar kelas dan catat temuan dalam kelompok kecil.\n\nRefleksi: jelaskan kembali hasil pengamatan dan satu pertanyaan yang masih ingin kamu cari jawabannya.`,
        questions: [
          `Sebutkan satu contoh ${i.topic.toLowerCase()} yang kamu temui di lingkungan rumah.`,
          "Jelaskan alasan di balik hasil pengamatanmu. Bukti apa yang mendukungnya?",
        ],
      });
      addActivity(
        w,
        "ContentAgent",
        `Draf contoh “${i.topic}” disiapkan untuk ditinjau.`,
      );
      return w;
    });
  }
  approveContent(id: string, version: number) {
    return this.change((w) => {
      const c = w.contents.find((c) => c.id === id);
      if (!c || c.version !== version || c.status !== "DRAFT")
        throw new Error("Versi materi telah berubah. Muat ulang data.");
      c.status = "APPROVED";
      c.version++;
      addActivity(w, "Guru", `Materi “${c.title}” disetujui.`);
      return w;
    });
  }
  upload(i: UploadInput) {
    return this.change((w) => {
      const template = makeFixture().submissions[0];
      if (!w.students.some((s) => s.id === i.studentId))
        throw new Error("Pilih siswa yang terdaftar.");
      if (
        !["image/jpeg", "image/png", "application/pdf"].includes(i.file.type) ||
        i.file.size > 10 * 1024 * 1024
      )
        throw new Error("Gunakan JPG, PNG, atau PDF berukuran maksimal 10 MB.");
      w.submissions.unshift({
        ...structuredClone(template),
        id: crypto.randomUUID(),
        studentId: i.studentId,
        title: i.title,
        date: new Date().toISOString(),
        assetName: i.file.name,
      });
      addActivity(
        w,
        "VisionAgent",
        "Simulasi unggahan selesai. Transkripsi contoh siap ditinjau; file tidak dikirim ke AI.",
      );
      return w;
    });
  }
  generateReport(studentId: string) {
    return this.change((w) => generateReport(w, studentId));
  }
  finalizeReport(id: string, v: number, narrative: string) {
    return this.change((w) => finalizeReport(w, id, v, narrative));
  }
}
class BackendClient implements SastraClient {
  private base = apiBase;
  private async request(path: string, init?: RequestInit) {
    const r = await fetch(`${this.base}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });
    if (!r.ok) {
      if (r.status === 401)
        window.dispatchEvent(new Event("sastra-session-expired"));
      const error = await r.json().catch(() => null);
      throw new Error(
        typeof error?.detail === "string"
          ? error.detail
          : `Server gagal merespons (${r.status}). Periksa koneksi dan coba lagi.`,
      );
    }
    return r;
  }
  async load(): Promise<Workspace> {
    return (await this.request("/dashboard")).json();
  }
  private async mutate(path: string, body: unknown) {
    await this.request(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    return this.load();
  }
  approveGrade(
    id: string,
    expectedVersion: number,
    gradeItems: GradeItem[],
    identityConfirmed: boolean,
  ) {
    return this.mutate(`/submissions/${encodeURIComponent(id)}/approve-grade`, {
      expectedVersion,
      gradeItems,
      identityConfirmed,
    });
  }
  generateContent(input: ContentInput) {
    return this.mutate("/assessment-versions/generate", input);
  }
  approveContent(id: string, expectedVersion: number) {
    return this.mutate(
      `/assessment-versions/${encodeURIComponent(id)}/approve`,
      { expectedVersion },
    );
  }
  upload(i: UploadInput) {
    const f = new FormData();
    f.set("file", i.file);
    f.set("studentId", i.studentId);
    f.set("title", i.title);
    if (i.contentId) f.set("contentId", i.contentId);
    return this.mutate("/submissions", f);
  }
  generateReport(studentId: string) {
    return this.mutate("/reports/generate", { studentId });
  }
  finalizeReport(id: string, expectedVersion: number, narrative: string) {
    return this.mutate(`/report-versions/${encodeURIComponent(id)}/finalize`, {
      expectedVersion,
      narrative,
    });
  }
}
export const client: SastraClient = isDemo
  ? new DemoClient()
  : new BackendClient();
export function resetDemo() {
  if (isDemo) localStorage.removeItem(key);
}
