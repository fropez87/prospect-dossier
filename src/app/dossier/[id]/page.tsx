"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Users,
  Newspaper,
  Target,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Download,
  FileText,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Calendar,
  Hash,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Dossier } from "@/lib/types";
import { saveDossier, getDossierById } from "@/lib/storage";
import { calculateConfidence, ConfidenceLevel } from "@/lib/confidence";

export default function DossierPage() {
  const params = useParams();
  const id = params.id as string;
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  useEffect(() => {
    const stored = getDossierById(id);
    if (stored) {
      setDossier(stored);
      setLoading(false);
      return;
    }

    const sessionData = sessionStorage.getItem(`dossier-${id}`);
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        setDossier(parsed);
        saveDossier(parsed);
        sessionStorage.removeItem(`dossier-${id}`);
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, [id]);

  async function handleDownloadPdf() {
    if (!dossier) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/dossier/${id}/download?format=pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossier }),
      });
      if (!res.ok) throw new Error("Download failed");
      const html = await res.text();
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow pop-ups to download the PDF.");
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (err) {
      console.error(err);
      alert("PDF download failed. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDownloadDocx() {
    if (!dossier) return;
    setDownloadingDocx(true);
    try {
      const res = await fetch(`/api/dossier/${id}/download?format=docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossier }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dossier.company_name} - Dossier.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("DOCX download failed. Please try again.");
    } finally {
      setDownloadingDocx(false);
    }
  }

  function handleCopyText() {
    if (!dossier) return;
    const text = buildPlainText(dossier);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-teal" />
          <p className="text-sm text-text-muted">Loading dossier...</p>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center gap-4 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-8 w-8 text-text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-navy">Dossier not found</h2>
        <p className="text-text-muted">
          This dossier may have been generated in a previous session.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
        >
          Generate a new dossier
        </Link>
      </div>
    );
  }

  const { content } = dossier;
  const snap = content.company_snapshot;
  const confidence = calculateConfidence(dossier);

  return (
    <div className="min-h-[calc(100vh-73px)]">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border bg-navy">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal/10 via-transparent to-gold/5" />
        <div className="relative mx-auto max-w-4xl px-6 py-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
                {dossier.company_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
                {snap.industry && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white/70">
                    <Globe className="h-3.5 w-3.5" />
                    {snap.industry}
                  </span>
                )}
                {snap.hq_location && (
                  <span className="inline-flex items-center gap-1.5">
                    {snap.hq_location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(dossier.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {dossier.sources.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    {dossier.sources.length} sources
                  </span>
                )}
                <ConfidenceBadge level={confidence.level} score={confidence.score} label={confidence.label} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2.5 text-sm font-medium text-white/70 backdrop-blur transition-all hover:bg-white/10 hover:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownloadDocx}
                disabled={downloadingDocx}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2.5 text-sm font-medium text-white/70 backdrop-blur transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <FileText className="h-4 w-4" />
                {downloadingDocx ? "..." : "Word"}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                {downloadingPdf ? "..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dossier Content */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="stagger-children space-y-6">
          {/* Company Snapshot */}
          <Section icon={Building2} title="Company Snapshot" accent="teal">
            <p className="mb-5 text-[15px] leading-relaxed text-text-secondary">
              {snap.description}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard label="Industry" value={snap.industry} />
              <InfoCard label="Headquarters" value={snap.hq_location} />
              <InfoCard label="Founded" value={snap.founded} />
              <InfoCard label="Employees" value={snap.employees} />
              <InfoCard label="Revenue (est.)" value={snap.revenue_estimate} />
            </div>
          </Section>

          {/* Business Model */}
          <Section
            icon={Briefcase}
            title="Business Model"
            accent="purple-600"
          >
            <div className="space-y-5">
              <TextBlock
                label="Value Proposition"
                text={content.business_model.value_proposition}
              />
              <TextBlock
                label="Revenue Model"
                text={content.business_model.revenue_model}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-navy">
                    Products & Services
                  </h4>
                  <BulletList items={content.business_model.products_services} />
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-navy">
                    Target Customers
                  </h4>
                  <BulletList
                    items={content.business_model.target_customers}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Leadership */}
          <Section icon={Users} title="Leadership" accent="indigo-500">
            <div className="grid gap-3 sm:grid-cols-2">
              {content.leadership.map((leader, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-border bg-muted/50 p-5 transition-all hover:border-border/0 hover:bg-white hover:shadow-md"
                >
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                      {leader.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{leader.name}</p>
                      <p className="text-sm text-teal">{leader.title}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {leader.background}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Recent Activity */}
          <Section icon={Newspaper} title="Recent Activity" accent="amber-500">
            <div className="space-y-5">
              {content.recent_activity.funding?.length > 0 && (
                <ActivityGroup
                  label="Funding"
                  items={content.recent_activity.funding}
                />
              )}
              {content.recent_activity.acquisitions?.length > 0 && (
                <ActivityGroup
                  label="Acquisitions"
                  items={content.recent_activity.acquisitions}
                />
              )}
              {content.recent_activity.product_launches?.length > 0 && (
                <ActivityGroup
                  label="Product Launches"
                  items={content.recent_activity.product_launches}
                />
              )}
              {content.recent_activity.leadership_changes?.length > 0 && (
                <ActivityGroup
                  label="Leadership Changes"
                  items={content.recent_activity.leadership_changes}
                />
              )}
              {content.recent_activity.press?.length > 0 && (
                <ActivityGroup
                  label="Press Coverage"
                  items={content.recent_activity.press}
                />
              )}
            </div>
          </Section>

          {/* Market Context */}
          <Section icon={Target} title="Market Context" accent="rose-500">
            <div className="space-y-5">
              <TextBlock
                label="Competitive Positioning"
                text={content.market_context.positioning}
              />
              <TextBlock
                label="Industry Trends"
                text={content.market_context.industry_trends}
              />
              <div>
                <h4 className="mb-3 text-sm font-semibold text-navy">
                  Key Competitors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {content.market_context.competitors.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-muted px-4 py-1.5 text-sm font-medium text-navy transition-all hover:shadow-sm"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Financial Signals */}
          <Section
            icon={TrendingUp}
            title="Financial Signals"
            accent="emerald-500"
          >
            <div className="space-y-4">
              <TextBlock
                label="Financials"
                text={content.financial_signals.financials}
              />
              <TextBlock
                label="Funding History"
                text={content.financial_signals.funding_history}
              />
              <TextBlock
                label="Growth Indicators"
                text={content.financial_signals.growth_indicators}
              />
            </div>
          </Section>

          {/* Pain Points */}
          <Section
            icon={AlertTriangle}
            title="Potential Pain Points & Needs"
            accent="orange-500"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {content.pain_points.map((point, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-border bg-muted/50 p-4"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Conversation Starters */}
          <Section
            icon={MessageSquare}
            title="Conversation Starters"
            accent="gold"
          >
            <div className="space-y-3">
              {content.conversation_starters.map((starter, i) => (
                <div
                  key={i}
                  className="group flex gap-4 rounded-xl border border-border bg-muted/50 p-5 transition-all hover:border-border/0 hover:bg-white hover:shadow-md"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber-400 text-sm font-bold text-white shadow-sm">
                    {i + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-text-secondary">
                    {starter}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Data Confidence */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy">
              <ShieldCheck className="h-4 w-4 text-text-muted" />
              Data Confidence
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <ConfidenceBadge level={confidence.level} score={confidence.score} label={confidence.label} variant="detail" />
              <span className="text-sm text-text-muted">{confidence.score}/100</span>
            </div>
            {confidence.notes && (
              <div className="flex gap-2.5 rounded-xl bg-muted/50 border border-border-light p-4">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-text-muted" />
                <p className="text-sm leading-relaxed text-text-secondary">{confidence.notes}</p>
              </div>
            )}
          </div>

          {/* Sources */}
          {dossier.sources.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy">
                <Globe className="h-4 w-4 text-text-muted" />
                Sources ({dossier.sources.length})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {dossier.sources.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-teal transition-all hover:bg-teal/5 truncate"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {url.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function Section({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 transition-all hover:shadow-sm sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${accent}/10 text-${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-border-light bg-muted p-4">
      <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="text-[15px] font-semibold text-navy">{value}</p>
    </div>
  );
}

function TextBlock({
  label,
  text,
}: {
  label: string;
  text: string | null | undefined;
}) {
  if (!text) return null;
  return (
    <div>
      <h4 className="mb-1.5 text-sm font-semibold text-navy">{label}</h4>
      <p className="text-[15px] leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] text-text-secondary">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ActivityGroup({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-navy">{label}</h4>
      <BulletList items={items} />
    </div>
  );
}

const CONFIDENCE_STYLES: Record<ConfidenceLevel, { bg: string; text: string; border: string; dot: string }> = {
  high: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  low: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
};

const CONFIDENCE_DETAIL_STYLES: Record<ConfidenceLevel, { bg: string; text: string; border: string; dot: string }> = {
  high: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  low: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
};

function ConfidenceBadge({
  level,
  score,
  label,
  variant = "header",
}: {
  level: ConfidenceLevel;
  score: number;
  label: string;
  variant?: "header" | "detail";
}) {
  const styles = variant === "header" ? CONFIDENCE_STYLES[level] : CONFIDENCE_DETAIL_STYLES[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles.bg} ${styles.text} ${styles.border}`}
      title={`Confidence score: ${score}/100`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

function buildPlainText(dossier: Dossier): string {
  const { content } = dossier;
  const lines: string[] = [];

  lines.push(dossier.company_name.toUpperCase());
  lines.push("Due Diligence Dossier");
  lines.push(
    `Generated: ${new Date(dossier.created_at).toLocaleDateString()}`
  );
  lines.push("");

  lines.push("COMPANY SNAPSHOT");
  lines.push(content.company_snapshot.description);
  lines.push(`Industry: ${content.company_snapshot.industry}`);
  lines.push(`HQ: ${content.company_snapshot.hq_location}`);
  if (content.company_snapshot.founded)
    lines.push(`Founded: ${content.company_snapshot.founded}`);
  if (content.company_snapshot.employees)
    lines.push(`Employees: ${content.company_snapshot.employees}`);
  if (content.company_snapshot.revenue_estimate)
    lines.push(`Revenue: ${content.company_snapshot.revenue_estimate}`);
  lines.push("");

  lines.push("BUSINESS MODEL");
  lines.push(
    `Value Proposition: ${content.business_model.value_proposition}`
  );
  lines.push(`Revenue Model: ${content.business_model.revenue_model}`);
  lines.push(
    `Products: ${content.business_model.products_services.join(", ")}`
  );
  lines.push(
    `Target Customers: ${content.business_model.target_customers.join(", ")}`
  );
  lines.push("");

  lines.push("LEADERSHIP");
  content.leadership.forEach((l) => {
    lines.push(`- ${l.name}, ${l.title}: ${l.background}`);
  });
  lines.push("");

  lines.push("RECENT ACTIVITY");
  const ra = content.recent_activity;
  [
    ...(ra.funding || []),
    ...(ra.acquisitions || []),
    ...(ra.product_launches || []),
    ...(ra.leadership_changes || []),
    ...(ra.press || []),
  ].forEach((item) => {
    lines.push(`- ${item}`);
  });
  lines.push("");

  lines.push("MARKET CONTEXT");
  lines.push(`Positioning: ${content.market_context.positioning}`);
  lines.push(`Trends: ${content.market_context.industry_trends}`);
  lines.push(
    `Competitors: ${content.market_context.competitors.join(", ")}`
  );
  lines.push("");

  lines.push("FINANCIAL SIGNALS");
  if (content.financial_signals.financials)
    lines.push(`Financials: ${content.financial_signals.financials}`);
  if (content.financial_signals.funding_history)
    lines.push(`Funding: ${content.financial_signals.funding_history}`);
  if (content.financial_signals.growth_indicators)
    lines.push(`Growth: ${content.financial_signals.growth_indicators}`);
  lines.push("");

  lines.push("PAIN POINTS & NEEDS");
  content.pain_points.forEach((p) => lines.push(`- ${p}`));
  lines.push("");

  lines.push("CONVERSATION STARTERS");
  content.conversation_starters.forEach((s, i) =>
    lines.push(`${i + 1}. ${s}`)
  );

  return lines.join("\n");
}
