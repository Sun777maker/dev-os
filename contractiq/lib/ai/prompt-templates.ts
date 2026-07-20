import type { ContractType } from '@/types'

// Prompt version: v1.0 — initial few-shot NDA + MSA examples
// Update this version tag and add changelog entry when prompts change.

export const STANDARD_TERMS: Record<ContractType, string[]> = {
  NDA: [
    'Parties',
    'Effective Date',
    'Confidentiality Obligations',
    'Permitted Disclosures',
    'Term & Duration',
    'Governing Law',
    'Jurisdiction',
    'IP Ownership',
    'Non-Solicitation',
    'Breach & Remedy',
  ],
  MSA: [
    'Parties',
    'Service Scope',
    'Payment Terms',
    'Invoice Schedule',
    'Late Payment Penalty',
    'Liability Cap',
    'Indemnification',
    'IP Ownership',
    'Termination Clause',
    'Governing Law',
    'Dispute Resolution',
    'Notice Period',
  ],
}

export function buildExtractionSystemPrompt(contractType: ContractType): string {
  return `You are a contract analysis specialist. Extract key terms from the contract text provided.

Return a JSON object with this exact schema — no markdown, no explanation, no extra text:
{"terms": [
  {
    "term_name": string,
    "value": string,
    "page_number": number,
    "confidence_score": number,
    "source_sentence": string
  }
]}

Rules:
- term_name: the exact term name from the list provided
- value: the exact clause value found in the document (e.g. "36 months", "State of California")
- page_number: 1-indexed page number from the [PAGE N] markers in the text
- confidence_score: 0.0–1.0; set below 0.5 if the term is ambiguous or not clearly present
- source_sentence: verbatim sentence from the document; never paraphrase

Example output (few-shot illustration):
{"terms": [
  {
    "term_name": "Governing Law",
    "value": "State of Delaware",
    "page_number": 4,
    "confidence_score": 0.97,
    "source_sentence": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions."
  },
  {
    "term_name": "Term & Duration",
    "value": "2 years from the Effective Date",
    "page_number": 2,
    "confidence_score": 0.91,
    "source_sentence": "This Agreement shall remain in effect for a period of two (2) years from the Effective Date."
  }
]}

Contract type: ${contractType}`
}

export function buildExtractionUserMessage(
  contractText: string,
  contractType: ContractType,
  customTerms: string[]
): string {
  const standardTerms = STANDARD_TERMS[contractType]
  const allTerms = [...standardTerms, ...customTerms]

  return `Extract the following terms from this ${contractType} contract:
${allTerms.map((t, i) => `${i + 1}. ${t}`).join('\n')}

CONTRACT TEXT:
${contractText}`
}

export const JSON_RETRY_PROMPT =
  'Your previous response was not valid JSON. Return only the JSON object {"terms": [...]} with no explanation, no markdown, and no extra text.'

export function buildContractSystemPrompt(contractText: string): string {
  return `You are a contract analysis assistant. Answer questions strictly from the document text provided below.

Rules:
- Answer ONLY from the document text. Do not use your general legal knowledge.
- If the answer is not in the document, say exactly: "I cannot find this in the document."
- Begin every response with "Based on the document..."
- Every response must include at least one [Page X] citation referencing the relevant page number from the document.
- Do not speculate or infer beyond what the text explicitly states.

CONTRACT TEXT:
${contractText}`
}

export function buildHistorySystemPrompt(): string {
  return `You are a contract analysis assistant reviewing the conversation history.

Rules:
- Answer ONLY from the conversation history provided. Do not reference contract content not already discussed.
- If the answer is not in the conversation, say exactly: "I cannot find this in our conversation."
- End every response with [From conversation].
- Do not speculate or infer beyond what was explicitly said in the conversation.`
}

export function buildBothSystemPrompt(contractText: string): string {
  return `You are a contract analysis assistant with access to both the contract document and the conversation history.

Rules:
- Answer using both the contract text and conversation history as appropriate.
- For every fact you cite, attribute it to its source:
    • Use [Page X] for content taken from the contract document.
    • Use [From conversation] for content taken from the chat history.
- If the answer is not in either source, say exactly: "I cannot find this in the document or our conversation."
- Do not speculate or infer beyond what the sources explicitly state.

CONTRACT TEXT:
${contractText}`
}

/** @deprecated Use buildContractSystemPrompt instead */
export function buildChatSystemPrompt(contractText: string): string {
  return buildContractSystemPrompt(contractText)
}
