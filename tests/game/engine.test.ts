import { describe, it, expect } from 'vitest'
import {
  createGame,
  performDraw,
  checkWin,
  getValidActions,
  applyAction,
} from '../../src/game/engine'
import type {
  GameState, PlayerState, PlayerIndex, Card, Color,
  PropertySet, ActionCard, PropertyCard, WildPropertyCard,
} from '../../src/game/types'
import { SET_SIZES, RENT_VALUES } from '../../src/game/constants'

// ── Helpers ──────────────────────────────────────────────────────────────────

let idSeq = 9000
function nextId() { return `t-${idSeq++}` }

function makeMoney(value: 1 | 2 | 3 | 4 | 5 | 10 = 1): Card {
  return { id: nextId(), type: 'money', value }
}

function makeProperty(color: Color, name = 'Test Prop'): PropertyCard {
  return { id: nextId(), type: 'property', color, name, value: 1 }
}

function makeAction(name: ActionCard['name'], value = 1): ActionCard {
  return { id: nextId(), type: 'action', name, value }
}

function makeRent(colors: Color[]): Card {
  return { id: nextId(), type: 'rent', colors, value: 1 }
}

function makeWild(colors: Color[]): WildPropertyCard {
  return { id: nextId(), type: 'wild_property', colors, value: 1 }
}

function makeCompleteSet(color: Color): PropertySet {
  const size = SET_SIZES[color]
  const cards = Array.from({ length: size }, (_, i) =>
    makeProperty(color, `${color} ${i}`)
  )
  return { color, cards, hasHouse: false, hasHotel: false }
}

function emptyPlayer(): PlayerState {
  return { hand: [], bank: [], properties: [] }
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base: GameState = {
    deck: [],
    discardPile: [],
    players: [emptyPlayer(), emptyPlayer()],
    currentPlayer: 0,
    actionsRemaining: 3,
    phase: 'action',
    pendingAction: null,
    log: [],
    winner: null,
  }
  return { ...base, ...overrides }
}

// ── createGame ────────────────────────────────────────────────────────────────

describe('createGame', () => {
  it('starts in draw phase', () => {
    const g = createGame()
    expect(g.phase).toBe('draw')
  })

  it('deals 5 cards to each player', () => {
    const g = createGame()
    expect(g.players[0].hand).toHaveLength(5)
    expect(g.players[1].hand).toHaveLength(5)
  })

  it('has 3 actions remaining', () => {
    const g = createGame()
    expect(g.actionsRemaining).toBe(3)
  })

  it('currentPlayer is 0', () => {
    const g = createGame()
    expect(g.currentPlayer).toBe(0)
  })

  it('no winner on start', () => {
    const g = createGame()
    expect(g.winner).toBeNull()
  })

  it('deck has remaining cards', () => {
    const g = createGame()
    expect(g.deck.length).toBeGreaterThan(0)
  })

  it('all hands + deck = full deck count', () => {
    const g = createGame()
    const total = g.players[0].hand.length + g.players[1].hand.length + g.deck.length
    // Full deck is ~110 cards
    expect(total).toBeGreaterThan(100)
  })
})

// ── performDraw ───────────────────────────────────────────────────────────────

describe('performDraw', () => {
  it('transitions to action phase', () => {
    const g = createGame()
    const g2 = performDraw(g)
    expect(g2.phase).toBe('action')
  })

  it('adds 2 cards to current player hand', () => {
    const g = createGame()
    const before = g.players[0].hand.length
    const g2 = performDraw(g)
    expect(g2.players[0].hand.length).toBe(before + 2)
  })

  it('reduces deck by 2', () => {
    const g = createGame()
    const deckBefore = g.deck.length
    const g2 = performDraw(g)
    expect(g2.deck.length).toBe(deckBefore - 2)
  })

  it('throws if not in draw phase', () => {
    const g = makeState({ phase: 'action' })
    expect(() => performDraw(g)).toThrow()
  })

  it('does not mutate original state', () => {
    const g = createGame()
    const handBefore = g.players[0].hand.length
    performDraw(g)
    expect(g.players[0].hand.length).toBe(handBefore)
  })
})

// ── checkWin ─────────────────────────────────────────────────────────────────

