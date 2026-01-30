import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildDossierPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import { sanitizeInput } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 120;

// Rate limit: 10 dossier generations per minute per IP
const RATE_LIMIT = { maxRequests: 10, windowSeconds: 60 };

// Max request body size (1KB is more than enough for a company name)
const MAX_BODY_SIZE = 1024;

export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`generate:${clientIp}`, RATE_LIMIT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
          },
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

    // --- Parse body ---
    let body: { input?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // --- Sanitize input ---
    const { valid, sanitized, error: sanitizeError } = sanitizeInput(body.input);
    if (!valid) {
      return NextResponse.json(
        { error: sanitizeError },
        { status: 400 }
      );
    }

    // --- API key check ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    // --- Call Claude API ---
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 20,
        },
      ],
      messages: [
        {
          role: "user",
          content: buildDossierPrompt(sanitized),
        },
      ],
    });

    // Extract text content from the response
    let rawText = "";
    for (const block of response.content) {
      if (block.type === "text") {
        rawText += block.text;
      }
    }

    // Strip <cite index="...">...</cite> tags injected by web search
    rawText = rawText.replace(/<cite\s+index="[^"]*">/g, "").replace(/<\/cite>/g, "");

    // Extract source URLs from web search results
    const sources: string[] = [];
    for (const block of response.content) {
      if (block.type === "web_search_tool_result" && "content" in block) {
        const content = block.content;
        if (Array.isArray(content)) {
          for (const item of content) {
            if (
              item.type === "web_search_result" &&
              "url" in item &&
              typeof item.url === "string"
            ) {
              // Validate URL before including
              try {
                const parsed = new URL(item.url);
                if (
                  parsed.protocol === "https:" ||
                  parsed.protocol === "http:"
                ) {
                  if (!sources.includes(item.url)) {
                    sources.push(item.url);
                  }
                }
              } catch {
                // Skip invalid URLs
              }
            }
          }
        }
      }
    }

    // Parse the JSON from Claude's response
    let dossierContent;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      dossierContent = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse dossier data. Please try again." },
        { status: 500 }
      );
    }

    const companyName = dossierContent.company_name || sanitized;

    // Build the dossier object
    const id = crypto.randomUUID();
    const dossier = {
      id,
      company_name: companyName,
      company_url: isUrl(sanitized) ? sanitized : null,
      content: {
        company_snapshot: dossierContent.company_snapshot || {},
        business_model: dossierContent.business_model || {},
        leadership: dossierContent.leadership || [],
        recent_activity: dossierContent.recent_activity || {},
        market_context: dossierContent.market_context || {},
        financial_signals: dossierContent.financial_signals || {},
        pain_points: dossierContent.pain_points || [],
        conversation_starters: dossierContent.conversation_starters || [],
        confidence_notes: dossierContent.confidence_notes || null,
      },
      sources,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { id, status: "complete", dossier },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Dossier generation error:", error);

    // Don't leak internal error details to the client
    const isRateLimit =
      error instanceof Error && error.message.includes("429");

    const isAuthError =
      error instanceof Error &&
      (error.message.includes("401") || error.message.includes("403"));

    const message = isRateLimit
      ? "API rate limit reached. Please wait a minute and try again."
      : isAuthError
        ? "AI service temporarily unavailable. Please try again."
        : "Something went wrong. Please try again.";

    const status = isRateLimit ? 429 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

function isUrl(input: string): boolean {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}
