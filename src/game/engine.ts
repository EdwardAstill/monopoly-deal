import type {
  GameState, PlayerState, PlayerIndex, Card, Color,
  PropertySet, PropertyCard, WildPropertyCard, ActionCard, RentCard,
  Action, PendingAction, PlayPropertyAction, PlayActionAction,
  BankCardAction, DiscardAction, RespondAction, MoveWildAction,
} from './types'
import { SET_SIZES, RENT_VALUES, COLOR_DISPLAY } from './constants'
import { createDeck, shuffle, drawCards } from './deck'

// ── Helpers ──

const ACTION_NAMES: Record<string, string> = {
  dealBreaker: 'Deal Breaker', justSayNo: 'Just Say No', slyDeal: 'Sly Deal',
  forcedDeal: 'Forced Deal', debtCollector: 'Debt Collector',
  itsMyBirthday: "It's My Birthday", passGo: 'Pass Go',
  house: 'House', hotel: 'Hotel', doubleRent: 'Double Rent',
}

function cardName(card: Card): string {
  if (card.type === 'property') return (card as PropertyCard).name
  if (card.type === 'wild_property') {
    const wc = card as WildPropertyCard
    if (wc.colors.length > 2) return 'Rainbow Wild'
    return `${COLOR_DISPLAY[wc.colors[0]].label}/${COLOR_DISPLAY[wc.colors[1]].label} Wild`
  }
  if (card.type === 'money') return `$${card.value}M`
  if (card.type === 'action') return ACTION_NAMES[(card as ActionCard).name] ?? (card as ActionCard).name
  if (card.type === 'rent') {
    const rc = card as RentCard
    if (rc.colors.length > 2) return 'Wild Rent'
    return `${COLOR_DISPLAY[rc.colors[0]].label}/${COLOR_DISPLAY[rc.colors[1]].label} Rent`
  }
  return 'card'
}

function colorLabel(color: Color): string {
  return COLOR_DISPLAY[color].label
}

function removeCard(cards: Card[], cardId: string): { card: Card; remaining: Card[] } {
  const idx = cards.findIndex(c => c.id === cardId)
  if (idx === -1) throw new Error(`Card ${cardId} not found`)
  const card = cards[idx]
  const remaining = [...cards.slice(0, idx), ...cards.slice(idx + 1)]
  return { card, remaining }
}

function isSetComplete(set: PropertySet): boolean {
  if (set.cards.length < SET_SIZES[set.color]) return false
  // A complete set must have at least one natural (non-wild) property card
  return set.cards.some(c => c.type === 'property')
}

function countCompleteSets(properties: PropertySet[]): number {
  return properties.filter(isSetComplete).length
}

function addToPropertySet(
  properties: PropertySet[],
  card: PropertyCard | WildPropertyCard,
  color: Color,
): PropertySet[] {
  const props = properties.map(s => ({ ...s, cards: [...s.cards] }))
  const existing = props.find(s => s.color === color && !isSetComplete(s))
    ?? props.find(s => s.color === color)
  if (existing) {
    existing.cards.push(card)
  } else {
    props.push({ color, cards: [card], hasHouse: false, hasHotel: false })
  }
  return props
}

function removePropertyCard(
  properties: PropertySet[],
  cardId: string,
): { card: PropertyCard | WildPropertyCard; properties: PropertySet[] } {
  for (const set of properties) {
    const idx = set.cards.findIndex(c => c.id === cardId)
    if (idx !== -1) {
      const card = set.cards[idx]
      const newProps = properties.map(s => {
        if (s !== set) return { ...s, cards: [...s.cards] }
        const newCards = [...s.cards.slice(0, idx), ...s.cards.slice(idx + 1)]
        return { ...s, cards: newCards }
      }).filter(s => s.cards.length > 0)
      return { card, properties: newProps }
    }
  }
  throw new Error(`Property card ${cardId} not found`)
}

function clonePlayers(players: [PlayerState, PlayerState]): [PlayerState, PlayerState] {
  return structuredClone(players)
}

