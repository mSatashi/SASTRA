import { describe, expect, it } from "vitest";
import {
  approveGrade,
  approvedFor,
  averageFor,
  finalizeReport,
  generateReport,
  makeFixture,
  snapshotFor,
} from "./domain";
describe("teacher approval and report evidence", () => {
  it("excludes proposed grades until the teacher approves them", () => {
    const w = makeFixture(),
      s = w.submissions[0];
    expect(approvedFor(w, s.studentId)).toHaveLength(1);
    expect(averageFor(w, s.studentId)).toBe(88);
    approveGrade(w, s.id, s.version, s.items, true);
    expect(approvedFor(w, s.studentId)).toHaveLength(2);
    expect(averageFor(w, s.studentId)).toBe(85);
  });
  it("rejects unconfirmed identity, invalid scores and stale writes", () => {
    const w = makeFixture(),
      s = w.submissions[0];
    expect(() => approveGrade(w, s.id, 1, s.items, false)).toThrow("identitas");
    expect(() =>
      approveGrade(
        w,
        s.id,
        1,
        s.items.map((i) => ({ ...i, score: 51 })),
        true,
      ),
    ).toThrow("Skor");
    expect(() =>
      approveGrade(
        w,
        s.id,
        1,
        s.items.map((i) => ({ ...i, score: NaN })),
        true,
      ),
    ).toThrow("Skor");
    approveGrade(w, s.id, 1, s.items, true);
    expect(() => approveGrade(w, s.id, 1, s.items, true)).toThrow("berubah");
  });
  it("preserves authoritative evidence and maximum scores", () => {
    const w = makeFixture(),
      s = w.submissions[0];
    approveGrade(
      w,
      s.id,
      1,
      s.items.map((i) => ({ ...i, max: 1000, answer: "tampered", score: 20 })),
      true,
    );
    expect(s.items[0].max).toBe(50);
    expect(s.items[0].answer).not.toBe("tampered");
  });
  it("stales drafts when approved grades change and blocks finalizing them", () => {
    const w = makeFixture(),
      s = w.submissions[0];
    generateReport(w, s.studentId);
    const r = w.reports[0];
    expect(r.snapshot).toBe(snapshotFor(w, s.studentId));
    approveGrade(w, s.id, 1, s.items, true);
    expect(r.status).toBe("STALE");
    expect(() => finalizeReport(w, r.id, r.version, r.narrative)).toThrow(
      "Sumber",
    );
  });
  it("keeps a final report snapshot immutable after later grade revisions", () => {
    const w = makeFixture(),
      s = w.submissions[0];
    generateReport(w, s.studentId);
    const r = w.reports[0],
      source = r.snapshot,
      average = r.average;
    finalizeReport(w, r.id, 1, "Narasi yang sudah diperiksa guru.");
    approveGrade(w, s.id, 1, s.items, true);
    expect(r.status).toBe("FINAL");
    expect(r.snapshot).toBe(source);
    expect(r.average).toBe(average);
    expect(r.snapshot).not.toBe(snapshotFor(w, s.studentId));
    expect(() => finalizeReport(w, r.id, r.version, "overwrite")).toThrow();
  });
  it("retains prior approved evidence when a teacher revises a grade", () => {
    const w = makeFixture(),
      s = w.submissions.find((s) => s.id === "old-s1")!;
    approveGrade(
      w,
      s.id,
      1,
      s.items.map((i) => ({ ...i, score: 30 })),
      true,
    );
    expect(s.version).toBe(2);
    expect(s.items[0].score).toBe(30);
    expect(s.history?.[0].version).toBe(1);
    expect(s.history?.[0].items[0].score).toBe(46);
  });
  it("requires approved evidence and does not imply a trend from one result", () => {
    const w = makeFixture();
    w.submissions = w.submissions.filter((s) => s.status !== "APPROVED");
    expect(() => generateReport(w, "s1")).toThrow("Belum ada");
    const initial = makeFixture();
    generateReport(initial, "s1");
    expect(initial.reports[0].narrative).toContain(
      "Bukti asesmen berikutnya diperlukan",
    );
  });
});

it("scopes multi-material evidence and applies teacher weights without category defaults", () => {
  const w = makeFixture();
  const first = w.submissions.find(
    (s) => s.studentId === "s1" && s.status === "APPROVED",
  )!;
  Object.assign(first, {
    subject: "Matematika",
    assessmentType: "UTS",
    semester: "GENAP",
    materials: ["Pecahan", "Bilangan"],
    weight: 2,
  });
  w.submissions.push({
    ...structuredClone(first),
    id: "weighted",
    weight: 1,
    items: first.items.map((i) => ({ ...i, score: 0 })),
  });
  const scope = {
    subject: "Matematika",
    semester: "GENAP",
    material: "Pecahan",
  };
  expect(averageFor(w, "s1", scope)).toBe(59);
  expect(approvedFor(w, "s1", { material: "Bilangan" })).toHaveLength(2);
  generateReport(w, "s1", scope);
  expect(w.reports[0].scope).toEqual(scope);
  expect(w.reports[0].snapshot).toBe(snapshotFor(w, "s1", scope));
  expect(averageFor(w, "s1", { subject: "Bahasa Inggris" })).toBeNull();
});
