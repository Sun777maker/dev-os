'use client'

import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFViewerProps {
  url: string
  targetPage: number | null
}

export function PDFViewer({ url, targetPage }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [containerWidth, setContainerWidth] = useState<number>(600)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth - 32)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (targetPage !== null && pageRefs.current[targetPage]) {
      pageRefs.current[targetPage]!.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [targetPage])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'var(--color-grey-700)',
        padding: '16px',
      }}
    >
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        loading={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ color: 'var(--color-grey-300)', fontSize: '14px' }}>Loading PDF…</div>
          </div>
        }
        error={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ color: 'var(--color-grey-300)', fontSize: '14px' }}>Failed to load PDF</div>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <div
            key={pageNum}
            ref={(el) => { pageRefs.current[pageNum] = el }}
            style={{ marginBottom: '8px' }}
          >
            <Page
              pageNumber={pageNum}
              width={containerWidth}
              renderAnnotationLayer
              renderTextLayer
            />
          </div>
        ))}
      </Document>
    </div>
  )
}
