import React from 'react'
import type { Card } from '../game/types'
import { COLOR_DISPLAY } from '../game/constants'

interface CardViewProps {
  card: Card
  onClick?: () => void
  selected?: boolean
  faceDown?: boolean
  small?: boolean
}

const ACTION_DISPLAY_NAMES: Record<string, string> = {
  dealBreaker: 'Deal Breaker',
  justSayNo: 'Just Say No',
  slyDeal: 'Sly Deal',
  forcedDeal: 'Forced Deal',
  debtCollector: 'Debt Collector',
  itsMyBirthday: "It's My Birthday",
  passGo: 'Pass Go',
  house: 'House',
  hotel: 'Hotel',
  doubleRent: 'Double Rent',
}

function getBackground(card: Card): string {
  if (card.type === 'property') {
    return COLOR_DISPLAY[card.color].hex
  }
  if (card.type === 'wild_property') {
    if (card.colors.length > 2) return '#FFD700'
    return COLOR_DISPLAY[card.colors[0]].hex
  }
  if (card.type === 'money') return '#85BB65'
  if (card.type === 'rent') return '#FF6347'
  return '#DDD'
}

function getTitle(card: Card): string {
  if (card.type === 'property') return card.name
  if (card.type === 'money') return `$${card.value}M`
  if (card.type === 'action') return ACTION_DISPLAY_NAMES[card.name] ?? card.name
  if (card.type === 'rent') return card.colors.map(c => COLOR_DISPLAY[c].label).join('/')
  if (card.type === 'wild_property') return 'Wild'
  return ''
}

export default function CardView({ card, onClick, selected, faceDown, small }: CardViewProps) {
  const width = small ? 50 : 80
  const height = small ? 70 : 110
  const fontSize = small ? 8 : 10

  const baseStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: small ? 3 : 5,
    boxSizing: 'border-box',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    position: 'relative',
    transition: 'transform 0.15s, border 0.15s',
    transform: selected ? 'translateY(-8px)' : 'none',
    border: selected ? '3px solid black' : '1px solid rgba(0,0,0,0.3)',
    flexShrink: 0,
  }

  const textStyle: React.CSSProperties = {
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    fontSize,
    fontWeight: 'bold',
    lineHeight: 1.2,
    wordBreak: 'break-word',
  }

  if (faceDown) {
    return (
      <div
        style={{
          ...baseStyle,
          background: '#4A90D9',
          border: selected ? '3px solid black' : '2px solid #2C5F8A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClick}
      >
        <span style={{ ...textStyle, fontSize: small ? 10 : 14 }}>MD</span>
      </div>
    )
  }

  const bg = getBackground(card)
  const title = getTitle(card)
  const value = card.type === 'wild_property' && card.value === 0 ? null : `$${card.value}m`

  return (
    <div
      style={{ ...baseStyle, background: bg }}
      onClick={onClick}
    >
      <span style={textStyle}>{title}</span>
      {value && (
        <span style={{ ...textStyle, alignSelf: 'flex-end', fontSize: small ? 7 : 9 }}>
          {value}
        </span>
      )}
    </div>
  )
}
