import type { PlayerState } from '../game/types'
import Bank from './Bank'
import PropertyArea from './PropertyArea'
import CardView from './CardView'

interface OpponentViewProps {
  player: PlayerState
}

export default function OpponentView({ player }: OpponentViewProps) {
  // Dummy card for face-down rendering
  const dummyCard = { id: 'dummy', type: 'money' as const, value: 0 as any }

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 'bold' }}>Opponent</span>
        <Bank cards={player.bank} />
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {Array.from({ length: player.hand.length }, (_, i) => (
          <CardView key={i} card={dummyCard} faceDown small />
        ))}
      </div>
      <PropertyArea properties={player.properties} small />
    </div>
  )
}
