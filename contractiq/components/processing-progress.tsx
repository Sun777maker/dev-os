type UploadStep = 'uploading' | 'processing' | 'done'

interface Step {
  label: string
  description: string
}

const STEPS: Step[] = [
  { label: 'Extract', description: 'Reading PDF and extracting text…' },
  { label: 'Analyse', description: 'AI is identifying key terms…' },
  { label: 'Compile', description: 'Building your review…' },
]

function stepIndex(step: UploadStep): number {
  if (step === 'uploading') return 0
  if (step === 'processing') return 1
  return 2
}

interface ProcessingProgressProps {
  step: UploadStep
}

export function ProcessingProgress({ step }: ProcessingProgressProps) {
  const current = stepIndex(step)

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--color-grey-100)',
      borderRadius: '8px',
      padding: '40px',
      marginTop: '24px',
    }}>
      <h2 className="type-body-lg" style={{ color: 'var(--text-primary)', marginBottom: '32px', textAlign: 'center' }}>
        Analyzing your contract…
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {STEPS.map((s, i) => {
          const isDone = i < current || step === 'done'
          const isActive = i === current && step !== 'done'

          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: i < STEPS.length - 1 ? '24px' : '0', position: 'relative' }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '15px',
                  top: '32px',
                  width: '2px',
                  height: 'calc(100% - 8px)',
                  background: isDone ? 'var(--brand)' : 'var(--color-grey-100)',
                  transition: 'background 0.3s ease',
                }} />
              )}

              {/* Step indicator */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                background: isDone ? 'var(--brand)' : isActive ? 'var(--color-blue-50)' : 'var(--color-grey-50)',
                border: isActive ? '2px solid var(--brand)' : isDone ? 'none' : '2px solid var(--color-grey-200)',
                color: isDone ? '#fff' : isActive ? 'var(--brand)' : 'var(--text-secondary)',
                transition: 'all 0.3s ease',
              }}>
                {isDone ? '✓' : i + 1}
              </div>

              {/* Label + description */}
              <div style={{ paddingTop: '4px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDone || isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                  {s.label}
                </div>
                {isActive && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {s.description}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {step !== 'done' && (
        <p className="type-body-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '32px' }}>
          This usually takes under 30 seconds
        </p>
      )}
    </div>
  )
}