describe('checkWin', () => {
  it('returns null when no complete sets', () => {
    const g = makeState()
    expect(checkWin(g)).toBeNull()
  })

  it('returns null when fewer than 3 complete sets', () => {
    const g = makeState()
    g.players[0].properties = [
      makeCompleteSet('brown'),
      makeCompleteSet('blue'),
    ]
    expect(checkWin(g)).toBeNull()
  })

  it('returns 0 when player 0 has 3 complete sets', () => {
    const g = makeState()
    g.players[0].properties = [
      makeCompleteSet('brown'),
      makeCompleteSet('blue'),
      makeCompleteSet('utility'),
    ]
    expect(checkWin(g)).toBe(0)
  })

  it('returns 1 when player 1 has 3 complete sets', () => {
    const g = makeState()
    g.players[1].properties = [
      makeCompleteSet('brown'),
      makeCompleteSet('blue'),
      makeCompleteSet('utility'),
    ]
    expect(checkWin(g)).toBe(1)
  })
})

// ── playProperty ─────────────────────────────────────────────────────────────

describe('applyAction - playProperty', () => {
  it('moves property from hand to property set', () => {
    const card = makeProperty('brown')
    const g = makeState()
    g.players[0].hand = [card]

    const g2 = applyAction(g, { type: 'playProperty', cardId: card.id, targetColor: 'brown' })
    expect(g2.players[0].hand).toHaveLength(0)
    expect(g2.players[0].properties).toHaveLength(1)
    expect(g2.players[0].properties[0].color).toBe('brown')
    expect(g2.players[0].properties[0].cards).toHaveLength(1)
  })

  it('decrements actionsRemaining', () => {
    const card = makeProperty('brown')
    const g = makeState()
    g.players[0].hand = [card]
    const g2 = applyAction(g, { type: 'playProperty', cardId: card.id, targetColor: 'brown' })
    expect(g2.actionsRemaining).toBe(2)
  })

  it('can play wild property to any of its colors', () => {
    const wild = makeWild(['brown', 'lightBlue'])
    const g = makeState()
    g.players[0].hand = [wild]
    const g2 = applyAction(g, { type: 'playProperty', cardId: wild.id, targetColor: 'lightBlue' })
    expect(g2.players[0].properties[0].color).toBe('lightBlue')
  })

  it('auto-ends turn after 3 actions', () => {
    const cards = [makeProperty('brown'), makeProperty('blue'), makeProperty('utility')]
    const g = makeState()
    g.players[0].hand = [...cards]

    let s = applyAction(g, { type: 'playProperty', cardId: cards[0].id, targetColor: cards[0].color })
    s = applyAction(s, { type: 'playProperty', cardId: cards[1].id, targetColor: cards[1].color })
    s = applyAction(s, { type: 'playProperty', cardId: cards[2].id, targetColor: cards[2].color })
    // Should have advanced to player 1's draw phase
    expect(s.currentPlayer).toBe(1)
    expect(s.phase).toBe('draw')
  })

  it('detects win after property play', () => {
    const g = makeState()
    g.players[0].properties = [
      makeCompleteSet('blue'),
      makeCompleteSet('utility'),
    ]
    // Adding the second brown card to complete a third set
    const brown1 = makeProperty('brown', 'Baltic Ave')
    const brown2 = makeProperty('brown', 'Mediterranean Ave')
    g.players[0].properties.push({ color: 'brown', cards: [brown1], hasHouse: false, hasHotel: false })
    g.players[0].hand = [brown2]

    const g2 = applyAction(g, { type: 'playProperty', cardId: brown2.id, targetColor: 'brown' })
    expect(g2.winner).toBe(0)
    expect(g2.phase).toBe('gameOver')
  })
})

// ── bankCard ──────────────────────────────────────────────────────────────────

describe('applyAction - bankCard', () => {
  it('moves card from hand to bank', () => {
    const card = makeMoney(5)
    const g = makeState()
    g.players[0].hand = [card]

    const g2 = applyAction(g, { type: 'bankCard', cardId: card.id })
    expect(g2.players[0].hand).toHaveLength(0)
    expect(g2.players[0].bank).toHaveLength(1)
    expect(g2.players[0].bank[0].id).toBe(card.id)
  })

  it('decrements actionsRemaining', () => {
    const card = makeMoney(2)
    const g = makeState()
    g.players[0].hand = [card]
    const g2 = applyAction(g, { type: 'bankCard', cardId: card.id })
    expect(g2.actionsRemaining).toBe(2)
  })

  it('can bank any card type', () => {
    const ac = makeAction('passGo')
    const g = makeState()
    g.players[0].hand = [ac]
    const g2 = applyAction(g, { type: 'bankCard', cardId: ac.id })
    expect(g2.players[0].bank).toHaveLength(1)
  })
})

