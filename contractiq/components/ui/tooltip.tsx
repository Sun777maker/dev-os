'use client'

import { useState, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-grey-800)',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: '18px',
            padding: '6px 10px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            maxWidth: '280px',
            whiteSpaceCollapse: 'preserve',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