function otherPlayer(p: PlayerIndex): PlayerIndex {
  return (p === 0 ? 1 : 0) as PlayerIndex
}

function getRentAmount(properties: PropertySet[], color: Color): number {
  const rentTable = RENT_VALUES[color]
  const set = properties.find(s => s.color === color)
  if (!set || set.cards.length === 0) return 0
  const count = Math.min(set.cards.length, rentTable.length)
  let amount = rentTable[count - 1]
  if (set.hasHouse) amount += 3
  if (set.hasHotel) amount += 4
  return amount
}


function ensureDeck(state: GameState): GameState {
  if (state.deck.length > 0) return state
  if (state.discardPile.length === 0) return state
  return {
    ...state,
    deck: shuffle(state.discardPile),
    discardPile: [],
  }
}

// ── Core API ──

export function createGame(): GameState {
  const deck = shuffle(createDeck())
  const hand0 = deck.slice(0, 5)
  const hand1 = deck.slice(5, 10)
  const remaining = deck.slice(10)

  return {
    deck: remaining,
    discardPile: [],
    players: [
      { hand: hand0, bank: [], properties: [] },
      { hand: hand1, bank: [], properties: [] },
    ],
    currentPlayer: 0,
    actionsRemaining: 3,
    phase: 'draw',
    pendingAction: null,
    log: [],
    winner: null,
  }
}

export function performDraw(state: GameState): GameState {
  if (state.phase !== 'draw') throw new Error('Not in draw phase')
  const s = ensureDeck(state)
  const cp = s.currentPlayer
  // Official rule: if hand is empty at start of turn, draw 5 instead of 2
  const drawCount = s.players[cp].hand.length === 0 ? 5 : 2
  const result = drawCards(s.deck, s.discardPile, drawCount)
  const players = clonePlayers(s.players)
  players[cp].hand.push(...result.drawn)

  return {
    ...s,
    deck: result.deck,
    discardPile: result.discardPile,
    players,
    phase: 'action',
    actionsRemaining: 3,
    log: [...s.log, { player: s.currentPlayer, message: `Drew ${result.drawn.length} cards` }],
  }
}

export function checkWin(state: GameState): PlayerIndex | null {
  for (let i = 0; i < 2; i++) {
    if (countCompleteSets(state.players[i].properties) >= 3) {
      return i as PlayerIndex
    }
  }
  return null
}

function maybeEndTurn(state: GameState): GameState {
  if (state.actionsRemaining > 0) return state
  return startEndTurn(state)
}

function startEndTurn(state: GameState): GameState {
  const player = state.players[state.currentPlayer]
  if (player.hand.length > 7) {
    return { ...state, phase: 'discard' }
  }
  return switchTurn(state)
}

function switchTurn(state: GameState): GameState {
  const next = otherPlayer(state.currentPlayer)
  return {
    ...state,
    currentPlayer: next,
    phase: 'draw',
    actionsRemaining: 3,
    pendingAction: null,
  }
}

function withWinCheck(state: GameState): GameState {
  const winner = checkWin(state)
  if (winner !== null) {
    return { ...state, winner, phase: 'gameOver' }
  }
  return state
}

// ── Action application ──

export function applyAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'playProperty': return applyPlayProperty(state, action)
    case 'bankCard': return applyBankCard(state, action)
    case 'playAction': return applyPlayAction(state, action)
    case 'pass': return applyPass(state)
    case 'discard': return applyDiscard(state, action)
    case 'respond': return applyRespond(state, action)
    case 'moveWild': return applyMoveWild(state, action)
  }
}

function applyMoveWild(state: GameState, action: MoveWildAction): GameState {
  if (state.phase !== 'action') throw new Error('Not in action phase')
  const cp = state.currentPlayer
  const players = clonePlayers(state.players)
  const { card, properties } = removePropertyCard(players[cp].properties, action.cardId)
  if (card.type !== 'wild_property') throw new Error('Not a wild property card')
  players[cp].properties = addToPropertySet(properties, card, action.targetColor)
  const log = [...state.log, {
    player: cp,
    message: `Moved wild card to ${colorLabel(action.targetColor)}`,
  }]
  return withWinCheck({ ...state, players, log })
}

