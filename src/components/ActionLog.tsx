import { useEffect, useRef } from 'react'
import type { LogEntry } from '../game/types'
import { COLORS } from './theme'

interface ActionLogProps {
  log: LogEntry[]
}

export default function ActionLog({ log }: ActionLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const entries = log.slice(-20)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div style={{
      width: 210,
      borderLeft: `1px solid ${COLORS.borderSubtle}`,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 9,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
        color: COLORS.textMuted,
        marginBottom: 6,
      }}>Activity</div>
      {entries.map((entry, i) => (
        <div key={i} style={{
          fontSize: 10,
          color: COLORS.textSecondary,
          lineHeight: 1.6,
          padding: '2px 0',
        }}>
          <span style={{
            fontWeight: 600,
            color: entry.player === 0 ? COLORS.blue : COLORS.pink,
          }}>{entry.player === 0 ? 'You' : 'AI'}</span>{' '}
          {entry.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
