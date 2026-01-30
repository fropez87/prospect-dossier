import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from "docx";
import { Dossier } from "@/lib/types";
import { escapeHtml, escapeObjectForHtml } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { calculateConfidence } from "@/lib/confidence";

// Rate limit: 30 downloads per minute per IP
const RATE_LIMIT = { maxRequests: 30, windowSeconds: 60 };

// Max body size for download requests (100KB — dossier JSON is typically ~5-15KB)
const MAX_BODY_SIZE = 100 * 1024;

export async function POST(request: NextRequest) {
  // --- Rate limiting ---
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`download:${clientIp}`, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      }
    );
  }

  // --- Body size check ---
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  // Validate format parameter
  if (format !== "pdf" && format !== "docx") {
    return NextResponse.json(
      { error: "Invalid format. Use 'pdf' or 'docx'." },
      { status: 400 }
    );
  }

  let body: { dossier: Dossier };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { dossier } = body;
  if (!dossier) {
    return NextResponse.json({ error: "No dossier data" }, { status: 400 });
  }

  try {
    if (format === "docx") {
      return await generateDocx(dossier);
    }
    return generatePdfHtml(dossier);
  } catch (error) {
    console.error("Download generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate document. Please try again." },
      { status: 500 }
    );
  }
}

