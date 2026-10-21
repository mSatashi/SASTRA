import type { AnswerKeyItem, EvidenceScope, Submission } from "./domain";

export const emptyQuestion = (): AnswerKeyItem => ({
  type: "essay",
  question: "",
  options: [],
  correctAnswer: "",
  rubric: "",
  max: 10,
});

export function EvidenceFilters({
  records,
  value,
  onChange,
  prefix,
}: {
  records: Submission[];
  value: EvidenceScope;
  onChange: (value: EvidenceScope) => void;
  prefix: string;
}) {
  const choices = {
    subject: [...new Set(records.map((s) => s.subject || "IPAS"))],
    semester: ["GANJIL", "GENAP"],
    assessmentType: ["TUGAS", "KUIS", "UTS", "UAS"],
    material: [...new Set(records.flatMap((s) => s.materials || [s.title]))],
  };
  const labels = {
    subject: "Mata pelajaran",
    semester: "Semester",
    assessmentType: "Jenis asesmen",
    material: "Materi",
  };
  return (
    <div className="evidence-filters">
      {(Object.keys(choices) as (keyof EvidenceScope)[]).map((key) => (
        <div key={key}>
          <label htmlFor={`${prefix}-${key}`}>{labels[key]}</label>
          <select
            id={`${prefix}-${key}`}
            value={value[key] || ""}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
          >
            <option value="">Semua</option>
            {choices[key].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function ExternalQuestions({
  value,
  onChange,
}: {
  value: AnswerKeyItem[];
  onChange: (value: AnswerKeyItem[]) => void;
}) {
  const update = (index: number, patch: Partial<AnswerKeyItem>) =>
    onChange(
      value.map((item, n) => (n === index ? { ...item, ...patch } : item)),
    );
  return (
    <div className="external-questions">
      <p>
        Masukkan soal, kunci, dan rubrik dari asesmen Anda. Draf ini tetap perlu
        disetujui sebelum dipakai untuk koreksi.
      </p>
      {value.map((q, n) => (
        <fieldset key={n}>
          <legend>Soal {n + 1}</legend>
          <label htmlFor={`external-type-${n}`}>Bentuk soal</label>
          <select
            id={`external-type-${n}`}
            value={q.type}
            onChange={(e) =>
              update(n, { type: e.target.value as AnswerKeyItem["type"] })
            }
          >
            <option value="essay">Esai</option>
            <option value="multiple_choice">Pilihan ganda</option>
          </select>
          <label htmlFor={`external-question-${n}`}>Pertanyaan</label>
          <textarea
            id={`external-question-${n}`}
            required
            maxLength={20000}
            value={q.question}
            onChange={(e) => update(n, { question: e.target.value })}
          />
          {q.type === "multiple_choice" && (
            <>
              <label htmlFor={`external-options-${n}`}>
                Opsi (satu per baris, minimal dua)
              </label>
              <textarea
                id={`external-options-${n}`}
                required
                value={q.options.join("\n")}
                onChange={(e) =>
                  update(n, { options: e.target.value.split("\n") })
                }
              />
            </>
          )}
          <label htmlFor={`external-key-${n}`}>Kunci jawaban</label>
          <textarea
            id={`external-key-${n}`}
            required
            maxLength={20000}
            value={q.correctAnswer}
            onChange={(e) => update(n, { correctAnswer: e.target.value })}
          />
          <label htmlFor={`external-rubric-${n}`}>Rubrik penilaian</label>
          <textarea
            id={`external-rubric-${n}`}
            required
            maxLength={20000}
            value={q.rubric}
            onChange={(e) => update(n, { rubric: e.target.value })}
          />
          <label htmlFor={`external-max-${n}`}>Skor maksimum</label>
          <input
            id={`external-max-${n}`}
            type="number"
            min={1}
            max={1000}
            required
            value={q.max || ""}
            onChange={(e) => update(n, { max: Number(e.target.value) })}
          />
          {value.length > 1 && (
            <button
              className="btn secondary"
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== n))}
            >
              Hapus soal {n + 1}
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        className="btn secondary"
        disabled={value.length >= 20}
        onClick={() => onChange([...value, emptyQuestion()])}
      >
        Tambah soal
      </button>
    </div>
  );
}
