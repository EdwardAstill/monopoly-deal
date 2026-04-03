import type { Card } from '../game/types'
import CardView from './CardView'

interface HandProps {
  cards: Card[]
  selectedCardId: string | null
  onSelectCard: (cardId: string) => void
}

export default function Hand({ cards, selectedCardId, onSelectCard }: HandProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
    }}>
      {cards.map(card => (
        <CardView
          key={card.id}
          card={card}
          selected={card.id === selectedCardId}
          onClick={() => onSelectCard(card.id)}
        />
      ))}
    </div>
  )
}
