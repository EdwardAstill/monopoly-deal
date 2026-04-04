import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import type { Card } from '../game/types'
import { COLORS, CARD_SIZE, CARD_SIZE_SMALL, cardColor, splitColors, cardTooltip, cardTypeLabel, cardDisplayName, cardSubtitle } from './theme'
import { RENT_VALUES, SET_SIZES, COLOR_DISPLAY } from '../game/constants'
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

function CardPopup({ card, x, y, onClose }: { card: Card; x: number; y: number; onClose: () => void }) {
  useEffect(() => {
    const close = () => onClose()
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  const primaryColor = cardColor(card)

  // Adjust position so popup stays on screen
  const popupW = 180
  const popupMaxH = 220
  const left = x + popupW > window.innerWidth ? x - popupW : x + 8
  const top = y + popupMaxH > window.innerHeight ? y - popupMaxH : y + 8

  let content: React.ReactNode

  if (card.type === 'property') {
    const rents = RENT_VALUES[card.color]
    content = (
      <>
        <div style={{ color: COLORS.textSecondary, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Rent — {COLOR_DISPLAY[card.color].label}
        </div>
        {rents.map((rent, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>{i + 1} card{i > 0 ? 's' : ''}</span>
            <span style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: 'bold' }}>${rent}M</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: COLORS.textSecondary, fontSize: 10 }}>Set size</span>
          <span style={{ color: COLORS.textSecondary, fontSize: 10 }}>{SET_SIZES[card.color]}</span>
        </div>
      </>
    )
  } else if (card.type === 'rent') {
    const labels = card.colors.length > 2 ? ['Any Color'] : card.colors.map(c => COLOR_DISPLAY[c].label)
    content = (
      <>
        <div style={{ color: COLORS.textSecondary, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rent Card</div>
        <div style={{ color: COLORS.textPrimary, fontSize: 11, marginBottom: 6 }}>Collect rent from all players for a property set you own.</div>
        <div style={{ color: COLORS.textSecondary, fontSize: 10 }}>Applies to: {labels.join(', ')}</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: COLORS.textSecondary, fontSize: 10 }}>Bank value</span>
          <span style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: 'bold' }}>${card.value}M</span>
        </div>
      </>
    )
  } else if (card.type === 'wild_property') {
    const labels = card.colors.length > 2 ? ['All Colors'] : card.colors.map(c => COLOR_DISPLAY[c].label)
    content = (
      <>
        <div style={{ color: COLORS.textSecondary, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wild Property</div>
        <div style={{ color: COLORS.textPrimary, fontSize: 11, marginBottom: 6 }}>Can be placed in any matching property set.</div>
        <div style={{ color: COLORS.textSecondary, fontSize: 10, marginBottom: 6 }}>Colors: {labels.join(', ')}</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: COLORS.textSecondary, fontSize: 10 }}>Bank value</span>
          <span style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: 'bold' }}>${card.value}M</span>
        </div>
      </>
    )
  } else if (card.type === 'money') {
    content = (
      <>
        <div style={{ color: COLORS.textSecondary, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Money</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>Value</span>
          <span style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' }}>${card.value}M</span>
        </div>
        <div style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>Play to your bank.</div>
      </>
    )
  } else if (card.type === 'action') {
    const desc = cardTooltip(card)
    content = (
      <>
        <div style={{ color: COLORS.textSecondary, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</div>
        <div style={{ color: COLORS.textPrimary, fontSize: 11, marginBottom: 6, lineHeight: 1.4 }}>{desc}</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: COLORS.textSecondary, fontSize: 10 }}>Bank value</span>
          <span style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: 'bold' }}>${card.value}M</span>
        </div>
      </>
    )
  }

  return ReactDOM.createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        left,
        top,
        width: popupW,
        background: '#0f172a',
        border: `1px solid ${primaryColor}55`,
        borderTop: `2px solid ${primaryColor}`,
        borderRadius: 8,
        padding: '10px 12px',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 12, color: COLORS.textPrimary, marginBottom: 8 }}>
        {cardDisplayName(card)}
      </div>
      {content}
    </div>,
    document.body
  )
}

export default function CardView({ card, onClick, selected, faceDown, small }: CardViewProps) {
  const [hovered, setHovered] = useState(false)
  const [popup, setPopup] = useState<{ x: number; y: number } | null>(null)

  const closePopup = useCallback(() => setPopup(null), [])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setPopup({ x: e.clientX, y: e.clientY })
  }

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

  return (
    <div
      style={{ ...baseStyle, background: COLORS.cardSurface, ...borderStyle }}
      onClick={onClick}
      onContextMenu={handleContextMenu}
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
      {popup && <CardPopup card={card} x={popup.x} y={popup.y} onClose={closePopup} />}
    </div>
  )
}