function applyPlayProperty(state: GameState, action: PlayPropertyAction): GameState {
  if (state.phase !== 'action') throw new Error('Not in action phase')
  const players = clonePlayers(state.players)
  const cp = state.currentPlayer
  const { card, remaining } = removeCard(players[cp].hand, action.cardId)

  if (card.type !== 'property' && card.type !== 'wild_property') {
    throw new Error('Not a property card')
  }

  players[cp].hand = remaining
  players[cp].properties = addToPropertySet(
    players[cp].properties,
    card as PropertyCard | WildPropertyCard,
    action.targetColor,
  )

  const next: GameState = {
    ...state,
    players,
    actionsRemaining: state.actionsRemaining - 1,
    log: [...state.log, { player: cp, message: `Played ${cardName(card)} to ${colorLabel(action.targetColor)}` }],
  }
  return withWinCheck(maybeEndTurn(next))
}

function applyBankCard(state: GameState, action: BankCardAction): GameState {
  if (state.phase !== 'action') throw new Error('Not in action phase')
  const players = clonePlayers(state.players)
  const cp = state.currentPlayer
  const { card, remaining } = removeCard(players[cp].hand, action.cardId)
  players[cp].hand = remaining
  players[cp].bank.push(card)

  const next: GameState = {
    ...state,
    players,
    actionsRemaining: state.actionsRemaining - 1,
    log: [...state.log, { player: cp, message: `Banked ${cardName(card)} ($${card.value}M)` }],
  }
  return maybeEndTurn(next)
}

function applyPass(state: GameState): GameState {
  if (state.phase !== 'action') throw new Error('Not in action phase')
  return startEndTurn({ ...state, actionsRemaining: 0 })
}

function applyDiscard(state: GameState, action: DiscardAction): GameState {
  if (state.phase !== 'discard') throw new Error('Not in discard phase')
  const players = clonePlayers(state.players)
  const cp = state.currentPlayer
  const { card, remaining } = removeCard(players[cp].hand, action.cardId)
  players[cp].hand = remaining

  const newState: GameState = {
    ...state,
    players,
    discardPile: [...state.discardPile, card],
    log: [...state.log, { player: cp, message: `Discarded ${cardName(card)}` }],
  }

  if (players[cp].hand.length <= 7) {
    return switchTurn(newState)
  }
  return newState
}