// ------- PDF via HTML (browser-printable) -------
// All user-generated content is HTML-escaped to prevent XSS
function generatePdfHtml(dossier: Dossier): NextResponse {
  // Escape all dossier content for safe HTML embedding
  const safe = escapeObjectForHtml(dossier);
  const { content } = safe;
  const snap = content.company_snapshot;
  const confidence = calculateConfidence(dossier);
  const date = new Date(dossier.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safe.company_name} - Dossier</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #2d3748; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a365d; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 14px; font-weight: 700; color: #1a365d; }
    .logo span { color: #d69e2e; }
    .date { font-size: 11px; color: #718096; }
    .company-name { font-size: 28px; font-weight: 700; color: #1a365d; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #718096; margin-bottom: 24px; }
    .section { margin-bottom: 20px; break-inside: avoid; }
    .section-header { background: #1a365d; color: white; padding: 6px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .section-content { padding: 0 4px; }
    .desc { font-size: 13px; margin-bottom: 10px; color: #4a5568; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .info-item { background: #f7fafc; padding: 8px; border-radius: 4px; }
    .info-label { font-size: 10px; text-transform: uppercase; color: #718096; font-weight: 600; }
    .info-value { font-size: 12px; font-weight: 600; color: #1a365d; }
    .subsection { margin-bottom: 10px; }
    .subsection-title { font-size: 11px; font-weight: 700; color: #1a365d; margin-bottom: 4px; }
    ul { padding-left: 16px; }
    li { font-size: 12px; color: #4a5568; margin-bottom: 3px; }
    .leader { margin-bottom: 6px; }
    .leader-name { font-size: 12px; font-weight: 700; color: #1a365d; }
    .leader-title { font-size: 11px; color: #319795; }
    .leader-bg { font-size: 11px; color: #718096; }
    .starter { display: flex; gap: 8px; margin-bottom: 6px; }
    .starter-num { background: #fefce8; color: #d69e2e; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .starter-text { font-size: 12px; color: #4a5568; }
    .footer { border-top: 2px solid #1a365d; padding-top: 12px; margin-top: 24px; display: flex; justify-content: space-between; font-size: 10px; color: #718096; }
    @media print { body { padding: 20px; } .section { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Prospect<span>Dossier</span></div>
    <div class="date">${escapeHtml(date)}</div>
  </div>

  <div class="company-name">${safe.company_name}</div>
  <div class="subtitle">Due Diligence Dossier</div>

  <div class="section">
    <div class="section-header">Company Snapshot</div>
    <div class="section-content">
      <p class="desc">${snap.description}</p>
      <div class="info-grid">
        ${snap.industry ? `<div class="info-item"><div class="info-label">Industry</div><div class="info-value">${snap.industry}</div></div>` : ""}
        ${snap.hq_location ? `<div class="info-item"><div class="info-label">Headquarters</div><div class="info-value">${snap.hq_location}</div></div>` : ""}
        ${snap.founded ? `<div class="info-item"><div class="info-label">Founded</div><div class="info-value">${snap.founded}</div></div>` : ""}
        ${snap.employees ? `<div class="info-item"><div class="info-label">Employees</div><div class="info-value">${snap.employees}</div></div>` : ""}
        ${snap.revenue_estimate ? `<div class="info-item"><div class="info-label">Revenue (est.)</div><div class="info-value">${snap.revenue_estimate}</div></div>` : ""}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Business Model</div>
    <div class="section-content">
      <div class="subsection">
        <div class="subsection-title">Value Proposition</div>
        <p class="desc">${content.business_model.value_proposition}</p>
      </div>
      <div class="subsection">
        <div class="subsection-title">Revenue Model</div>
        <p class="desc">${content.business_model.revenue_model}</p>
      </div>
      <div class="subsection">
        <div class="subsection-title">Products &amp; Services</div>
        <ul>${content.business_model.products_services.map((p) => `<li>${p}</li>`).join("")}</ul>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Leadership</div>
    <div class="section-content">
      ${content.leadership.map((l) => `<div class="leader"><div class="leader-name">${l.name}</div><div class="leader-title">${l.title}</div><div class="leader-bg">${l.background}</div></div>`).join("")}
    </div>
  </div>

  <div class="section">
    <div class="section-header">Recent Activity</div>
    <div class="section-content">
      ${buildActivityHtml("Funding", content.recent_activity.funding)}
      ${buildActivityHtml("Acquisitions", content.recent_activity.acquisitions)}
      ${buildActivityHtml("Product Launches", content.recent_activity.product_launches)}
      ${buildActivityHtml("Leadership Changes", content.recent_activity.leadership_changes)}
      ${buildActivityHtml("Press", content.recent_activity.press)}
    </div>
  </div>

  <div class="section">
    <div class="section-header">Market Context</div>
    <div class="section-content">
      <div class="subsection">
        <div class="subsection-title">Positioning</div>
        <p class="desc">${content.market_context.positioning}</p>
      </div>
      <div class="subsection">
        <div class="subsection-title">Industry Trends</div>
        <p class="desc">${content.market_context.industry_trends}</p>
      </div>
      <div class="subsection">
        <div class="subsection-title">Key Competitors</div>
        <p class="desc">${content.market_context.competitors.join(", ")}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Financial Signals</div>
    <div class="section-content">
      ${content.financial_signals.financials ? `<div class="subsection"><div class="subsection-title">Financials</div><p class="desc">${content.financial_signals.financials}</p></div>` : ""}
      ${content.financial_signals.funding_history ? `<div class="subsection"><div class="subsection-title">Funding History</div><p class="desc">${content.financial_signals.funding_history}</p></div>` : ""}
      ${content.financial_signals.growth_indicators ? `<div class="subsection"><div class="subsection-title">Growth Indicators</div><p class="desc">${content.financial_signals.growth_indicators}</p></div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-header">Potential Pain Points &amp; Needs</div>
    <div class="section-content">
      <ul>${content.pain_points.map((p) => `<li>${p}</li>`).join("")}</ul>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Conversation Starters</div>
    <div class="section-content">
      ${content.conversation_starters.map((s, i) => `<div class="starter"><div class="starter-num">${i + 1}</div><div class="starter-text">${s}</div></div>`).join("")}
    </div>
  </div>

  <div class="section">
    <div class="section-header">Data Confidence</div>
    <div class="section-content">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${confidence.level === "high" ? "#059669" : confidence.level === "medium" ? "#d97706" : "#ea580c"}"></span>
        <span style="font-size:13px;font-weight:700;color:#1a365d;">${escapeHtml(confidence.label)}</span>
        <span style="font-size:11px;color:#718096;">${confidence.score}/100</span>
      </div>
      ${confidence.notes ? `<p class="desc">${escapeHtml(confidence.notes)}</p>` : ""}
    </div>
  </div>

  <div class="footer">
    <div>Generated by ProspectDossier</div>
    <div>Based on ${dossier.sources.length} sources</div>
  </div>

  <div style="margin-top:24px;padding:16px 20px;border-top:1px solid #e2e8f0;font-size:9px;color:#a0aec0;line-height:1.6;text-align:center;">
    <strong>Disclaimer:</strong> The information provided by ProspectDossier is generated using artificial intelligence and publicly available data. It is intended for informational purposes only and does not constitute legal, financial, or professional advice. While we strive for accuracy, we make no warranties or representations regarding the completeness, accuracy, reliability, or timeliness of any information presented. Users should independently verify all information before making business decisions. ProspectDossier is not liable for any errors, omissions, or actions taken based on the content generated.
  </div>
</body>
</html>`;

  // Sanitize the filename to prevent header injection
  const safeFilename = dossier.company_name
    .replace(/[^a-zA-Z0-9\s\-_.]/g, "")
    .slice(0, 100);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${safeFilename} - Dossier.html"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Content in buildActivityHtml is already escaped via escapeObjectForHtml
function buildActivityHtml(
  label: string,
  items: string[] | undefined
): string {
  if (!items || items.length === 0) return "";
  return `<div class="subsection"><div class="subsection-title">${label}</div><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
}

// ------- DOCX Generation -------
// DOCX uses TextRun which is inherently safe (no HTML rendering)
async function generateDocx(dossier: Dossier): Promise<NextResponse> {
  const { content } = dossier;
  const snap = content.company_snapshot;
  const confidence = calculateConfidence(dossier);
  const date = new Date(dossier.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const NAVY = "1a365d";
  const GOLD = "d69e2e";
  const TEAL = "319795";
  const GRAY = "718096";

  function sectionHeading(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          color: "ffffff",
          size: 22,
          font: "Segoe UI",
        }),
      ],
      shading: { fill: NAVY, type: "clear", color: "auto" },
      spacing: { before: 300, after: 120 },
      indent: { left: 100, right: 100 },
    });
  }

  function bodyText(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({ text, size: 22, color: "4a5568", font: "Segoe UI" }),
      ],
      spacing: { after: 80 },
    });
  }

  function subHeading(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: 21,
          color: NAVY,
          font: "Segoe UI",
        }),
      ],
      spacing: { before: 120, after: 40 },
    });
  }

  function bulletItem(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({ text, size: 22, color: "4a5568", font: "Segoe UI" }),
      ],
      bullet: { level: 0 },
      spacing: { after: 40 },
    });
  }

  function numberedItem(num: number, text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: `${num}. `,
          bold: true,
          size: 22,
          color: GOLD,
          font: "Segoe UI",
        }),
        new TextRun({ text, size: 22, color: "4a5568", font: "Segoe UI" }),
      ],
      spacing: { after: 60 },
    });
  }

  const sections: Paragraph[] = [];

  // Header
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ProspectDossier",
          bold: true,
          size: 24,
          color: NAVY,
          font: "Segoe UI",
        }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: date, size: 20, color: GRAY, font: "Segoe UI" }),
      ],
      spacing: { after: 200 },
    })
  );

  // Company name
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: dossier.company_name,
          bold: true,
          size: 44,
          color: NAVY,
          font: "Segoe UI",
        }),
      ],
      heading: HeadingLevel.TITLE,
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Due Diligence Dossier",
          size: 24,
          color: GRAY,
          font: "Segoe UI",
        }),
      ],
      spacing: { after: 300 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
      },
    })
  );

  // Company Snapshot
  sections.push(sectionHeading("Company Snapshot"));
  sections.push(bodyText(snap.description));
  if (snap.industry) sections.push(bodyText(`Industry: ${snap.industry}`));
  if (snap.hq_location)
    sections.push(bodyText(`Headquarters: ${snap.hq_location}`));
  if (snap.founded) sections.push(bodyText(`Founded: ${snap.founded}`));
  if (snap.employees)
    sections.push(bodyText(`Employees: ${snap.employees}`));
  if (snap.revenue_estimate)
    sections.push(bodyText(`Revenue (est.): ${snap.revenue_estimate}`));

  // Business Model
  sections.push(sectionHeading("Business Model"));
  sections.push(subHeading("Value Proposition"));
  sections.push(bodyText(content.business_model.value_proposition));
  sections.push(subHeading("Revenue Model"));
  sections.push(bodyText(content.business_model.revenue_model));
  sections.push(subHeading("Products & Services"));
  content.business_model.products_services.forEach((p) =>
    sections.push(bulletItem(p))
  );
  sections.push(subHeading("Target Customers"));
  content.business_model.target_customers.forEach((c) =>
    sections.push(bulletItem(c))
  );

  // Leadership
  sections.push(sectionHeading("Leadership"));
  content.leadership.forEach((leader) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: leader.name,
            bold: true,
            size: 22,
            color: NAVY,
            font: "Segoe UI",
          }),
          new TextRun({
            text: `  ${leader.title}`,
            size: 22,
            color: TEAL,
            font: "Segoe UI",
          }),
        ],
        spacing: { before: 80 },
      })
    );
    sections.push(bodyText(leader.background));
  });

  // Recent Activity
  sections.push(sectionHeading("Recent Activity"));
  const activityGroups = [
    { label: "Funding", items: content.recent_activity.funding },
    { label: "Acquisitions", items: content.recent_activity.acquisitions },
    {
      label: "Product Launches",
      items: content.recent_activity.product_launches,
    },
    {
      label: "Leadership Changes",
      items: content.recent_activity.leadership_changes,
    },
    { label: "Press", items: content.recent_activity.press },
  ];
  activityGroups.forEach(({ label, items }) => {
    if (items && items.length > 0) {
      sections.push(subHeading(label));
      items.forEach((item) => sections.push(bulletItem(item)));
    }
  });

  // Market Context
  sections.push(sectionHeading("Market Context"));
  sections.push(subHeading("Positioning"));
  sections.push(bodyText(content.market_context.positioning));
  sections.push(subHeading("Industry Trends"));
  sections.push(bodyText(content.market_context.industry_trends));
  sections.push(subHeading("Key Competitors"));
  sections.push(bodyText(content.market_context.competitors.join(", ")));

  // Financial Signals
  sections.push(sectionHeading("Financial Signals"));
  if (content.financial_signals.financials) {
    sections.push(subHeading("Financials"));
    sections.push(bodyText(content.financial_signals.financials));
  }
  if (content.financial_signals.funding_history) {
    sections.push(subHeading("Funding History"));
    sections.push(bodyText(content.financial_signals.funding_history));
  }
  if (content.financial_signals.growth_indicators) {
    sections.push(subHeading("Growth Indicators"));
    sections.push(bodyText(content.financial_signals.growth_indicators));
  }

  // Pain Points
  sections.push(sectionHeading("Potential Pain Points & Needs"));
  content.pain_points.forEach((p) => sections.push(bulletItem(p)));

  // Conversation Starters
  sections.push(sectionHeading("Conversation Starters"));
  content.conversation_starters.forEach((s, i) =>
    sections.push(numberedItem(i + 1, s))
  );

  // Data Confidence
  sections.push(sectionHeading("Data Confidence"));
  const confidenceColor = confidence.level === "high" ? "059669" : confidence.level === "medium" ? "d97706" : "ea580c";
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${confidence.label} — ${confidence.score}/100`,
          bold: true,
          size: 22,
          color: confidenceColor,
          font: "Segoe UI",
        }),
      ],
      spacing: { after: 60 },
    })
  );
  if (confidence.notes) {
    sections.push(bodyText(confidence.notes));
  }

  // Footer
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated by ProspectDossier | Based on ${dossier.sources.length} sources`,
          size: 18,
          color: GRAY,
          font: "Segoe UI",
        }),
      ],
      spacing: { before: 400 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
      },
    })
  );

  // Disclaimer
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Disclaimer: ",
          bold: true,
          size: 16,
          color: GRAY,
          font: "Segoe UI",
        }),
        new TextRun({
          text: "The information provided by ProspectDossier is generated using artificial intelligence and publicly available data. It is intended for informational purposes only and does not constitute legal, financial, or professional advice. While we strive for accuracy, we make no warranties or representations regarding the completeness, accuracy, reliability, or timeliness of any information presented. Users should independently verify all information before making business decisions. ProspectDossier is not liable for any errors, omissions, or actions taken based on the content generated.",
          size: 16,
          color: GRAY,
          font: "Segoe UI",
        }),
      ],
      spacing: { before: 200 },
    })
  );

  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  // Sanitize filename
  const safeFilename = dossier.company_name
    .replace(/[^a-zA-Z0-9\s\-_.]/g, "")
    .slice(0, 100);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeFilename} - Dossier.docx"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
