# ProspectDossier - Project Context

## What This Is
AI-powered prospect dossier generator. Enter a company name or URL, get a comprehensive due diligence report with company snapshot, leadership, financials, market context, pain points, and conversation starters.

## Tech Stack
- Next.js 16.1.6 (App Router)
- React 19, TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` syntax, `@tailwindcss/postcss`)
- Anthropic Claude Sonnet 4 API with web search tool
- `docx` library for Word export, HTML-based PDF via browser print dialog
- Deployed on Vercel: https://prospect-dossier.vercel.app
- GitHub: https://github.com/fropez87/prospect-dossier

## Key Architecture
- **API routes**: `src/app/api/dossier/generate/route.ts` (Claude API call with web search), `src/app/api/dossier/[id]/download/route.ts` (PDF/DOCX export)
- **Pages**: Home (`src/app/page.tsx`), Dossier detail (`src/app/dossier/[id]/page.tsx`), History (`src/app/history/page.tsx`)
- **Lib**: `types.ts`, `prompt.ts`, `storage.ts` (localStorage), `confidence.ts` (hybrid scoring), `sanitize.ts`, `rate-limit.ts`
- Data stored in browser localStorage (per-user by design)
- Session storage used to pass generated dossier from home to detail page

## Important: Windows Dev Setup
- **Must run `npx next dev --webpack`** -- Turbopack has a Windows bug where it tries to read the reserved `nul` device name during PostCSS/Tailwind processing, causing a panic crash.
- The `--no-turbopack` flag doesn't exist in Next.js 16; use `--webpack` instead.

## Environment
- `ANTHROPIC_API_KEY` in `.env.local` (local) and Vercel env vars (production)

## Features Implemented
- Full-screen progress overlay during generation (cycles through 7 status steps)
- PDF export via new browser tab + window.print() dialog
- DOCX export via `docx` library
- Hybrid confidence scoring: client-side heuristic (source count 30%, field completeness 40%, content depth 30%) + Claude's qualitative confidence_notes
- Citation tag stripping (`<cite index="...">` tags from web search) -- handles both escaped and unescaped quotes in JSON
- Legal disclaimer on all pages (layout footer) and in PDF/DOCX exports
- Rate limiting (in-memory, per IP) for generation and downloads
- Input sanitization with regex patterns for prompt injection prevention

## Deployment
- `vercel --prod` to deploy manually
- GitHub pushes to master auto-deploy via Vercel integration
- Vercel CLI and GitHub CLI (`gh`) are installed and authenticated