function applyPlayAction(state: GameState, action: PlayActionAction): GameState {
  if (state.phase !== 'action') throw new Error('Not in action phase')
  const players = clonePlayers(state.players)
  const cp = state.currentPlayer
  const { card, remaining } = removeCard(players[cp].hand, action.cardId)
  players[cp].hand = remaining

  if (card.type !== 'action' && card.type !== 'rent') {
    throw new Error('Not an action/rent card')
  }

  let actionsUsed = 1
  let newDiscardPile = [...state.discardPile, card]
  let newDeck = [...state.deck]
  let newDiscardForDraw = newDiscardPile

  // Handle doubleRent — remove it from hand too, costs extra action
  let doubleMultiplier = 1
  if (action.doubleRentCardId) {
    const dr = removeCard(players[cp].hand, action.doubleRentCardId)
    players[cp].hand = dr.remaining
    newDiscardPile = [...newDiscardPile, dr.card]
    newDiscardForDraw = newDiscardPile
    actionsUsed = 2
    doubleMultiplier = 2
  }

  const actionsRemaining = state.actionsRemaining - actionsUsed

  if (card.type === 'rent') {
    const rentCard = card as RentCard
    const color = action.targetColor ?? rentCard.colors[0]
    const amount = getRentAmount(players[cp].properties, color) * doubleMultiplier
    const target = action.targetPlayer

    if (rentCard.colors.length === 2 && target !== undefined) {
      // Dual-color rent targets all opponents (just 1 in 2-player)
    }

    const targetPlayer = otherPlayer(cp)
    const pending: PendingAction = {
      type: 'rent',
      sourcePlayer: cp,
      targetPlayer,
      amount,
      targetColor: color,
    }

    return {
      ...state,
      deck: newDeck,
      discardPile: newDiscardPile,
      players,
      actionsRemaining,
      phase: 'respond',
      pendingAction: pending,
      log: [...state.log, { player: cp, message: `Charged $${amount}M rent on ${colorLabel(color)}${doubleMultiplier > 1 ? ' (doubled!)' : ''}` }],
    }
  }

  const actionCard = card as ActionCard

  switch (actionCard.name) {
    case 'passGo': {
      const drawResult = drawCards(newDeck, newDiscardForDraw, 2)
      players[cp].hand.push(...drawResult.drawn)
      const next: GameState = {
        ...state,
        deck: drawResult.deck,
        discardPile: drawResult.discardPile,
        players,
        actionsRemaining,
        log: [...state.log, { player: cp, message: `Played Pass Go — drew 2 cards` }],
      }
      return maybeEndTurn(next)
    }

    case 'debtCollector': {
      const target = action.targetPlayer ?? otherPlayer(cp)
      const pending: PendingAction = {
        type: 'debtCollector',
        sourcePlayer: cp,
        targetPlayer: target,
        amount: 5,
      }
      return {
        ...state,
        discardPile: newDiscardPile,
        players,
        actionsRemaining,
        phase: 'respond',
        pendingAction: pending,
        log: [...state.log, { player: cp, message: `Played Debt Collector — demanding $5M` }],
      }
    }

    case 'itsMyBirthday': {
      const target = otherPlayer(cp)
      const pending: PendingAction = {
        type: 'itsMyBirthday',
        sourcePlayer: cp,
        targetPlayer: target,
        amount: 2,
      }
      return {
        ...state,
        discardPile: newDiscardPile,
        players,
        actionsRemaining,
        phase: 'respond',
        pendingAction: pending,
        log: [...state.log, { player: cp, message: `Played It's My Birthday — collecting $2M` }],
      }
    }

    case 'slyDeal': {
      const target = action.targetPlayer ?? otherPlayer(cp)
      const pending: PendingAction = {
        type: 'slyDeal',
        sourcePlayer: cp,
        targetPlayer: target,
        targetCardId: action.targetCardId,
      }
      return {
        ...state,
        discardPile: newDiscardPile,
        players,
        actionsRemaining,
        phase: 'respond',
        pendingAction: pending,
        log: [...state.log, { player: cp, message: `Played Sly Deal — targeting a property` }],
      }
    }

    case 'forcedDeal': {
      const target = action.targetPlayer ?? otherPlayer(cp)
      const pending: PendingAction = {
        type: 'forcedDeal',
        sourcePlayer: cp,
        targetPlayer: target,
        targetCardId: action.targetCardId,
        offeredCardId: action.offeredCardId,
      }
      return {
        ...state,
        discardPile: newDiscardPile,
        players,
        actionsRemaining,
        phase: 'respond',
        pendingAction: pending,
        log: [...state.log, { player: cp, message: `Played Forced Deal — proposing a swap` }],
      }
    }

    case 'dealBreaker': {
      const target = action.targetPlayer ?? otherPlayer(cp)
      const pending: PendingAction = {
        type: 'dealBreaker',
        sourcePlayer: cp,
        targetPlayer: target,
        targetColor: action.targetColor,
      }
      return {
        ...state,
        discardPile: newDiscardPile,
        players,
        actionsRemaining,
        phase: 'respond',
        pendingAction: pending,
        log: [...state.log, { player: cp, message: `Played Deal Breaker on ${colorLabel(action.targetColor!)} set!` }],
      }
    }

    case 'house': {
      // Add house to a complete set (not railroad/utility)
      const color = action.targetColor!
      if (color === 'railroad' || color === 'utility') throw new Error('Cannot add house to railroad or utility')
      const setIdx = players[cp].properties.findIndex(
        s => s.color === color && isSetComplete(s) && !s.hasHouse
      )
      if (setIdx === -1) throw new Error('No valid set for house')
      players[cp].properties[setIdx] = {
        ...players[cp].properties[setIdx],
        hasHouse: true,
      }
      // House card goes to properties, not discard
      newDiscardPile = state.discardPile // undo the discard addition
      const next: GameState = {
        ...state,
        discardPile: newDiscardPile,
        players,
        actionsRemaining,
        log: [...state.log, { player: cp, message: `Added House to ${colorLabel(color)} (+$3M rent)` }],
      }
      return maybeEndTurn(next)
    }

    case 'hotel': {
      const color = action.targetColor!
      if (color === 'railroad' || color === 'utility') throw new Error('Cannot add hotel to railroad or utility')
      const setIdx = players[cp].properties.findIndex(
        s => s.color === color && isSetComplete(s) && s.hasHouse && !s.hasHotel
      )
      if (setIdx === -1) throw new Error('No valid set for hotel')
      players[cp].properties[setIdx] = {
        ...players[cp].properties[setIdx],
        hasHotel: true,
      }
      newDiscardPile = state.discardPile
      const next: GameState = {
        ...state,
        discardPile: newDiscardPile,
        players,
        actionsRemaining,
        log: [...state.log, { player: cp, message: `Added Hotel to ${colorLabel(color)} (+$4M rent)` }],
      }
      return maybeEndTurn(next)
    }

    case 'doubleRent': {
      // doubleRent is played alongside a rent card, handled above
      throw new Error('Double Rent must be played with a rent card via doubleRentCardId')
    }

    case 'justSayNo': {
      throw new Error('Just Say No can only be played as a response')
    }
  }

  return state
}

