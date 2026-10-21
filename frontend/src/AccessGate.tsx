import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { isDemo } from "./client";
import { Logo } from "./ui";

const base = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");

export default function AccessGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(isDemo);
  const [checking, setChecking] = useState(!isDemo);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [teamAccess, setTeamAccess] = useState(false);
  useEffect(() => {
    if (isDemo) return;
    let active = true;
    fetch(`${base}/session`, { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "Akses aplikasi belum dapat dimuat. Muat ulang halaman.",
          );
        const session = await response.json();
        if (active) {
          setReady(session.authenticated === true);
          setTeamAccess(session.required === true);
        }
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Koneksi gagal.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const expired = () => setReady(false);
    window.addEventListener("sastra-session-expired", expired);
    return () => window.removeEventListener("sastra-session-expired", expired);
  }, []);
  async function login(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${base}/session/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Tidak dapat masuk.",
        );
      setCode("");
      setReady(result.authenticated === true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tidak dapat masuk.");
    } finally {
      setBusy(false);
    }
  }
  if (ready)
    return (
      <>
        {children}
        {teamAccess && (
          <button
            className="btn secondary team-signout"
            onClick={async () => {
              try {
                const response = await fetch(`${base}/session/logout`, {
                  method: "POST",
                  credentials: "include",
                });
                if (response.ok) setReady(false);
              } catch {
                setError("Tidak dapat keluar. Coba lagi.");
              }
            }}
          >
            Keluar
          </button>
        )}
      </>
    );
  return (
    <main className="access-screen">
      <section className="access-card panel" aria-labelledby="access-title">
        <Logo />
        <span className="eyebrow">RUANG KERJA TIM</span>
        <h1 id="access-title">Selamat datang di SASTRA.</h1>
        <p>
          Masuk untuk menyiapkan pembelajaran dan memahami perkembangan siswa.
        </p>
        {checking ? (
          <p role="status">Memeriksa akses…</p>
        ) : (
          <form onSubmit={login}>
            <label htmlFor="team-code">Kode akses tim</label>
            <input
              id="team-code"
              type="password"
              autoComplete="current-password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={256}
              aria-describedby={error ? "access-error" : undefined}
            />
            {error && (
              <p id="access-error" role="alert" className="field-error">
                {error}
              </p>
            )}
            <button className="btn primary full" disabled={busy}>
              {busy ? "Memeriksa…" : "Masuk ruang kerja"}
            </button>
          </form>
        )}
        <small>Prototipe hackathon · gunakan data siswa sintetis.</small>
      </section>
    </main>
  );
}