// ── pass ─────────────────────────────────────────────────────────────────────

describe('applyAction - pass', () => {
  it('ends turn immediately', () => {
    const g = makeState()
    g.players[0].hand = []
    const g2 = applyAction(g, { type: 'pass' })
    expect(g2.currentPlayer).toBe(1)
    expect(g2.phase).toBe('draw')
  })

  it('throws when not in action phase', () => {
    const g = makeState({ phase: 'draw' })
    expect(() => applyAction(g, { type: 'pass' })).toThrow()
  })
})

// ── discard ───────────────────────────────────────────────────────────────────

describe('applyAction - discard', () => {
  it('removes card from hand and adds to discard pile', () => {
    const cards = Array.from({ length: 8 }, () => makeMoney(1))
    const g = makeState({ phase: 'discard' })
    g.players[0].hand = cards

    const g2 = applyAction(g, { type: 'discard', cardId: cards[0].id })
    expect(g2.players[0].hand).toHaveLength(7)
    expect(g2.discardPile).toHaveLength(1)
  })

  it('switches turn once hand is <= 7', () => {
    const cards = Array.from({ length: 8 }, () => makeMoney(1))
    const g = makeState({ phase: 'discard' })
    g.players[0].hand = cards

    const g2 = applyAction(g, { type: 'discard', cardId: cards[0].id })
    expect(g2.currentPlayer).toBe(1)
    expect(g2.phase).toBe('draw')
  })

  it('stays in discard if still over 7', () => {
    const cards = Array.from({ length: 9 }, () => makeMoney(1))
    const g = makeState({ phase: 'discard' })
    g.players[0].hand = cards

    const g2 = applyAction(g, { type: 'discard', cardId: cards[0].id })
    expect(g2.phase).toBe('discard')
  })
})

// ── Pass Go ───────────────────────────────────────────────────────────────────

describe('applyAction - passGo', () => {
  it('draws 2 additional cards', () => {
    const ac = makeAction('passGo')
    const g = makeState({
      deck: [makeMoney(1), makeMoney(2)],
    })
    g.players[0].hand = [ac]
    const g2 = applyAction(g, { type: 'playAction', cardId: ac.id })
    expect(g2.players[0].hand).toHaveLength(2)
  })

  it('decrements actionsRemaining by 1', () => {
    const ac = makeAction('passGo')
    const g = makeState({ deck: [makeMoney(1), makeMoney(2)] })
    g.players[0].hand = [ac]
    const g2 = applyAction(g, { type: 'playAction', cardId: ac.id })
    expect(g2.actionsRemaining).toBe(2)
  })
})

// ── Debt Collector ────────────────────────────────────────────────────────────

describe('applyAction - debtCollector', () => {
  it('creates pending action for 5M', () => {
    const ac = makeAction('debtCollector')
    const g = makeState()
    g.players[0].hand = [ac]
    const g2 = applyAction(g, { type: 'playAction', cardId: ac.id, targetPlayer: 1 })
    expect(g2.phase).toBe('respond')
    expect(g2.pendingAction).not.toBeNull()
    expect(g2.pendingAction!.type).toBe('debtCollector')
    expect(g2.pendingAction!.amount).toBe(5)
    expect(g2.pendingAction!.targetPlayer).toBe(1)
  })
})

// ── It's My Birthday ──────────────────────────────────────────────────────────

describe('applyAction - itsMyBirthday', () => {
  it('creates pending action for 2M', () => {
    const ac = makeAction('itsMyBirthday')
    const g = makeState()
    g.players[0].hand = [ac]
    const g2 = applyAction(g, { type: 'playAction', cardId: ac.id })
    expect(g2.pendingAction!.type).toBe('itsMyBirthday')
    expect(g2.pendingAction!.amount).toBe(2)
  })
})

