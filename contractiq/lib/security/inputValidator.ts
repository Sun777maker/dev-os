import { z } from 'zod'

// ── UUID param validation ────────────────────────────────────────────────────

export function isValidUUID(value: string): boolean {
  return z.string().uuid().safeParse(value).success
}

// ── File upload validation ───────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.js', '.mjs', '.cjs', '.php', '.zip',
  '.sh', '.bat', '.cmd', '.py', '.rb', '.ps1',
])
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateFileUpload(file: File): FileValidationResult {
  const name = file.name.toLowerCase()
  const dotIndex = name.lastIndexOf('.')
  const ext = dotIndex !== -1 ? name.slice(dotIndex) : ''

  // 1. Extension blocklist — explicit deny before allow
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type "${ext}" is not allowed.` }
  }

  // 2. Extension allowlist
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Only PDF and DOCX files are allowed.' }
  }

  // 3. MIME type must agree with extension
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: 'File MIME type does not match the allowed types.' }
  }

  // 4. Size limit (mirrors storage bucket)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File exceeds the 10 MB limit.' }
  }

  return { valid: true }
}

// ── Request body schemas ─────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5_000, 'Message exceeds 5000 character limit'),
})

export const termUpdateSchema = z.object({
  value: z.string().min(1, 'Value cannot be empty').max(10_000),
})

export const feedbackSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  rating: z.enum(['thumbs_up', 'thumbs_down']),
  comment: z.string().max(1_000, 'Comment exceeds 1000 character limit').optional(),
})

export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type TermUpdateInput = z.infer<typeof termUpdateSchema>
export type FeedbackInput = z.infer<typeof feedbackSchema>
