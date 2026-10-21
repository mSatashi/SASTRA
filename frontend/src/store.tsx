import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { client } from "./client";
import type { Workspace } from "./domain";
type Store = {
  data: Workspace | null;
  loading: boolean;
  error: string;
  reload: () => void;
  busy: boolean;
  run: (work: () => Promise<Workspace>, message: string) => Promise<boolean>;
  toast: string;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Workspace | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    client
      .load()
      .then((w) => {
        if (active) setData(w);
      })
      .catch((e: unknown) => {
        if (active)
          setError(e instanceof Error ? e.message : "Gagal memuat data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  async function run(work: () => Promise<Workspace>, message: string) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      setData(await work());
      setToast(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan gagal disimpan.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        data,
        loading,
        error,
        busy,
        run,
        toast,
        reload: () => setRevision((v) => v + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Store tidak tersedia");
  return value;
}