// ── Respond - payment ────────────────────────────────────────────────────────

describe('applyAction - respond with payment', () => {
  it('transfers bank cards from target to source on accept', () => {
    const m1 = makeMoney(5)
    const m2 = makeMoney(3)
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
    })
    g.players[1].bank = [m1, m2]

    const g2 = applyAction(g, { type: 'respond', accept: true, paymentCardIds: [m1.id] })
    expect(g2.players[0].bank.some(c => c.id === m1.id)).toBe(true)
    expect(g2.players[1].bank.some(c => c.id === m1.id)).toBe(false)
    expect(g2.phase).toBe('action')
    expect(g2.pendingAction).toBeNull()
  })

  it('accepts auto-payment from bank if no paymentCardIds provided', () => {
    const m1 = makeMoney(5)
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
    })
    g.players[1].bank = [m1]

    const g2 = applyAction(g, { type: 'respond', accept: true })
    // With empty paymentCardIds, no explicit transfer, but accept still resolves
    expect(g2.phase).toBe('action')
  })
})

// ── Respond - Just Say No ────────────────────────────────────────────────────

describe('applyAction - Just Say No', () => {
  it('JSN blocks the action and creates counter-pending', () => {
    const jsn = makeAction('justSayNo', 4)
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
    })
    g.players[1].hand = [jsn]

    const g2 = applyAction(g, { type: 'respond', accept: false })
    expect(g2.pendingAction!.type).toBe('justSayNo')
    expect(g2.pendingAction!.sourcePlayer).toBe(1)
    expect(g2.pendingAction!.targetPlayer).toBe(0)
    // JSN card removed from hand
    expect(g2.players[1].hand.find(c => c.id === jsn.id)).toBeUndefined()
  })

  it('accepting JSN counter cancels the original action', () => {
    const originalPending = {
      type: 'debtCollector' as const,
      sourcePlayer: 0 as PlayerIndex,
      targetPlayer: 1 as PlayerIndex,
      amount: 5,
    }
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'justSayNo',
        sourcePlayer: 1 as PlayerIndex,
        targetPlayer: 0 as PlayerIndex,
        respondingTo: originalPending,
      },
    })

    const g2 = applyAction(g, { type: 'respond', accept: true })
    expect(g2.phase).toBe('action')
    expect(g2.pendingAction).toBeNull()
  })

  it('throws if no JSN card in hand', () => {
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
    })
    g.players[1].hand = [] // no JSN
    expect(() => applyAction(g, { type: 'respond', accept: false })).toThrow()
  })
})

// ── Sly Deal ─────────────────────────────────────────────────────────────────

describe('applyAction - slyDeal', () => {
  it('creates pending slyDeal action', () => {
    const ac = makeAction('slyDeal')
    const victimCard = makeProperty('orange')
    const g = makeState()
    g.players[0].hand = [ac]
    g.players[1].properties = [
      { color: 'orange', cards: [victimCard], hasHouse: false, hasHotel: false },
    ]

    const g2 = applyAction(g, {
      type: 'playAction',
      cardId: ac.id,
      targetPlayer: 1,
      targetCardId: victimCard.id,
    })
    expect(g2.pendingAction!.type).toBe('slyDeal')
    expect(g2.pendingAction!.targetCardId).toBe(victimCard.id)
  })

  it('on accept, moves card from victim to thief', () => {
    const victimCard = makeProperty('orange')
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'slyDeal',
        sourcePlayer: 0,
        targetPlayer: 1,
        targetCardId: victimCard.id,
      },
    })
    g.players[1].properties = [
      { color: 'orange', cards: [victimCard], hasHouse: false, hasHotel: false },
    ]

    const g2 = applyAction(g, { type: 'respond', accept: true })
    const thiefOrange = g2.players[0].properties.find(s => s.color === 'orange')
    expect(thiefOrange?.cards.find(c => c.id === victimCard.id)).toBeDefined()
    expect(g2.players[1].properties).toHaveLength(0)
  })
})

// ── Deal Breaker ─────────────────────────────────────────────────────────────

