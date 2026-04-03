import { describe, it, expect } from 'vitest'
import { createGame, performDraw, getValidActions } from '../../src/game/engine'
import { chooseAction, chooseResponse, chooseDiscards } from '../../src/game/ai'
import type {
  GameState, PlayerState, PlayerIndex, Card, Color,
  PropertySet, ActionCard, PropertyCard,
} from '../../src/game/types'
import { SET_SIZES } from '../../src/game/constants'

// ── Helpers ───────────────────────────────────────────────────────────────────

let idSeq = 8000
function nextId() { return `ai-t-${idSeq++}` }

function makeMoney(value: 1 | 2 | 3 | 4 | 5 | 10 = 1): Card {
  return { id: nextId(), type: 'money', value }
}

function makeProperty(color: Color, name = 'Test Prop'): PropertyCard {
  return { id: nextId(), type: 'property', color, name, value: 1 }
}

function makeAction(name: ActionCard['name'], value = 1): ActionCard {
  return { id: nextId(), type: 'action', name, value }
}

function makeSet(color: Color, count: number): PropertySet {
  const cards: PropertyCard[] = []
  for (let i = 0; i < count; i++) {
    cards.push(makeProperty(color, `${color} ${i}`))
  }
  return { color, cards, hasHouse: false, hasHotel: false }
}

function baseState(): GameState {
  const state = createGame()
  return performDraw(state)
}

function clonePlayers(players: GameState['players']): GameState['players'] {
  return [
    {
      hand: [...players[0].hand],
      bank: [...players[0].bank],
      properties: players[0].properties.map(s => ({ ...s, cards: [...s.cards] })),
    },
    {
      hand: [...players[1].hand],
      bank: [...players[1].bank],
      properties: players[1].properties.map(s => ({ ...s, cards: [...s.cards] })),
    },
  ]
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('chooseAction', () => {
  it('returns a valid action from getValidActions', () => {
    const state = baseState()
    const validActions = getValidActions(state)
    const chosen = chooseAction(state)
    // The chosen action type must appear among valid actions
    expect(validActions.some(a => a.type === chosen.type)).toBe(true)
  })

  it('prefers completing a brown set over banking', () => {
    const state = baseState()
    const players = clonePlayers(state.players)

    // Give player 0 one brown property already on the table (set size = 2)
    const brownInSet = makeProperty('brown', 'Baltic Avenue')
    players[0].properties = [{ color: 'brown', cards: [brownInSet], hasHouse: false, hasHotel: false }]

    // Give player 0 a second brown property in hand (will complete the set)
    const brownInHand = makeProperty('brown', 'Mediterranean Avenue')
    // Also give a money card in hand
    const moneyCard = makeMoney(5)
    players[0].hand = [brownInHand, moneyCard]

    const controlled: GameState = {
      ...state,
      players,
      currentPlayer: 0,
      phase: 'action',
      actionsRemaining: 3,
    }

    const chosen = chooseAction(controlled)
    expect(chosen.type).toBe('playProperty')
    expect((chosen as any).cardId).toBe(brownInHand.id)
    expect((chosen as any).targetColor).toBe('brown')
  })
})

describe('chooseResponse', () => {
  it('plays Just Say No when targeted by debtCollector', () => {
    const state = baseState()
    const players = clonePlayers(state.players)

    const jsnCard = makeAction('justSayNo')
    // player 1 is the target, has Just Say No in hand
    players[1].hand = [jsnCard]

    const controlled: GameState = {
      ...state,
      players,
      currentPlayer: 0,
      phase: 'respond',
      actionsRemaining: 0,
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
    }

    const response = chooseResponse(controlled)
    expect(response.type).toBe('respond')
    expect(response.accept).toBe(false)
  })
})

describe('chooseDiscards', () => {
  it('returns the correct number of card IDs when hand exceeds 7', () => {
    const state = baseState()
    const players = clonePlayers(state.players)

    // Give player 0 exactly 10 cards in hand (need to discard 3)
    const handCards: Card[] = []
    for (let i = 0; i < 10; i++) {
      handCards.push(makeMoney(1))
    }
    players[0].hand = handCards

    const controlled: GameState = {
      ...state,
      players,
      currentPlayer: 0,
      phase: 'discard',
      actionsRemaining: 0,
    }

    const discards = chooseDiscards(controlled)
    expect(discards.length).toBe(3)
    // All discarded IDs must be from the hand
    const handIds = new Set(handCards.map(c => c.id))
    for (const id of discards) {
      expect(handIds.has(id)).toBe(true)
    }
  })
})
