import type { PlayerState } from '../game/types'
import Bank from './Bank'
import PropertyArea from './PropertyArea'

interface OpponentViewProps {
  player: PlayerState
}

export default function OpponentView({ player }: OpponentViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>Opponent ({player.hand.length} cards in hand)</div>
      <Bank cards={player.bank} />
      <PropertyArea properties={player.properties} small />
    </div>
  )
}