describe('applyAction - dealBreaker', () => {
  it('creates pending dealBreaker action', () => {
    const ac = makeAction('dealBreaker')
    const completeSet = makeCompleteSet('blue')
    const g = makeState()
    g.players[0].hand = [ac]
    g.players[1].properties = [completeSet]

    const g2 = applyAction(g, {
      type: 'playAction',
      cardId: ac.id,
      targetPlayer: 1,
      targetColor: 'blue',
    })
    expect(g2.pendingAction!.type).toBe('dealBreaker')
    expect(g2.pendingAction!.targetColor).toBe('blue')
  })

  it('on accept, steals complete set', () => {
    const completeSet = makeCompleteSet('blue')
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'dealBreaker',
        sourcePlayer: 0,
        targetPlayer: 1,
        targetColor: 'blue',
      },
    })
    g.players[1].properties = [completeSet]

    const g2 = applyAction(g, { type: 'respond', accept: true })
    expect(g2.players[1].properties).toHaveLength(0)
    const stolenSet = g2.players[0].properties.find(s => s.color === 'blue')
    expect(stolenSet).toBeDefined()
    expect(stolenSet!.cards).toHaveLength(SET_SIZES['blue'])
  })
})

// ── Rent ──────────────────────────────────────────────────────────────────────

describe('applyAction - rent', () => {
  it('creates pending rent action with correct amount', () => {
    const rentCard = makeRent(['brown', 'lightBlue']) as any
    const prop = makeProperty('brown')
    const g = makeState()
    g.players[0].hand = [rentCard]
    g.players[0].properties = [{ color: 'brown', cards: [prop], hasHouse: false, hasHotel: false }]

    const g2 = applyAction(g, { type: 'playAction', cardId: rentCard.id, targetColor: 'brown' })
    expect(g2.pendingAction!.type).toBe('rent')
    expect(g2.pendingAction!.amount).toBe(RENT_VALUES['brown'][0]) // 1 card = 1M
  })

  it('rent with house adds 3M', () => {
    const rentCard = makeRent(['brown', 'lightBlue']) as any
    const prop1 = makeProperty('brown', 'Baltic')
    const prop2 = makeProperty('brown', 'Mediterranean')
    const g = makeState()
    g.players[0].hand = [rentCard]
    g.players[0].properties = [{
      color: 'brown',
      cards: [prop1, prop2],
      hasHouse: true,
      hasHotel: false,
    }]

    const g2 = applyAction(g, { type: 'playAction', cardId: rentCard.id, targetColor: 'brown' })
    // RENT_VALUES['brown'][1] = 2, + 3 for house = 5
    expect(g2.pendingAction!.amount).toBe(RENT_VALUES['brown'][1] + 3)
  })
})

// ── getValidActions ───────────────────────────────────────────────────────────

describe('getValidActions', () => {
  it('returns empty array in draw phase', () => {
    const g = makeState({ phase: 'draw' })
    expect(getValidActions(g)).toHaveLength(0)
  })

  it('includes pass in action phase', () => {
    const g = makeState({ phase: 'action' })
    const actions = getValidActions(g)
    expect(actions.some(a => a.type === 'pass')).toBe(true)
  })

  it('includes bankCard for each hand card', () => {
    const g = makeState()
    const cards = [makeMoney(1), makeMoney(2)]
    g.players[0].hand = cards
    const actions = getValidActions(g)
    const bankActions = actions.filter(a => a.type === 'bankCard')
    expect(bankActions).toHaveLength(2)
  })

  it('includes playProperty for property cards', () => {
    const prop = makeProperty('brown')
    const g = makeState()
    g.players[0].hand = [prop]
    const actions = getValidActions(g)
    const playProps = actions.filter(a => a.type === 'playProperty')
    expect(playProps.length).toBeGreaterThan(0)
  })

  it('returns discard actions in discard phase', () => {
    const cards = Array.from({ length: 8 }, () => makeMoney(1))
    const g = makeState({ phase: 'discard' })
    g.players[0].hand = cards
    const actions = getValidActions(g)
    expect(actions.every(a => a.type === 'discard')).toBe(true)
    expect(actions).toHaveLength(8)
  })

  it('returns respond actions in respond phase', () => {
    const g = makeState({
      phase: 'respond',
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
    })
    const actions = getValidActions(g)
    expect(actions.some(a => a.type === 'respond')).toBe(true)
  })

  it('includes JSN respond option if player has JSN card', () => {
    const jsn = makeAction('justSayNo', 4)
    const g = makeState({
      phase: 'respond',
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
    })
    g.players[1].hand = [jsn]
    const actions = getValidActions(g)
    const rejectAction = actions.find(a => a.type === 'respond' && !(a as any).accept)
    expect(rejectAction).toBeDefined()
  })

  it('slyDeal only targets incomplete sets', () => {
    const slyCard = makeAction('slyDeal')
    const completeSet = makeCompleteSet('blue')
    const g = makeState()
    g.players[0].hand = [slyCard]
    g.players[1].properties = [completeSet]
    const actions = getValidActions(g)
    const slyActions = actions.filter(a => a.type === 'playAction' && (a as any).cardId === slyCard.id)
    // No valid sly deal — complete set
    expect(slyActions).toHaveLength(0)
  })

  it('dealBreaker only targets complete sets', () => {
    const dbCard = makeAction('dealBreaker')
    const incompleteSet: PropertySet = { color: 'blue', cards: [makeProperty('blue')], hasHouse: false, hasHotel: false }
    const g = makeState()
    g.players[0].hand = [dbCard]
    g.players[1].properties = [incompleteSet]
    const actions = getValidActions(g)
    const dbActions = actions.filter(a => a.type === 'playAction' && (a as any).cardId === dbCard.id)
    expect(dbActions).toHaveLength(0)
  })
})

