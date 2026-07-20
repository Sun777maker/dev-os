'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { KeyTermsPanel } from '@/components/key-terms-panel'
import { TextViewer } from '@/components/text-viewer'
import { ChatInterface } from '@/components/chat-interface'
import { FeedbackWidget } from '@/components/feedback-widget'
import { Badge } from '@/components/ui/badge'
import { Toast } from '@/components/ui/toast'
import type { Contract, KeyTerm } from '@/types'

const PDFViewer = dynamic(
  () => import('@/components/pdf-viewer').then((m) => m.PDFViewer),
  { ssr: false }
)

type RightPanelTab = 'terms' | 'chat'

interface ResultsPanelProps {
  contract: Omit<Contract, 'contract_text'>
  keyTerms: KeyTerm[]
  signedUrl: string | null
  contractText: string | null
}

interface ToastState {
  message: string
  variant: 'success' | 'error'
}

export function ResultsPanel({ contract, keyTerms: initialTerms, signedUrl, contractText }: ResultsPanelProps) {
  const [targetPage, setTargetPage] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<RightPanelTab>('terms')
  const [terms, setTerms] = useState<KeyTerm[]>(initialTerms)
  const [toast, setToast] = useState<ToastState | null>(null)

  const handlePageClick = useCallback((page: number) => {
    setTargetPage(page)
  }, [])

  async function handleEditTerm(termId: string, value: string) {
    const prevTerms = terms
    // Optimistic update
    setTerms((prev) =>
      prev.map((t) =>
        t.id === termId
          ? { ...t, value, is_edited: true, original_value: t.is_edited ? t.original_value : t.value }
          : t
      )
    )

    try {
      const res = await fetch(`/api/contracts/${contract.id}/terms/${termId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) {
        setTerms(prevTerms)
        setToast({ message: 'Failed to save term. Please try again.', variant: 'error' })
        return
      }
      setToast({ message: 'Term saved.', variant: 'success' })
    } catch {
      setTerms(prevTerms)
      setToast({ message: 'Failed to save term. Please try again.', variant: 'error' })
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--color-grey-100)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <span
            className="type-body-lg"
            style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {contract.name}
          </span>
          <Badge variant="type">{contract.type}</Badge>
        </div>
        <div
          role="alert"
          style={{
            flexShrink: 0,
            fontSize: '12px',
            color: 'var(--color-red-700)',
            background: 'var(--color-red-50)',
            border: '1px solid var(--color-red-200)',
            borderRadius: '4px',
            padding: '4px 10px',
          }}
        >
          AI-assisted review · Not legal advice · Verify critical terms with a lawyer
        </div>
      </div>

      {/* Dual panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: PDF or text viewer */}
        <div style={{ overflow: 'hidden', borderRight: '1px solid var(--color-grey-200)' }}>
          {signedUrl ? (
            <PDFViewer url={signedUrl} targetPage={targetPage} />
          ) : contractText ? (
            <TextViewer contractText={contractText} targetPage={targetPage} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-grey-50)' }}>
              <p className="type-body-sm" style={{ color: 'var(--text-secondary)' }}>No document preview available</p>
            </div>
          )}
        </div>

        {/* Right: Key terms + chat tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-grey-100)',
            flexShrink: 0,
          }}>
            {(['terms', 'chat'] as RightPanelTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-selected={activeTab === tab}
                role="tab"
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: activeTab === tab ? 'var(--brand)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--brand)' : '2px solid transparent',
                  transition: 'color 0.15s ease',
                }}
              >
                {tab === 'terms' ? `Key Terms (${terms.length})` : 'Chat'}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {activeTab === 'terms' ? (
              <>
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  <KeyTermsPanel
                    terms={terms}
                    onPageClick={handlePageClick}
                    onEditTerm={handleEditTerm}
                  />
                </div>
                <FeedbackWidget contractId={contract.id} />
              </>
            ) : (
              <ChatInterface contractId={contract.id} onPageClick={handlePageClick} />
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
