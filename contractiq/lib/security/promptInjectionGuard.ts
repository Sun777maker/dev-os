// Detects prompt injection attempts in user-supplied chat messages.
// Call sanitizeForLLM() on every message before sending it to the LLM.
// If the result is { safe: false }, return 400 PROMPT_INJECTION — do not call the AI.

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|prior|all)\s+instructions/i,
  /override\s+(your\s+)?(rules|instructions|constraints|system\s+prompt)/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /print\s+(your\s+)?instructions/i,
  /expose\s+(env(ironment)?\s+variables?|api\s+keys?|secrets?|credentials)/i,
  /show\s+(your\s+)?(api\s+keys?|environment\s+variables?|secrets?)/i,
  /you\s+are\s+now\s+a(?!\s+contract)/i,
  /act\s+as\s+(a\s+|an\s+)?(?!the\s+contract|a\s+contract)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /jailbreak/i,
  /\bdan\s+mode\b/i,
  /developer\s+mode/i,
  /disregard\s+(all\s+)?(previous|prior)\s+(instructions|rules)/i,
  /forget\s+(your\s+)?(previous\s+)?(instructions|training|rules|guidelines)/i,
  /new\s+personality/i,
  /from\s+now\s+on\s+you\s+(are|will)/i,
  /you\s+have\s+no\s+(restrictions|limitations|rules)/i,
  /your\s+true\s+(self|identity|purpose)/i,
  /sudo\s+mode/i,
  /admin\s+mode/i,
  /god\s+mode/i,
]

interface SanitizeResult {
  safe: boolean
  reason?: string
}

export function sanitizeForLLM(message: string): SanitizeResult {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return { safe: false, reason: 'Message contains disallowed patterns.' }
    }
  }
  return { safe: true }
}