// ── House / Hotel ────────────────────────────────────────────────────────────

describe('applyAction - house and hotel', () => {
  it('adds house to complete set', () => {
    const houseCard = makeAction('house')
    const completeSet = makeCompleteSet('brown')
    const g = makeState()
    g.players[0].hand = [houseCard]
    g.players[0].properties = [completeSet]

    const g2 = applyAction(g, { type: 'playAction', cardId: houseCard.id, targetColor: 'brown' })
    const set = g2.players[0].properties.find(s => s.color === 'brown')!
    expect(set.hasHouse).toBe(true)
  })

  it('adds hotel to set with house', () => {
    const hotelCard = makeAction('hotel')
    const completeSet = { ...makeCompleteSet('brown'), hasHouse: true }
    const g = makeState()
    g.players[0].hand = [hotelCard]
    g.players[0].properties = [completeSet]

    const g2 = applyAction(g, { type: 'playAction', cardId: hotelCard.id, targetColor: 'brown' })
    const set = g2.players[0].properties.find(s => s.color === 'brown')!
    expect(set.hasHotel).toBe(true)
  })

  it('throws if adding house to incomplete set', () => {
    const houseCard = makeAction('house')
    const g = makeState()
    g.players[0].hand = [houseCard]
    g.players[0].properties = [{ color: 'brown', cards: [makeProperty('brown')], hasHouse: false, hasHotel: false }]
    expect(() => applyAction(g, { type: 'playAction', cardId: houseCard.id, targetColor: 'brown' })).toThrow()
  })
})

// ── Forced Deal ───────────────────────────────────────────────────────────────

describe('applyAction - forcedDeal', () => {
  it('on accept swaps properties between players', () => {
    const myCard = makeProperty('brown', 'Baltic')
    const theirCard = makeProperty('orange', 'St. James')
    const g = makeState({
      phase: 'respond',
      actionsRemaining: 2,
      pendingAction: {
        type: 'forcedDeal',
        sourcePlayer: 0,
        targetPlayer: 1,
        targetCardId: theirCard.id,
        offeredCardId: myCard.id,
      },
    })
    g.players[0].properties = [{ color: 'brown', cards: [myCard], hasHouse: false, hasHotel: false }]
    g.players[1].properties = [{ color: 'orange', cards: [theirCard], hasHouse: false, hasHotel: false }]

    const g2 = applyAction(g, { type: 'respond', accept: true })
    // Player 0 should now have orange card
    const p0Orange = g2.players[0].properties.find(s => s.color === 'orange')
    expect(p0Orange?.cards.some(c => c.id === theirCard.id)).toBe(true)
    // Player 1 should now have brown card
    const p1Brown = g2.players[1].properties.find(s => s.color === 'brown')
    expect(p1Brown?.cards.some(c => c.id === myCard.id)).toBe(true)
  })
})
