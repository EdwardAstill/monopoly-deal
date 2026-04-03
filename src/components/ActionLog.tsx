import type { LogEntry } from '../game/types'

interface ActionLogProps {
  log: LogEntry[]
}

export default function ActionLog({ log }: ActionLogProps) {
  const entries = log.slice(-15)

  return (
    <div
      style={{
        width: 200,
        overflowY: 'auto',
        borderLeft: '1px solid #333',
        padding: 8,
        fontSize: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#aaa' }}>Action Log</div>
      {entries.map((entry, i) => (
        <div
          key={i}
          style={{ color: entry.player === 0 ? '#8cf' : '#f8c' }}
        >
          <span style={{ fontWeight: 'bold' }}>
            {entry.player === 0 ? 'You' : 'AI'}:
          </span>{' '}
          {entry.message}
        </div>
      ))}
    </div>
  )
}
