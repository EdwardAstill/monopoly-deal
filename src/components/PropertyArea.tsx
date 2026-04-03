import type { PropertySet } from '../game/types'
import { COLOR_DISPLAY, SET_SIZES, RENT_VALUES } from '../game/constants'
import CardView from './CardView'

interface PropertyAreaProps {
  properties: PropertySet[]
  small?: boolean
}

function getRentAmount(set: PropertySet): number {
  const rentTable = RENT_VALUES[set.color]
  const count = set.cards.length
  let rent = count > 0 ? (rentTable[Math.min(count, rentTable.length) - 1] ?? 0) : 0
  if (set.hasHouse) rent += 3
  if (set.hasHotel) rent += 4
  return rent
}

export default function PropertyArea({ properties, small }: PropertyAreaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {properties.map(set => {
        const required = SET_SIZES[set.color]
        const complete = set.cards.length >= required
        const rent = getRentAmount(set)
        return (
          <div
            key={set.color}
            style={{
              border: complete ? '2px solid gold' : '1px solid #444',
              borderRadius: 6,
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              backgroundColor: complete ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: small ? 8 : 11,
                fontWeight: 'bold',
                color: COLOR_DISPLAY[set.color].hex,
              }}>
                {COLOR_DISPLAY[set.color].label} ({set.cards.length}/{required})
              </span>
              <span style={{
                fontSize: small ? 7 : 10,
                color: '#4f4',
                fontWeight: 'bold',
              }}>
                ${rent}M
              </span>
            </div>
            {(set.hasHouse || set.hasHotel) && (
              <div style={{ fontSize: small ? 8 : 11 }}>
                {set.hasHouse && '🏠 House (+$3M)'}
                {set.hasHouse && set.hasHotel && '  '}
                {set.hasHotel && '🏨 Hotel (+$4M)'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
              {set.cards.map(card => (
                <CardView key={card.id} card={card} small={small} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
