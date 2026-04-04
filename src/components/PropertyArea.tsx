import { useState } from 'react'
import type { Card, Color, PropertySet } from '../game/types'
import { COLOR_DISPLAY, SET_SIZES, RENT_VALUES } from '../game/constants'
import { COLORS, CARD_SIZE_SMALL } from './theme'
import CardView from './CardView'

interface PropertyAreaProps {
  properties: PropertySet[]
  small?: boolean
  selectedWildId?: string | null
  onSelectWild?: (cardId: string | null) => void
  validPlacements?: Color[]
  onPlace?: (color: Color) => void
}

function getRentAmount(set: PropertySet): number {
  const rentTable = RENT_VALUES[set.color]
  const count = set.cards.length
  let rent = count > 0 ? (rentTable[Math.min(count, rentTable.length) - 1] ?? 0) : 0
  if (set.hasHouse) rent += 3
  if (set.hasHotel) rent += 4
  return rent
}

interface AddSlotProps {
  onClick: () => void
}

function AddSlot({ onClick }: AddSlotProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: CARD_SIZE_SMALL.w,
        height: CARD_SIZE_SMALL.h,
        border: `2px dashed ${hovered ? 'rgba(96,165,250,0.6)' : 'rgba(96,165,250,0.3)'}`,
        borderRadius: 6,
        backgroundColor: hovered ? 'rgba(96,165,250,0.1)' : 'rgba(96,165,250,0.04)',
        color: hovered ? 'rgba(96,165,250,0.9)' : 'rgba(96,165,250,0.5)',
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 0.15s, background-color 0.15s, color 0.15s',
      }}
    >
      +
    </button>
  )
}

export default function PropertyArea({
  properties,
  small,
  selectedWildId,
  onSelectWild,
  validPlacements,
  onPlace,
}: PropertyAreaProps) {
  const existingColors = new Set(properties.map(s => s.color))
  const newSetColors = (validPlacements ?? []).filter(c => !existingColors.has(c))

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {properties.map(set => {
        const required = SET_SIZES[set.color]
        const hasNatural = set.cards.some((c: Card) => c.type === 'property')
        const complete = set.cards.length >= required && hasNatural
        const rent = getRentAmount(set)
        const canPlace = !complete && (validPlacements?.includes(set.color) ?? false)

        let borderStyle: string
        let bgColor: string
        if (complete) {
          borderStyle = '2px solid rgba(250,204,21,0.12)'
          bgColor = 'rgba(250,204,21,0.03)'
        } else if (canPlace) {
          borderStyle = '1px solid rgba(96,165,250,0.15)'
          bgColor = 'rgba(255,255,255,0.02)'
        } else {
          borderStyle = `1px solid ${COLORS.borderSubtle}`
          bgColor = 'rgba(255,255,255,0.02)'
        }

        return (
          <div
            key={set.color}
            style={{
              border: borderStyle,
              borderRadius: 6,
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              backgroundColor: bgColor,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: COLOR_DISPLAY[set.color].hex,
              }}>
                {COLOR_DISPLAY[set.color].label} ({set.cards.length}/{required}){complete ? ' \u2713' : ''}
              </span>
              <span style={{
                fontSize: small ? 7 : 10,
                color: COLORS.green,
                fontWeight: 'bold',
              }}>
                ${rent}M
              </span>
            </div>

            {/* House / Hotel labels */}
            {(set.hasHouse || set.hasHotel) && (
              <div style={{ fontSize: small ? 8 : 10, color: COLORS.textSecondary }}>
                {set.hasHouse && <span>House (+$3M)</span>}
                {set.hasHouse && set.hasHotel && <span>  </span>}
                {set.hasHotel && <span>Hotel (+$4M)</span>}
              </div>
            )}

            {/* Card row */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
              {set.cards.map((card: Card) => (
                <CardView
                  key={card.id}
                  card={card}
                  small={small}
                  selected={card.id === selectedWildId}
                  onClick={card.type === 'wild_property' && onSelectWild
                    ? () => onSelectWild(selectedWildId === card.id ? null : card.id)
                    : undefined}
                />
              ))}
              {canPlace && onPlace && (
                <AddSlot onClick={() => onPlace(set.color)} />
              )}
            </div>
          </div>
        )
      })}

      {/* New set zones for colors with no existing set */}
      {newSetColors.map(color => {
        return (
          <div
            key={`new-${color}`}
            onClick={() => onPlace?.(color)}
            style={{
              border: '2px dashed rgba(96,165,250,0.3)',
              borderRadius: 6,
              padding: 8,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(96,165,250,0.04)',
              cursor: 'pointer',
              minWidth: 80,
            }}
          >
            <span style={{ fontSize: 20, color: 'rgba(96,165,250,0.5)' }}>+</span>
            <span style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: COLOR_DISPLAY[color].hex,
              fontWeight: 'bold',
            }}>
              New {COLOR_DISPLAY[color].label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
