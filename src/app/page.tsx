"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Download,
  Sparkles,
  ArrowRight,
  Building2,
  TrendingUp,
  Users,
  MessageSquare,
  Shield,
  Zap,
  Briefcase,
  Newspaper,
  Target,
  Check,
} from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dossier/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate dossier");
      }

      const data = await res.json();
      // Store dossier in sessionStorage so the view page can access it
      if (data.dossier) {
        sessionStorage.setItem(
          `dossier-${data.id}`,
          JSON.stringify(data.dossier)
        );
      }
      router.push(`/dossier/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col">
      {loading && <GeneratingOverlay companyName={input} />}
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24">
        {/* Background mesh */}
        <div className="mesh-gradient pointer-events-none absolute inset-0" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute -top-40 right-1/4 h-80 w-80 rounded-full bg-teal/5 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-2 text-sm font-medium text-teal">
            <Sparkles className="h-4 w-4" />
            AI-powered prospect intelligence
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up mb-6 text-5xl font-bold tracking-tight text-navy sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "0.1s" }}
          >
            Know any company
            <br />
            <span className="gradient-text animate-gradient">in 2 minutes</span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-up mx-auto mb-12 max-w-xl text-lg leading-relaxed text-text-secondary sm:text-xl"
            style={{ animationDelay: "0.2s" }}
          >
            Enter a company name or URL. Get a comprehensive due diligence
            dossier — ready to download and share.
          </p>

          {/* Search Input */}
          <div
            className="animate-fade-up mx-auto max-w-xl"
            style={{ animationDelay: "0.3s" }}
          >
            <form onSubmit={handleGenerate}>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-teal/20 via-purple-500/20 to-gold/20 opacity-0 blur transition-all group-focus-within:opacity-100" />
                <div className="relative flex items-center gap-2 rounded-2xl border border-border bg-white p-2 shadow-lg transition-shadow group-focus-within:shadow-xl">
                  <Search className="ml-4 h-5 w-5 shrink-0 text-text-muted" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Company name or website URL..."
                    className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-text-muted"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-12 items-center gap-2 rounded-xl bg-navy px-6 font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        Generate
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </form>

            {/* Example chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-text-muted">Try:</span>
              {["Stripe", "Figma", "Datadog", "notion.so"].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInput(example)}
                  className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-text-secondary shadow-sm transition-all hover:border-teal hover:text-teal hover:shadow-md"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="relative border-t border-border bg-muted px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Everything you need to know,
              <br />
              <span className="text-text-secondary">before the first call</span>
            </h2>
            <p className="mx-auto max-w-lg text-text-muted">
              Each dossier includes 8 comprehensive sections backed by real-time
              web research.
            </p>
          </div>

          <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                title: "Company Profile",
                desc: "Snapshot, industry, size, HQ, and founding story",
                color: "from-teal/10 to-cyan-500/10",
                iconColor: "text-teal",
              },
              {
                icon: Users,
                title: "Leadership",
                desc: "CEO, founders, key executives with backgrounds",
                color: "from-purple-500/10 to-indigo-500/10",
                iconColor: "text-purple-600",
              },
              {
                icon: TrendingUp,
                title: "Financial Signals",
                desc: "Funding, revenue estimates, and growth trajectory",
                color: "from-emerald-500/10 to-green-500/10",
                iconColor: "text-emerald-600",
              },
              {
                icon: MessageSquare,
                title: "Talking Points",
                desc: "Custom conversation starters based on recent news",
                color: "from-gold/10 to-amber-500/10",
                iconColor: "text-amber-600",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-white p-6 transition-all hover:border-border/0 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color}`}
                >
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="mb-1.5 font-semibold text-navy">{f.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              How it works
            </h2>
          </div>

          <div className="stagger-children grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Search,
                title: "Enter a company",
                desc: "Type a company name or paste a website URL into the search bar.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "AI researches",
                desc: "Claude searches the web and synthesizes intelligence from dozens of sources.",
              },
              {
                step: "03",
                icon: Download,
                title: "Download & share",
                desc: "Get your branded PDF or Word dossier, ready for your next meeting.",
              },
            ].map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="mb-5 inline-flex flex-col items-center">
                  <span className="mb-3 text-xs font-bold tracking-widest text-teal">
                    STEP {s.step}
                  </span>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-white shadow-lg">
                    <s.icon className="h-7 w-7" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-navy">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-16 shadow-xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal/10 via-transparent to-gold/10" />
            <div className="relative">
              <h2 className="mb-3 text-3xl font-bold text-white">
                Ready to research?
              </h2>
              <p className="mb-8 text-lg text-white/60">
                Generate your first dossier — it only takes a company name.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-navy shadow-lg transition-all hover:shadow-xl hover:brightness-95"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-text-muted">
          <span className="font-medium">
            Prospect<span className="text-teal">Dossier</span>
          </span>
          <span>Powered by Claude AI</span>
        </div>
      </footer>
    </div>
  );
}

const PROGRESS_STEPS = [
  { label: "Searching the web for company info...", icon: Search },
  { label: "Analyzing business model & products...", icon: Briefcase },
  { label: "Identifying key leadership...", icon: Users },
  { label: "Reviewing recent news & activity...", icon: Newspaper },
  { label: "Evaluating market position...", icon: Target },
  { label: "Gathering financial signals...", icon: TrendingUp },
  { label: "Compiling your dossier...", icon: FileText },
];

function GeneratingOverlay({ companyName }: { companyName: string }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) =>
        prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = PROGRESS_STEPS[stepIndex].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 backdrop-blur-sm">
      <div className="mx-6 w-full max-w-md animate-scale-in rounded-3xl border border-white/10 bg-white p-10 shadow-2xl">
        {/* Spinner */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-border border-t-teal" />
            <CurrentIcon className="h-8 w-8 text-teal" />
          </div>
        </div>

        {/* Company name */}
        <h3 className="mb-2 text-center text-xl font-bold text-navy">
          Researching {companyName || "company"}
        </h3>

        {/* Current step */}
        <p className="mb-8 text-center text-sm text-text-muted">
          {PROGRESS_STEPS[stepIndex].label}
        </p>

        {/* Step indicators */}
        <div className="space-y-2">
          {PROGRESS_STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-500 ${
                i < stepIndex
                  ? "text-teal"
                  : i === stepIndex
                    ? "bg-teal/5 font-medium text-navy"
                    : "text-text-muted/40"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                  i < stepIndex
                    ? "bg-teal text-white"
                    : i === stepIndex
                      ? "border-2 border-teal"
                      : "border border-border"
                }`}
              >
                {i < stepIndex && (
                  <Check className="h-3 w-3" />
                )}
              </div>
              <span>{step.label.replace("...", "")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
