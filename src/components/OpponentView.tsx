import type { PlayerState } from '../game/types'
import { COLORS } from './theme'
import Bank from './Bank'
import PropertyArea from './PropertyArea'
import CardView from './CardView'

interface OpponentViewProps {
  player: PlayerState
}

const dummyCard = { id: 'dummy', type: 'money' as const, value: 0 as any }

export default function OpponentView({ player }: OpponentViewProps) {
  return (
    <div style={{
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      borderBottom: `1px solid ${COLORS.borderSubtle}`,
    }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
        color: COLORS.textMuted,
      }}>Opponent</div>

      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: player.hand.length }, (_, i) => (
          <CardView key={i} card={dummyCard} faceDown small />
        ))}
      </div>

      <PropertyArea properties={player.properties} small />

      <Bank cards={player.bank} />
    </div>
  )
}
