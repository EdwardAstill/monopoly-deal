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

const ACTION_INFO: Record<string, { label: string; icon: string }> = {
  dealBreaker: { label: 'Deal Breaker', icon: '💥' },
  justSayNo: { label: 'Just Say No', icon: '🚫' },
  slyDeal: { label: 'Sly Deal', icon: '🤫' },
  forcedDeal: { label: 'Forced Deal', icon: '🔄' },
  debtCollector: { label: 'Debt Collector', icon: '💰' },
  itsMyBirthday: { label: "It's My Birthday", icon: '🎂' },
  passGo: { label: 'Pass Go', icon: '▶️' },
  house: { label: 'House', icon: '🏠' },
  hotel: { label: 'Hotel', icon: '🏨' },
  doubleRent: { label: 'Double Rent', icon: '⚡' },
}

const CARD_ICON: Record<string, string> = {
  money: '💵',
  property: '🏘️',
  wild_property: '🌈',
  rent: '📋',
}

function getBackground(card: Card): string {
  if (card.type === 'property') return COLOR_DISPLAY[card.color].hex
  if (card.type === 'wild_property') {
    if (card.colors.length > 2) return 'linear-gradient(135deg, #FF6347, #FFD700, #228B22, #0000CD)'
    return `linear-gradient(135deg, ${COLOR_DISPLAY[card.colors[0]].hex}, ${COLOR_DISPLAY[card.colors[1]].hex})`
  }
  if (card.type === 'money') return '#85BB65'
  if (card.type === 'rent') {
    if (card.colors.length > 2) return 'linear-gradient(135deg, #FF6347, #FF8C00)'
    return `linear-gradient(135deg, ${COLOR_DISPLAY[card.colors[0]].hex}, ${COLOR_DISPLAY[card.colors[1]].hex})`
  }
  if (card.type === 'action') return '#4a4a6a'
  return '#DDD'
}

function getIcon(card: Card, small: boolean): string {
  if (card.type === 'action') return small ? '' : (ACTION_INFO[card.name]?.icon ?? '')
  return small ? '' : (CARD_ICON[card.type] ?? '')
}

function getTitle(card: Card): string {
  if (card.type === 'property') return card.name
  if (card.type === 'money') return `$${card.value}M`
  if (card.type === 'action') return ACTION_INFO[card.name]?.label ?? card.name
  if (card.type === 'rent') {
    if (card.colors.length > 2) return 'Rent (Any)'
    return `Rent`
  }
  if (card.type === 'wild_property') {
    if (card.colors.length > 2) return 'Wild'
    return `Wild`
  }
  return ''
}

function getSubtitle(card: Card): string {
  if (card.type === 'rent' && card.colors.length <= 2) {
    return card.colors.map(c => COLOR_DISPLAY[c].label).join(' / ')
  }
  if (card.type === 'wild_property' && card.colors.length <= 2) {
    return card.colors.map(c => COLOR_DISPLAY[c].label).join(' / ')
  }
  if (card.type === 'property') return COLOR_DISPLAY[card.color].label
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
  const subtitle = getSubtitle(card)
  const icon = getIcon(card, !!small)
  const value = card.type === 'wild_property' && card.value === 0 ? null : `$${card.value}M`

  return (
    <div
      style={{ ...baseStyle, background: bg }}
      onClick={onClick}
    >
      <div>
        {icon && <div style={{ fontSize: small ? 12 : 20, lineHeight: 1 }}>{icon}</div>}
        <span style={textStyle}>{title}</span>
        {subtitle && (
          <div style={{ ...textStyle, fontWeight: 'normal', fontSize: small ? 6 : 8, opacity: 0.85, marginTop: 1 }}>
            {subtitle}
          </div>
        )}
      </div>
      {value && (
        <span style={{ ...textStyle, alignSelf: 'flex-end', fontSize: small ? 7 : 9 }}>
          {value}
        </span>
      )}
    </div>
  )
}
