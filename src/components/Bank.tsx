import { useState } from 'react'
import type { Card } from '../game/types'
import { COLORS, BANK_CARD_SIZE } from './theme'

interface BankProps {
  cards: Card[]
  onBank?: () => void
  bankValue?: number
}

export default function Bank({ cards, onBank, bankValue }: BankProps) {
  const [hovered, setHovered] = useState(false)

  // Group cards by denomination and calculate total
  const denomMap = new Map<number, number>()
  let total = 0
  for (const card of cards) {
    const v = card.value ?? 0
    total += v
    denomMap.set(v, (denomMap.get(v) ?? 0) + 1)
  }

  const sortedDenoms = Array.from(denomMap.keys()).sort((a, b) => a - b)

  const cardStyle: React.CSSProperties = {
    width: BANK_CARD_SIZE.w,
    height: BANK_CARD_SIZE.h,
    borderRadius: 5,
    background: COLORS.cardSurface,
    border: '1.5px solid rgba(74,222,128,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.green,
    fontSize: 11,
    fontWeight: 'bold',
    flexShrink: 0,
  }

  const addButtonStyle: React.CSSProperties = {
    width: BANK_CARD_SIZE.w,
    height: BANK_CARD_SIZE.h,
    borderRadius: 5,
    background: hovered ? 'rgba(96,165,250,0.08)' : 'transparent',
    border: hovered ? '2px dashed rgba(96,165,250,0.6)' : '2px dashed rgba(96,165,250,0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.blue,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'border-color 0.15s, background 0.15s',
    padding: 0,
    lineHeight: 1,
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {sortedDenoms.map(denom => (
        <div key={denom} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={cardStyle}>${denom}M</div>
          <span style={{ fontSize: 9, color: COLORS.textSecondary }}>x{denomMap.get(denom)}</span>
        </div>
      ))}

      {onBank && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <button
            style={addButtonStyle}
            onClick={onBank}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <span style={{ fontSize: 14 }}>+</span>
            {bankValue !== undefined && (
              <span style={{ fontSize: 8 }}>${bankValue}M</span>
            )}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto' }}>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>Total</span>
        <span style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.green }}>${total}M</span>
      </div>
    </div>
  )
}
