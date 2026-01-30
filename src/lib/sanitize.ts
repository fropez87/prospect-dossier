/**
 * Sanitize user input to prevent prompt injection attacks.
 *
 * Strips control characters, limits length, and validates that the input
 * looks like a company name or URL — not an instruction to the LLM.
 */

const MAX_INPUT_LENGTH = 200;

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /forget\s+(all\s+)?(previous|above|prior)/i,
  /you\s+are\s+now/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /\bact\s+as\b/i,
  /\bpretend\s+(to\s+be|you\s+are)\b/i,
  /\brole\s*play\b/i,
  /\bjailbreak\b/i,
  /do\s+not\s+follow/i,
  /override\s+(your|the)\s+(instructions|rules|prompt)/i,
  /instead\s+of\s+(the\s+)?(dossier|report|above)/i,
  /output\s+(the|your)\s+(system|initial)\s+prompt/i,
  /reveal\s+(your|the)\s+(system|initial)\s+prompt/i,
  /what\s+(is|are)\s+your\s+(instructions|rules|system)/i,
  /\<\/?[a-z]/i, // HTML tags
  /\{\{.*\}\}/, // Template injection
  /```/, // Code block markers
];

export interface SanitizeResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

export function sanitizeInput(raw: unknown): SanitizeResult {
  // Type check
  if (!raw || typeof raw !== "string") {
    return { valid: false, sanitized: "", error: "Input must be a string" };
  }

  // Trim and collapse whitespace
  let input = raw.trim().replace(/\s+/g, " ");

  // Length check
  if (input.length === 0) {
    return {
      valid: false,
      sanitized: "",
      error: "Please provide a company name or URL",
    };
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      sanitized: "",
      error: `Input too long (max ${MAX_INPUT_LENGTH} characters)`,
    };
  }

  // Strip control characters (keep basic printable ASCII + common unicode letters)
  input = input.replace(/[\x00-\x1f\x7f]/g, "");

  // Check for prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        valid: false,
        sanitized: "",
        error: "Invalid input. Please enter a company name or website URL.",
      };
    }
  }

  // Check that it doesn't contain too many "sentence-like" structures
  // (a company name or URL shouldn't have multiple sentences)
  const sentenceCount = (input.match(/[.!?]\s+[A-Z]/g) || []).length;
  if (sentenceCount > 2) {
    return {
      valid: false,
      sanitized: "",
      error: "Please enter a single company name or URL, not a paragraph.",
    };
  }

  return { valid: true, sanitized: input };
}

/**
 * Escape HTML special characters to prevent XSS in generated HTML documents.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Recursively escape all string values in a dossier content object
 * for safe HTML embedding.
 */
export function escapeObjectForHtml<T>(obj: T): T {
  if (typeof obj === "string") {
    return escapeHtml(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => escapeObjectForHtml(item)) as T;
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = escapeObjectForHtml(value);
    }
    return result as T;
  }
  return obj;
}
