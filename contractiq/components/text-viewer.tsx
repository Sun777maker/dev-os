'use client'

import { useEffect, useRef } from 'react'

interface TextViewerProps {
  contractText: string
  targetPage: number | null
}

interface Page {
  number: number
  content: string
}

function parsePages(text: string): Page[] {
  const parts = text.split(/\[PAGE (\d+)\]/)
  const pages: Page[] = []
  for (let i = 1; i < parts.length; i += 2) {
    const pageNumber = parseInt(parts[i], 10)
    const content = (parts[i + 1] ?? '').trim()
    if (content) {
      pages.push({ number: pageNumber, content })
    }
  }
  if (pages.length === 0 && text.trim()) {
    pages.push({ number: 1, content: text.trim() })
  }
  return pages
}

export function TextViewer({ contractText, targetPage }: TextViewerProps) {
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const pages = parsePages(contractText)

  useEffect(() => {
    if (targetPage !== null && pageRefs.current[targetPage]) {
      pageRefs.current[targetPage]!.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [targetPage])

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'var(--color-grey-50)',
        padding: '24px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--color-grey-200)',
        borderRadius: '4px',
        overflow: 'hidden',
        maxWidth: '720px',
        margin: '0 auto',
      }}>
        {pages.map((page, i) => (
          <div
            key={page.number}
            ref={(el) => { pageRefs.current[page.number] = el }}
          >
            <div style={{
              padding: '8px 16px',
              background: 'var(--color-grey-50)',
              borderBottom: '1px solid var(--color-grey-100)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'inherit',
            }}>
              Page {page.number}
            </div>
            <div style={{
              padding: '24px',
              fontSize: '13px',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              borderBottom: i < pages.length - 1 ? '1px solid var(--color-grey-100)' : 'none',
            }}>
              {page.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
