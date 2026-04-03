import type { GameState, Action, RespondAction, Card, ActionCard, PlayPropertyAction, PlayActionAction } from './types'
import { SET_SIZES, RENT_VALUES } from './constants'
import { getValidActions } from './engine'

function scoreAction(state: GameState, action: Action): number {
  const cp = state.currentPlayer
  const player = state.players[cp]

  if (action.type === 'pass') return 1

  if (action.type === 'bankCard') return 15

  if (action.type === 'playProperty') {
    const pa = action as PlayPropertyAction
    const color = pa.targetColor
    const setSize = SET_SIZES[color]
    const existing = player.properties.find(s => s.color === color)
    const currentCount = existing ? existing.cards.length : 0
    const needed = setSize - currentCount
    // playing this card will bring count to currentCount+1
    if (needed === 1) return 100 // completes set
    if (needed === 2) return 60
    return 40
  }

  if (action.type === 'playAction') {
    const pa = action as PlayActionAction
    const card = player.hand.find(c => c.id === pa.cardId)
    if (!card) return 0
    if (card.type === 'action') {
      const ac = card as ActionCard
      switch (ac.name) {
        case 'dealBreaker': return 90
        case 'slyDeal': return 70
        case 'passGo': return 65
        case 'debtCollector': return 55
        case 'forcedDeal': return 50
        case 'itsMyBirthday': return 45
        case 'hotel': return 35
        case 'house': return 30
        case 'doubleRent': return 10
      }
    }
    if (card.type === 'rent') {
      const color = pa.targetColor
      if (!color) return 20
      const set = player.properties.find(s => s.color === color)
      const count = set ? set.cards.length : 0
      const rentTable = RENT_VALUES[color]
      const idx = Math.min(count - 1, rentTable.length - 1)
      const rentAmount = idx >= 0 ? rentTable[idx] : 0
      return 20 + rentAmount * 5
    }
    return 10
  }

  return 0
}

export function chooseAction(state: GameState): Action {
  const actions = getValidActions(state)
  let best = actions[0]
  let bestScore = -Infinity
  for (const action of actions) {
    const score = scoreAction(state, action)
    if (score > bestScore) {
      bestScore = score
      best = action
    }
  }
  return best
}

export function chooseResponse(state: GameState): RespondAction {
  if (!state.pendingAction) {
    return { type: 'respond', accept: true }
  }

  const pending = state.pendingAction
  const targetPlayer = pending.targetPlayer
  const responder = state.players[targetPlayer]

  const jsnCard = responder.hand.find(
    c => c.type === 'action' && (c as ActionCard).name === 'justSayNo'
  )

  // Use Just Say No for high-value threats
  const highValueThreats = ['dealBreaker', 'rent', 'debtCollector']
  if (jsnCard && highValueThreats.includes(pending.type)) {
    return { type: 'respond', accept: false }
  }

  // Accept and pay with cheapest cards first
  // Score cards for payment: prefer paying from bank first, then incomplete sets, then complete sets
  const amount = pending.amount ?? 0

  if (amount === 0) {
    return { type: 'respond', accept: true }
  }

  // Collect all payable cards with priority scores (lower = pay first)
  interface PayCard { card: Card; priority: number }
  const payable: PayCard[] = []

  for (const c of responder.bank) {
    payable.push({ card: c, priority: 1 }) // bank cards first
  }

  for (const set of responder.properties) {
    const setSize = SET_SIZES[set.color]
    const isComplete = set.cards.length >= setSize
    const priority = isComplete ? 3 : 2
    for (const c of set.cards) {
      payable.push({ card: c, priority })
    }
  }

  // Sort: bank first (priority 1), then incomplete sets (2), then complete (3), then by value ascending
  payable.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.card.value - b.card.value
  })

  // Pick cheapest cards until amount is covered
  const paymentCardIds: string[] = []
  let paid = 0
  for (const { card } of payable) {
    if (paid >= amount) break
    paymentCardIds.push(card.id)
    paid += card.value
  }

  return { type: 'respond', accept: true, paymentCardIds }
}

export function chooseDiscards(state: GameState): string[] {
  const cp = state.currentPlayer
  const player = state.players[cp]
  const hand = player.hand
  const excess = hand.length - 7
  if (excess <= 0) return []

  function cardScore(card: Card): number {
    let score = card.value

    if (card.type === 'action') {
      const ac = card as ActionCard
      if (ac.name === 'justSayNo') score += 15
      if (ac.name === 'dealBreaker') score += 10
    }

    if (card.type === 'property' || card.type === 'wild_property') {
      score += 5
      // Check if it's part of a near-complete set
      if (card.type === 'property') {
        const set = player.properties.find(s => s.color === (card as any).color)
        if (set) {
          const setSize = SET_SIZES[set.color]
          const needed = setSize - set.cards.length
          if (needed <= 1) score += 20 // near-complete or complete
        }
      }
    }

    return score
  }

  const scored = hand.map(card => ({ card, score: cardScore(card) }))
  scored.sort((a, b) => a.score - b.score) // ascending: lowest score discarded first

  return scored.slice(0, excess).map(s => s.card.id)
}
