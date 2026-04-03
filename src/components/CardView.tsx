import React, { useState } from 'react'
import type { Card } from '../game/types'
import { COLORS, CARD_SIZE, CARD_SIZE_SMALL, cardColor, splitColors, cardTooltip, cardTypeLabel, cardDisplayName, cardSubtitle } from './theme'
import { RENT_VALUES, SET_SIZES } from '../game/constants'
import type { Color } from '../game/types'

interface CardViewProps {
  card: Card
  onClick?: () => void
  selected?: boolean
  faceDown?: boolean
  small?: boolean
}

function hexWithAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function CardView({ card, onClick, selected, faceDown, small }: CardViewProps) {
  const [hovered, setHovered] = useState(false)

  const w = small ? CARD_SIZE_SMALL.w : CARD_SIZE.w
  const h = small ? CARD_SIZE_SMALL.h : CARD_SIZE.h

  const typeFontSize = small ? 6 : 8
  const nameFontSize = small ? 8 : 11
  const subFontSize = small ? 6 : 8
  const valueFontSize = small ? 8 : 10

  const transform = selected
    ? 'translateY(-8px)'
    : hovered
    ? 'translateY(-2px)'
    : 'none'

  const boxShadow = selected
    ? '0 8px 24px rgba(0,0,0,0.4)'
    : hovered
    ? '0 6px 20px rgba(0,0,0,0.3)'
    : 'none'

  const baseStyle: React.CSSProperties = {
    width: w,
    height: h,
    borderRadius: 6,
    boxSizing: 'border-box',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    position: 'relative',
    transition: 'transform 0.15s, box-shadow 0.15s, border 0.15s',
    transform,
    boxShadow,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  if (faceDown) {
    return (
      <div
        style={{
          ...baseStyle,
          background: COLORS.cardSurface,
          border: `1px solid ${COLORS.borderStructural}`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: small ? 10 : 14, fontWeight: 'bold' }}>MD</span>
      </div>
    )
  }

  const colors = splitColors(card)
  const primaryColor = cardColor(card)
  const borderOpacity = selected ? 0.7 : 0.4
  const borderWidth = selected ? 2 : 1.5

  let borderStyle: React.CSSProperties
  if (colors) {
    const [c1, c2] = colors
    const blendTop = `linear-gradient(to right, ${hexWithAlpha(c1, borderOpacity)}, ${hexWithAlpha(c2, borderOpacity)})`
    borderStyle = {
      borderLeft: `${borderWidth}px solid ${hexWithAlpha(c1, borderOpacity)}`,
      borderRight: `${borderWidth}px solid ${hexWithAlpha(c2, borderOpacity)}`,
      borderTop: `${borderWidth}px solid transparent`,
      borderBottom: `${borderWidth}px solid transparent`,
      // Use outline for top/bottom blended effect — fallback to first color
      outline: 'none',
    }
    // We'll use a pseudo-border approach via boxSizing and extra wrapper isn't feasible with inline styles,
    // so we approximate with left/right split and use blended value for top/bottom
    const blendColor = hexWithAlpha(primaryColor, borderOpacity)
    borderStyle = {
      borderLeft: `${borderWidth}px solid ${hexWithAlpha(c1, borderOpacity)}`,
      borderRight: `${borderWidth}px solid ${hexWithAlpha(c2, borderOpacity)}`,
      borderTop: `${borderWidth}px solid ${blendColor}`,
      borderBottom: `${borderWidth}px solid ${blendColor}`,
    }
  } else {
    borderStyle = {
      border: `${borderWidth}px solid ${hexWithAlpha(primaryColor, borderOpacity)}`,
    }
  }

  const stripeHeight = 3
  const value = card.type === 'wild_property' && card.value === 0 ? null : `$${card.value}M`
  const typeLabel = cardTypeLabel(card)
  const name = cardDisplayName(card)
  const sub = cardSubtitle(card)
  const tooltip = cardTooltip(card)

  // Rent info for property cards
  let rentColor: Color | null = null
  if (card.type === 'property') rentColor = card.color
  const rentTable = rentColor ? RENT_VALUES[rentColor] : null
  const setSize = rentColor ? SET_SIZES[rentColor] : null

  return (
    <div
      style={{ ...baseStyle, background: COLORS.cardSurface, ...borderStyle }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Color stripe at top */}
      {colors ? (
        <div style={{ display: 'flex', height: stripeHeight, flexShrink: 0 }}>
          <div style={{ flex: 1, background: colors[0] }} />
          <div style={{ flex: 1, background: colors[1] }} />
        </div>
      ) : (
        <div style={{ height: stripeHeight, background: primaryColor, flexShrink: 0 }} />
      )}

      {/* Card content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: small ? 3 : 5 }}>
        <div>
          <div style={{ color: COLORS.textSecondary, fontSize: typeFontSize, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2 }}>
            {typeLabel}
          </div>
          <div style={{ color: COLORS.textPrimary, fontSize: nameFontSize, fontWeight: 'bold', lineHeight: 1.2, marginTop: 2, wordBreak: 'break-word' }}>
            {name}
          </div>
          {sub && (
            <div style={{ color: COLORS.textSecondary, fontSize: subFontSize, lineHeight: 1.2, marginTop: 1 }}>
              {sub}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Rent table on property cards */}
          {rentTable && !small && (
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {rentTable.map((rent, i) => (
                <div key={i} style={{
                  fontSize: 7,
                  fontWeight: 600,
                  color: i === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  padding: '1px 3px',
                  lineHeight: 1,
                }}>{rent}</div>
              ))}
            </div>
          )}
          {rentTable && small && (
            <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)' }}>
              {rentTable[rentTable.length - 1]}M
            </div>
          )}
          {!rentTable && <div />}
          {value && (
            <div style={{ color: COLORS.textPrimary, fontSize: valueFontSize, fontWeight: 'bold' }}>
              {value}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {hovered && !small && tooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          padding: '6px 10px',
          color: COLORS.textPrimary,
          fontSize: 11,
          whiteSpace: 'nowrap',
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {tooltip}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid rgba(255,255,255,0.12)',
          }} />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-1px)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #0f172a',
          }} />
        </div>
      )}
    </div>
  )
}
