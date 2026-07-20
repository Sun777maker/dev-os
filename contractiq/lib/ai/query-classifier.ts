import type { ChatMessage, ContextType } from '@/types'

// Matches questions about the conversation itself: what the assistant said, earlier exchanges, etc.
const HISTORY_PATTERN =
  /\b(you said|you told|you mentioned|you explained|you noted|you described|you pointed out|you suggested|you just|you were saying|earlier you|before you|what did you say|your (previous|last|earlier) (answer|response|point|explanation|summary)|in our conversation|we discussed|you answered|going back|recap|summarize (what you|our|the conversation)|what have you|what you've told|what you've said)\b/i

// Matches questions grounded in the contract document itself.
// This is the default — anything not clearly about the conversation history.
const CONTRACT_PATTERN =
  /\b(contract|document|agreement|clause|term|section|page|party|parties|provision|schedule|exhibit|appendix|article|confidential|payment|liability|indemnif|terminat|govern|jurisdict|effectiv|oblig|right|duty|warrant|repres|disclos|ip |intellectual property|non.?solicit|breach|remedy|penalty|notice)\b/i

export function classifyQuery(userMessage: string, history: ChatMessage[]): ContextType {
  if (history.length === 0) return 'CONTRACT'

  const hasHistorySignal = HISTORY_PATTERN.test(userMessage)
  const hasContractSignal = CONTRACT_PATTERN.test(userMessage)

  if (hasHistorySignal && hasContractSignal) return 'BOTH'
  if (hasHistorySignal) return 'HISTORY'
  return 'CONTRACT'
}
