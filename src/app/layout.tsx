import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProspectDossier — Know your prospect in 2 minutes",
  description:
    "Generate professional due diligence dossiers on any company. AI-powered research delivered as a polished PDF or Word document.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-light text-[13px] font-bold text-white shadow-md transition-transform group-hover:scale-105">
                PD
              </div>
              <span className="text-[17px] font-semibold tracking-tight text-navy">
                Prospect
                <span className="text-teal">Dossier</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/history"
                className="rounded-xl px-4 py-2 text-[14px] font-medium text-text-secondary transition-all hover:bg-navy/5 hover:text-navy"
              >
                History
              </Link>
              <Link
                href="/"
                className="ml-2 rounded-xl bg-navy px-4 py-2 text-[14px] font-medium text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
              >
                New Dossier
              </Link>
            </div>
          </div>
        </nav>
        <main className="pt-[73px]">{children}</main>
        <footer className="border-t border-border bg-muted/30 px-6 py-8">
          <div className="mx-auto max-w-4xl text-center text-xs leading-relaxed text-text-muted/70">
            <p className="font-medium text-text-muted mb-1">Disclaimer</p>
            <p>
              The information provided by ProspectDossier is generated using
              artificial intelligence and publicly available data. It is intended
              for informational purposes only and does not constitute legal,
              financial, or professional advice. While we strive for accuracy, we
              make no warranties or representations regarding the completeness,
              accuracy, reliability, or timeliness of any information presented.
              Users should independently verify all information before making
              business decisions. ProspectDossier is not liable for any errors,
              omissions, or actions taken based on the content generated.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