function applyRespond(state: GameState, action: RespondAction): GameState {
  if (state.phase !== 'respond') throw new Error('Not in respond phase')
  const pending = state.pendingAction
  if (!pending) throw new Error('No pending action')

  const players = clonePlayers(state.players)

  // Just Say No
  if (!action.accept && !action.paymentCardIds) {
    // Check if the responder has a Just Say No card
    const jsnIdx = players[pending.targetPlayer].hand.findIndex(
      c => c.type === 'action' && (c as ActionCard).name === 'justSayNo'
    )
    if (jsnIdx === -1) throw new Error('No Just Say No card')

    const jsnCard = players[pending.targetPlayer].hand[jsnIdx]
    players[pending.targetPlayer].hand.splice(jsnIdx, 1)

    // The original player can counter with their own JSN
    const counterPending: PendingAction = {
      type: 'justSayNo',
      sourcePlayer: pending.targetPlayer,
      targetPlayer: pending.sourcePlayer,
      respondingTo: pending,
    }

    return {
      ...state,
      players,
      discardPile: [...state.discardPile, jsnCard],
      pendingAction: counterPending,
      log: [...state.log, { player: pending.targetPlayer, message: `Played Just Say No! Blocked the ${pending.type}` }],
    }
  }

  // Accept (or pay)
  if (action.accept) {
    return resolveAccept(state, players, pending, action)
  }

  return state
}

