export type ContractType = 'NDA' | 'MSA'

export type ContractStatus =
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'processed'
  | 'error'

export type MessageRole = 'user' | 'assistant'

export type ContextType = 'CONTRACT' | 'HISTORY' | 'BOTH'

export type FeedbackRating = 'thumbs_up' | 'thumbs_down'

export interface Contract {
  id: string
  user_id: string
  name: string
  type: ContractType
  status: ContractStatus
  contract_text?: string
  file_path: string | null
  page_count: number | null
  token_count: number | null
  created_at: string
  updated_at: string
}

export interface KeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  value: string | null
  page_number: number | null
  confidence_score: number | null
  source_sentence: string | null
  is_custom: boolean
  is_edited: boolean
  original_value: string | null
  created_at: string
}

export interface CustomKeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  is_manual: boolean
  created_at: string
}

export interface ChatSession {
  id: string
  contract_id: string
  user_id: string
  created_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  created_at: string
  contextType?: ContextType  // Present only on messages returned by POST; not persisted to DB
}

export interface UserFeedback {
  id: string
  contract_id: string
  user_id: string
  rating: FeedbackRating
  comment: string | null
  created_at: string
}

export interface DashboardStats {
  totalContracts: number
  byType: { NDA: number; MSA: number }
  contracts: Pick<Contract, 'id' | 'name' | 'type' | 'status' | 'created_at'>[]
}

export interface ContractWithTerms {
  contract: Omit<Contract, 'contract_text'>
  keyTerms: KeyTerm[]
  signedUrl: string | null
}

export interface ExtractionResult {
  term_name: string
  value: string
  page_number: number
  confidence_score: number
  source_sentence: string
}

export interface ApiError {
  error: string
  code: string
}
