import { Dossier } from "./types";

const STORAGE_KEY = "prospect-dossier-history";

export function saveDossier(dossier: Dossier): void {
  if (typeof window === "undefined") return;
  const history = getDossierHistory();
  const existing = history.findIndex((d) => d.id === dossier.id);
  if (existing >= 0) {
    history[existing] = dossier;
  } else {
    history.unshift(dossier);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getDossierHistory(): Dossier[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getDossierById(id: string): Dossier | null {
  const history = getDossierHistory();
  return history.find((d) => d.id === id) ?? null;
}

export function deleteDossier(id: string): void {
  const history = getDossierHistory();
  const filtered = history.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
