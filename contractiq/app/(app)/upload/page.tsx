'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContractTypeSelector } from '@/components/contract-type-selector'
import { UploadForm } from '@/components/upload-form'
import { TermPreviewPanel } from '@/components/term-preview-panel'
import { CustomTermAdder } from '@/components/custom-term-adder'
import { ProcessingProgress } from '@/components/processing-progress'
import { Toast } from '@/components/ui/toast'
import { ERROR_MESSAGES } from '@/lib/utils/error-codes'
import type { ContractType } from '@/types'

type UploadStep = 'uploading' | 'processing' | 'done'

export default function UploadPage() {
  const router = useRouter()
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [customTerms, setCustomTerms] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState<UploadStep | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isReady = !!file && !!contractType

  async function handleAnalyze() {
    if (!isReady) return
    setError(null)
    setActiveStep('uploading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('contractType', contractType)
    formData.append('name', file.name)
    if (customTerms.length > 0) {
      formData.append('customTerms', JSON.stringify(customTerms))
    }

    let contractId: string
    try {
      const uploadRes = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error ?? 'Upload failed')
      }

      const uploadData = await uploadRes.json()
      contractId = uploadData.contractId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setActiveStep(null)
      return
    }

    setActiveStep('processing')

    try {
      const processRes = await fetch(`/api/contracts/${contractId}/process`, {
        method: 'POST',
      })

      if (!processRes.ok) {
        const err = await processRes.json().catch(() => ({ error: 'Processing failed' }))
        throw new Error(err.error ?? 'Processing failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
      setActiveStep(null)
      return
    }

    setActiveStep('done')
    router.push(`/contracts/${contractId}`)
  }

  if (activeStep) {
    return (
      <div style={{ padding: '48px', maxWidth: '560px', margin: '0 auto' }}>
        <h1 className="type-h5" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
          Review a Contract
        </h1>
        <p className="type-body-sm" style={{ color: 'var(--text-secondary)' }}>
          {file?.name}
        </p>
        <ProcessingProgress step={activeStep} />
      </div>
    )
  }

  return (
    <div style={{ padding: '48px', maxWidth: '960px', margin: '0 auto' }}>
      <h1 className="type-h5" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
        Review a Contract
      </h1>
      <p className="type-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
        Upload an NDA or MSA. ContractIQ will extract key terms with confidence scores and page citations in under 30 seconds.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: contractType ? '1fr 260px' : '1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left: form */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--color-grey-100)',
          borderRadius: '8px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}>
          <ContractTypeSelector value={contractType} onChange={setContractType} />
          <UploadForm file={file} onChange={setFile} disabled={!contractType} />
          {contractType && (
            <CustomTermAdder terms={customTerms} onChange={setCustomTerms} />
          )}

          <div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={!isReady}
              style={{ width: '100%' }}
            >
              Analyze Contract
            </button>
            <p className="type-body-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '10px' }}>
              Results in under 30 seconds · Text-layer PDFs only
            </p>
          </div>
        </div>

        {/* Right: term preview */}
        {contractType && (
          <TermPreviewPanel contractType={contractType} customTerms={customTerms} />
        )}
      </div>

      {error && (
        <Toast message={error} variant="error" onDismiss={() => setError(null)} />
      )}
    </div>
  )
}
