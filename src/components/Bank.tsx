import type { Card } from '../game/types'

interface BankProps {
  cards: Card[]
}

function totalValue(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + (c.type === 'money' || c.type === 'action' || c.type === 'rent' || c.type === 'property' || c.type === 'wild_property' ? c.value : 0), 0)
}

export default function Bank({ cards }: BankProps) {
  return (
    <div>
      <span style={{ fontWeight: 'bold' }}>Bank: ${totalValue(cards)}M</span>
      {' '}
      <span style={{ color: 'gray' }}>({cards.length} cards)</span>
    </div>
  )
}
