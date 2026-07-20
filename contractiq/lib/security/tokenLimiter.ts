export const LIMITS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,                                   // 10 MB
  MAX_PAGE_COUNT:      200,
  MAX_MESSAGE_LENGTH:  5_000,                                               // characters
  MAX_CHAT_HISTORY:    parseInt(process.env.MAX_CHAT_HISTORY ?? '100', 10), // messages sent to model
} as const

export function validateMessageLength(message: string): boolean {
  return message.length <= LIMITS.MAX_MESSAGE_LENGTH
}

export function validatePageCount(pageCount: number): boolean {
  return pageCount <= LIMITS.MAX_PAGE_COUNT
}

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes <= LIMITS.MAX_FILE_SIZE_BYTES
}
