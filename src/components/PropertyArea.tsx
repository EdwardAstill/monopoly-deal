import type { PropertySet } from '../game/types'
import { COLOR_DISPLAY, SET_SIZES } from '../game/constants'
import CardView from './CardView'

interface PropertyAreaProps {
  properties: PropertySet[]
  small?: boolean
}

export default function PropertyArea({ properties, small }: PropertyAreaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {properties.map(set => {
        const required = SET_SIZES[set.color]
        const complete = set.cards.length >= required
        return (
          <div
            key={set.color}
            style={{
              border: complete ? '2px solid gold' : '1px solid #444',
              borderRadius: 6,
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 'bold', color: '#333' }}>
              {COLOR_DISPLAY[set.color].label} {set.cards.length}/{required}
              {set.hasHouse ? ' 🏠' : ''}
              {set.hasHotel ? ' 🏨' : ''}
            </div>
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
