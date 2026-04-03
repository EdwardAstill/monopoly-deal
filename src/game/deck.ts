import type { Card } from './types'
import { ALL_CARDS } from './constants'

export function createDeck(): Card[] {
  return ALL_CARDS.map(card => ({ ...card }))
}

export function shuffle(deck: Card[]): Card[] {
  const copy = [...deck]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function dealInitialHands(deck: Card[]): {
  hands: [Card[], Card[]]
  remainingDeck: Card[]
} {
  const hand0 = deck.slice(0, 5)
  const hand1 = deck.slice(5, 10)
  const remainingDeck = deck.slice(10)
  return { hands: [hand0, hand1], remainingDeck }
}

export function drawCards(deck: Card[], discardPile: Card[], count: number): {
  drawn: Card[]
  deck: Card[]
  discardPile: Card[]
} {
  let currentDeck = [...deck]
  let currentDiscard = [...discardPile]
  const drawn: Card[] = []

  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) {
      if (currentDiscard.length === 0) break
      currentDeck = shuffle(currentDiscard)
      currentDiscard = []
    }
    drawn.push(currentDeck.pop()!)
  }

  return { drawn, deck: currentDeck, discardPile: currentDiscard }
}
