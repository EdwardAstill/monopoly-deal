import { describe, it, expect } from 'vitest'
import { createDeck, shuffle, dealInitialHands } from '../../src/game/deck'
import { ALL_CARDS } from '../../src/game/constants'

describe('createDeck', () => {
  it('returns a fresh copy of all 106 cards', () => {
    const deck = createDeck()
    expect(deck.length).toBe(106)
    expect(deck).not.toBe(ALL_CARDS)
  })
})

describe('shuffle', () => {
  it('returns a deck of the same length', () => {
    const deck = createDeck()
    const shuffled = shuffle(deck)
    expect(shuffled.length).toBe(106)
  })

  it('contains the same cards', () => {
    const deck = createDeck()
    const shuffled = shuffle(deck)
    const deckIds = deck.map(c => c.id).sort()
    const shuffledIds = shuffled.map(c => c.id).sort()
    expect(shuffledIds).toEqual(deckIds)
  })
})

describe('dealInitialHands', () => {
  it('gives each player 5 cards and returns remaining deck', () => {
    const deck = shuffle(createDeck())
    const { hands, remainingDeck } = dealInitialHands(deck)
    expect(hands[0].length).toBe(5)
    expect(hands[1].length).toBe(5)
    expect(remainingDeck.length).toBe(96)
  })
})