function resolveAccept(
  state: GameState,
  players: [PlayerState, PlayerState],
  pending: PendingAction,
  action: RespondAction,
): GameState {
  const src = pending.sourcePlayer
  const tgt = pending.targetPlayer

  // If this is a JSN acceptance, it means the JSN chain resolved.
  // The person who accepted the JSN loses — meaning the JSN succeeded.
  if (pending.type === 'justSayNo') {
    // The original action is blocked. Return to action phase.
    const next: GameState = {
      ...state,
      players,
      phase: 'action',
      pendingAction: null,
      log: [...state.log, { player: tgt, message: `Accepted Just Say No — action blocked` }],
    }
    // Check if the current player still has actions
    if (state.actionsRemaining <= 0) return startEndTurn(next)
    return next
  }

  switch (pending.type) {
    case 'rent':
    case 'debtCollector':
    case 'itsMyBirthday': {
      // Target pays with selected cards
      const paymentIds = action.paymentCardIds ?? []
      for (const pid of paymentIds) {
        // Try bank first
        const bankIdx = players[tgt].bank.findIndex(c => c.id === pid)
        if (bankIdx !== -1) {
          const [card] = players[tgt].bank.splice(bankIdx, 1)
          players[src].bank.push(card)
          continue
        }
        // Try properties
        const { card, properties } = removePropertyCard(players[tgt].properties, pid)
        players[tgt].properties = properties
        // Property cards go to source's property area
        const color = card.type === 'property' ? card.color : (card as WildPropertyCard).colors[0]
        players[src].properties = addToPropertySet(players[src].properties, card, color)
        continue
      }
      break
    }

    case 'slyDeal': {
      const targetCardId = pending.targetCardId!
      // Verify card is in incomplete set
      const { card, properties } = removePropertyCard(players[tgt].properties, targetCardId)
      players[tgt].properties = properties
      // Determine color for the stolen card
      const color = card.type === 'property' ? card.color : (card as WildPropertyCard).colors[0]
      players[src].properties = addToPropertySet(players[src].properties, card, color)
      break
    }

    case 'forcedDeal': {
      const targetCardId = pending.targetCardId!
      const offeredCardId = pending.offeredCardId!

      const stolen = removePropertyCard(players[tgt].properties, targetCardId)
      players[tgt].properties = stolen.properties
      const offered = removePropertyCard(players[src].properties, offeredCardId)
      players[src].properties = offered.properties

      const stolenColor = stolen.card.type === 'property'
        ? stolen.card.color
        : (stolen.card as WildPropertyCard).colors[0]
      const offeredColor = offered.card.type === 'property'
        ? offered.card.color
        : (offered.card as WildPropertyCard).colors[0]

      players[src].properties = addToPropertySet(players[src].properties, stolen.card, stolenColor)
      players[tgt].properties = addToPropertySet(players[tgt].properties, offered.card, offeredColor)
      break
    }

    case 'dealBreaker': {
      const color = pending.targetColor!
      const setIdx = players[tgt].properties.findIndex(
        s => s.color === color && isSetComplete(s)
      )
      if (setIdx === -1) throw new Error('No complete set to break')
      const stolenSet = players[tgt].properties[setIdx]
      players[tgt].properties = [
        ...players[tgt].properties.slice(0, setIdx),
        ...players[tgt].properties.slice(setIdx + 1),
      ]
      players[src].properties.push({ ...stolenSet, cards: [...stolenSet.cards] })
      break
    }
  }

  const resolveMessages: Record<string, string> = {
    rent: `Paid $${pending.amount ?? 0}M rent for ${pending.targetColor ? colorLabel(pending.targetColor) : 'rent'}`,
    debtCollector: `Paid $${pending.amount ?? 0}M to Debt Collector`,
    itsMyBirthday: `Paid $${pending.amount ?? 0}M for birthday`,
    slyDeal: `Lost a property to Sly Deal`,
    forcedDeal: `Swapped properties via Forced Deal`,
    dealBreaker: `Lost their ${pending.targetColor ? colorLabel(pending.targetColor) : ''} set to Deal Breaker!`,
  }

  const next: GameState = {
    ...state,
    players,
    phase: 'action',
    pendingAction: null,
    log: [...state.log, { player: tgt, message: resolveMessages[pending.type] ?? `Accepted ${pending.type}` }],
  }

  const checked = withWinCheck(next)
  if (checked.phase === 'gameOver') return checked
  if (state.actionsRemaining <= 0) return startEndTurn(checked)
  return checked
}

// ── Valid actions ──

