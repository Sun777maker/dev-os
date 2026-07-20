// Server-only: runs in Next.js API routes (Node.js runtime).
// Extracts text from text-layer PDFs and injects [PAGE N] markers.

const MIN_WORD_COUNT = 100
const MAX_PAGES = 20

export interface ExtractionOutput {
  text: string
  pageCount: number
  wordCount: number
}

export interface ExtractionError {
  code: 'SCANNED_PDF' | 'TOO_MANY_PAGES'
  message: string
}

export async function extractPdfText(
  buffer: Buffer
): Promise<ExtractionOutput | ExtractionError> {
  const pdfParse = (await import('pdf-parse')).default

  const data = await pdfParse(buffer, {
    // Render each page so we can inject [PAGE N] markers
    pagerender: renderPage,
  })

  const pageCount: number = data.numpages

  if (pageCount > MAX_PAGES) {
    return { code: 'TOO_MANY_PAGES', message: `Document has ${pageCount} pages; limit is ${MAX_PAGES}.` }
  }

  const text: string = data.text
  const wordCount = text.trim().split(/\s+/).length

  if (wordCount < MIN_WORD_COUNT) {
    return { code: 'SCANNED_PDF', message: 'Scanned PDFs are not supported yet. Please upload a text-layer PDF.' }
  }

  return { text, pageCount, wordCount }
}

function renderPage(pageData: { pageIndex: number; getTextContent: () => Promise<{ items: Array<{ str: string }> }> }): Promise<string> {
  return pageData.getTextContent().then((textContent) => {
    const pageNumber = pageData.pageIndex + 1
    const pageText = textContent.items.map((item) => item.str).join(' ')
    return `\n[PAGE ${pageNumber}]\n${pageText}`
  })
}
