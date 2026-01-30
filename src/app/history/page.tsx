"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Trash2,
  FileText,
  ArrowRight,
  Building2,
  Globe,
  Plus,
} from "lucide-react";
import { Dossier } from "@/lib/types";
import { getDossierHistory, deleteDossier } from "@/lib/storage";
import { calculateConfidence, ConfidenceLevel } from "@/lib/confidence";

export default function HistoryPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDossiers(getDossierHistory());
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    deleteDossier(id);
    setDossiers(getDossierHistory());
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-teal" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy">
              History
            </h1>
            <p className="mt-1 text-text-muted">
              {dossiers.length} dossier{dossiers.length !== 1 ? "s" : ""}{" "}
              generated
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            New Dossier
          </Link>
        </div>

        {dossiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-8 w-8 text-text-muted/50" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-navy">
              No dossiers yet
            </h2>
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-text-muted">
              Generate your first prospect dossier and it will appear here for
              quick access.
            </p>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
            >
              Generate Dossier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="stagger-children space-y-3">
            {dossiers.map((d) => (
              <div
                key={d.id}
                className="group flex items-center justify-between rounded-2xl border border-border bg-white p-5 transition-all hover:border-border/0 hover:shadow-lg"
              >
                <Link
                  href={`/dossier/${d.id}`}
                  className="flex flex-1 items-center gap-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-light text-white shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-navy group-hover:text-teal transition-colors">
                      {d.company_name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(d.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {d.sources.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {d.sources.length} sources
                        </span>
                      )}
                      <HistoryConfidenceBadge dossier={d} />
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="rounded-xl p-2.5 text-text-muted transition-all hover:bg-red-50 hover:text-red-500"
                    title="Delete dossier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/dossier/${d.id}`}
                    className="rounded-xl p-2.5 text-text-muted transition-all hover:bg-teal/5 hover:text-teal"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CONFIDENCE_COLORS: Record<ConfidenceLevel, { dot: string; text: string }> = {
  high: { dot: "bg-emerald-500", text: "text-emerald-600" },
  medium: { dot: "bg-amber-500", text: "text-amber-600" },
  low: { dot: "bg-orange-500", text: "text-orange-600" },
};

function HistoryConfidenceBadge({ dossier }: { dossier: Dossier }) {
  const { level, label, score } = calculateConfidence(dossier);
  const colors = CONFIDENCE_COLORS[level];
  return (
    <span
      className={`inline-flex items-center gap-1 ${colors.text}`}
      title={`Confidence score: ${score}/100`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