export function getValidActions(state: GameState): Action[] {
  const actions: Action[] = []
  const cp = state.currentPlayer
  const player = state.players[cp]
  const opponent = state.players[otherPlayer(cp)]

  if (state.phase === 'discard') {
    for (const card of player.hand) {
      actions.push({ type: 'discard', cardId: card.id })
    }
    return actions
  }

  if (state.phase === 'respond') {
    if (!state.pendingAction) return []
    const tgt = state.pendingAction.targetPlayer
    const responder = state.players[tgt]

    // Accept
    const acceptAction: RespondAction = { type: 'respond', accept: true }
    actions.push(acceptAction)

    // Just Say No
    const hasJSN = responder.hand.some(
      c => c.type === 'action' && (c as ActionCard).name === 'justSayNo'
    )
    if (hasJSN) {
      actions.push({ type: 'respond', accept: false })
    }

    return actions
  }

  if (state.phase !== 'action') return []

  // Pass
  actions.push({ type: 'pass' })

  for (const card of player.hand) {
    // Bank any card
    actions.push({ type: 'bankCard', cardId: card.id })

    // Play property
    if (card.type === 'property') {
      actions.push({ type: 'playProperty', cardId: card.id, targetColor: card.color })
    }
    if (card.type === 'wild_property') {
      for (const color of (card as WildPropertyCard).colors) {
        actions.push({ type: 'playProperty', cardId: card.id, targetColor: color })
      }
    }

    // Play action cards
    if (card.type === 'action') {
      const ac = card as ActionCard
      switch (ac.name) {
        case 'passGo':
          actions.push({ type: 'playAction', cardId: card.id })
          break
        case 'debtCollector':
          actions.push({ type: 'playAction', cardId: card.id, targetPlayer: otherPlayer(cp) })
          break
        case 'itsMyBirthday':
          actions.push({ type: 'playAction', cardId: card.id })
          break
        case 'slyDeal': {
          // Can steal from opponent's incomplete sets
          for (const set of opponent.properties) {
            if (!isSetComplete(set)) {
              for (const propCard of set.cards) {
                actions.push({
                  type: 'playAction',
                  cardId: card.id,
                  targetPlayer: otherPlayer(cp),
                  targetCardId: propCard.id,
                })
              }
            }
          }
          break
        }
        case 'forcedDeal': {
          // Need own property from incomplete set and opponent's incomplete set property
          const myProps: (PropertyCard | WildPropertyCard)[] = []
          for (const set of player.properties) {
            if (!isSetComplete(set)) {
              for (const p of set.cards) myProps.push(p)
            }
          }
          for (const set of opponent.properties) {
            if (!isSetComplete(set)) {
              for (const propCard of set.cards) {
                for (const myProp of myProps) {
                  actions.push({
                    type: 'playAction',
                    cardId: card.id,
                    targetPlayer: otherPlayer(cp),
                    targetCardId: propCard.id,
                    offeredCardId: myProp.id,
                  })
                }
              }
            }
          }
          break
        }
        case 'dealBreaker': {
          for (const set of opponent.properties) {
            if (isSetComplete(set)) {
              actions.push({
                type: 'playAction',
                cardId: card.id,
                targetPlayer: otherPlayer(cp),
                targetColor: set.color,
              })
            }
          }
          break
        }
        case 'house': {
          for (const set of player.properties) {
            if (isSetComplete(set) && !set.hasHouse && set.color !== 'railroad' && set.color !== 'utility') {
              actions.push({ type: 'playAction', cardId: card.id, targetColor: set.color })
            }
          }
          break
        }
        case 'hotel': {
          for (const set of player.properties) {
            if (isSetComplete(set) && set.hasHouse && !set.hasHotel && set.color !== 'railroad' && set.color !== 'utility') {
              actions.push({ type: 'playAction', cardId: card.id, targetColor: set.color })
            }
          }
          break
        }
        case 'doubleRent':
          // Handled with rent cards
          break
        case 'justSayNo':
          // Only playable as response
          break
      }
    }

    // Rent cards
    if (card.type === 'rent') {
      const rc = card as RentCard
      for (const color of rc.colors) {
        // Only charge rent if we have properties of that color
        if (player.properties.some(s => s.color === color)) {
          actions.push({
            type: 'playAction',
            cardId: card.id,
            targetColor: color,
          })
          // With double rent
          const drCard = player.hand.find(
            c => c.id !== card.id && c.type === 'action' && (c as ActionCard).name === 'doubleRent'
          )
          if (drCard && state.actionsRemaining >= 2) {
            actions.push({
              type: 'playAction',
              cardId: card.id,
              targetColor: color,
              doubleRentCardId: drCard.id,
            })
          }
        }
      }
    }
  }

  return actions
}
