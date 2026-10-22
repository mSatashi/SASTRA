import { useEffect, useState } from "react";
import { Download, Presentation, Sparkles } from "lucide-react";
import { client, isDemo, type PresentationDraft } from "./client";
import type { Content } from "./domain";

export function PresentationPanel({ content }: { content: Content }) {
  const [count, setCount] = useState(6);
  const [drafts, setDrafts] = useState<PresentationDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (isDemo || content.status !== "APPROVED") return;
    let active = true;
    setLoading(true);
    client
      .listPresentations(content.id)
      .then((items) => {
        if (active) setDrafts(items);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Gagal memuat PPT.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [content.id, content.status]);
  if (content.status !== "APPROVED")
    return (
      <p className="muted small-text">
        Setujui materi untuk membuat PPT pembelajaran.
      </p>
    );
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const draft = await client.generatePresentation(
        content.id,
        content.version,
        count,
      );
      setDrafts((items) => [draft, ...items]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pembuatan PPT gagal.");
    } finally {
      setBusy(false);
    }
  }
  async function download(draft: PresentationDraft) {
    setBusy(true);
    setError("");
    try {
      const blob = await client.downloadPresentation(draft.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SASTRA-${draft.id.slice(0, 8)}.pptx`;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unduhan gagal.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="presentation-panel"
      aria-labelledby={`ppt-heading-${content.id}`}
    >
      <h3 id={`ppt-heading-${content.id}`}>
        <Presentation size={20} /> PPT pembelajaran
      </h3>
      <p>
        Buat PowerPoint 16:9 dengan desain visual SASTRA yang bisa diedit.
        Periksa draf sebelum digunakan mengajar.
      </p>
      {isDemo ? (
        <p>Hubungkan backend untuk membuat file PPTX.</p>
      ) : (
        <>
          <div className="button-row">
            <div>
              <label htmlFor={`ppt-count-${content.id}`}>
                Jumlah slide (termasuk sampul)
              </label>
              <select
                id={`ppt-count-${content.id}`}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={busy}
              >
                {Array.from({ length: 9 }, (_, i) => i + 4).map((n) => (
                  <option key={n} value={n}>
                    {n} slide
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn primary"
              disabled={busy || loading}
              onClick={generate}
            >
              <Sparkles size={16} />
              {busy ? "Memproses…" : "Buat PPT"}
            </button>
          </div>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          {loading && <p role="status">Memuat draf PPT…</p>}
          {drafts.map((draft) => (
            <details
              className="ppt-draft"
              key={draft.id}
              open={draft.id === drafts[0]?.id}
            >
              <summary>
                Draf {draft.slideCount} slide · materi v{draft.sourceVersion} ·{" "}
                {new Date(draft.createdAt).toLocaleString("id-ID")}
              </summary>
              <p>Sampul: {draft.title}</p>
              <ol start={2}>
                {draft.slides.map((slide, n) => (
                  <li key={n}>
                    <strong>{slide.title}</strong>
                    <ul>
                      {slide.bullets.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => download(draft)}
              >
                <Download size={16} />
                Unduh PowerPoint (.pptx)
              </button>
            </details>
          ))}
        </>
      )}
    </section>
  );
}
