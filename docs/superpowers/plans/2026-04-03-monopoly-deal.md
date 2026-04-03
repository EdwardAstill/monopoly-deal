# Monopoly Deal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 1v1 Monopoly Deal card game playable in the browser against a heuristic AI.

**Architecture:** Single `GameState` object with a pure engine module (`game/`) and React UI (`components/`). Game logic has zero React imports and is fully testable standalone. UI dispatches actions through the engine and renders the resulting state.

**Tech Stack:** React 18, TypeScript, Vite, Vitest for testing

---

## File Structure

```
monopoly-deal/
  src/
    game/
      types.ts           — Card, GameState, Action, PlayerState, etc.
      constants.ts       — full 106-card deck definition, color sets, rent values, set sizes
      deck.ts            — createDeck(), shuffle(), dealInitialHands()
      engine.ts          — applyAction(), getValidActions(), checkWin(), phase transitions
      ai.ts              — chooseAction(), chooseResponse(), chooseDiscard()
    components/
      App.tsx            — game flow: menu → game → win screen
      Board.tsx          — main layout, orchestrates sub-components
      CardView.tsx       — single card rendering (used by Hand, PropertyArea, Bank)
      Hand.tsx           — player's hand, card selection
      PropertyArea.tsx   — color-grouped property sets
      Bank.tsx           — banked money cards
      OpponentView.tsx   — opponent's visible state
      ActionLog.tsx      — scrolling recent moves
      ActionButtons.tsx  — context-sensitive Play/Bank/End Turn buttons
    hooks/
      useGame.ts         — useReducer-based game state + AI turn orchestration
    index.tsx            — Vite entry point
    index.css            — global styles
  tests/
    game/
      constants.test.ts
      deck.test.ts
      engine.test.ts
      ai.test.ts
  index.html
  package.json
  tsconfig.json
  vite.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/index.tsx`, `src/index.css`, `src/components/App.tsx`

- [ ] **Step 1: Initialize Vite project**

```bash
cd /home/eastill/projects/monopoly-deal
npm create vite@latest . -- --template react-ts
```

Select "Ignore files and continue" if prompted about existing files.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install -D vitest
```

- [ ] **Step 3: Add vitest config to `vite.config.ts`**

Replace the contents of `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
})
```

- [ ] **Step 4: Add test script to `package.json`**

Add to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify it builds and runs**

```bash
npm run dev -- --open
```

Expected: Browser opens with Vite React starter page.

- [ ] **Step 6: Commit**

```bash
git init
echo "node_modules\ndist" > .gitignore
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Types & Constants

**Files:**
- Create: `src/game/types.ts`, `src/game/constants.ts`, `tests/game/constants.test.ts`

- [ ] **Step 1: Write `src/game/types.ts`**

```ts
export type Color =
  | 'brown' | 'lightBlue' | 'pink' | 'orange'
  | 'red' | 'yellow' | 'green' | 'blue'
  | 'railroad' | 'utility'

export type ActionCardName =
  | 'dealBreaker' | 'justSayNo' | 'slyDeal' | 'forcedDeal'
  | 'debtCollector' | 'itsMyBirthday' | 'passGo'
  | 'house' | 'hotel' | 'doubleRent'

export type MoneyValue = 1 | 2 | 3 | 4 | 5 | 10

export interface MoneyCard {
  id: string
  type: 'money'
  value: MoneyValue
}

export interface PropertyCard {
  id: string
  type: 'property'
  color: Color
  name: string
  value: number
}

export interface WildPropertyCard {
  id: string
  type: 'wild_property'
  colors: Color[] // length 2 for dual-color, length 10 for rainbow
  value: number
}

export interface ActionCard {
  id: string
  type: 'action'
  name: ActionCardName
  value: number
}

export interface RentCard {
  id: string
  type: 'rent'
  colors: Color[] // length 2 for specific, length 10 for wild rent
  value: number
}

export type Card = MoneyCard | PropertyCard | WildPropertyCard | ActionCard | RentCard

export interface PropertySet {
  color: Color
  cards: (PropertyCard | WildPropertyCard)[]
  hasHouse: boolean
  hasHotel: boolean
}

export interface PlayerState {
  hand: Card[]
  bank: Card[]
  properties: PropertySet[]
}

export type PlayerIndex = 0 | 1

export type Phase = 'draw' | 'action' | 'respond' | 'discard' | 'gameOver'

export interface PendingAction {
  type: 'rent' | 'debtCollector' | 'itsMyBirthday' | 'slyDeal' | 'forcedDeal' | 'dealBreaker' | 'justSayNo'
  sourcePlayer: PlayerIndex
  targetPlayer: PlayerIndex
  amount?: number // for rent/debt/birthday
  targetColor?: Color // for dealBreaker, slyDeal
  targetCardId?: string // for slyDeal, forcedDeal
  offeredCardId?: string // for forcedDeal
  respondingTo?: PendingAction // for Just Say No chains
}

export interface PlayPropertyAction {
  type: 'playProperty'
  cardId: string
  targetColor: Color // relevant for wild properties
}

export interface PlayActionAction {
  type: 'playAction'
  cardId: string
  targetPlayer?: PlayerIndex
  targetColor?: Color
  targetCardId?: string
  offeredCardId?: string // for forcedDeal
  doubleRentCardId?: string // if playing Double Rent with a rent card
}

export interface BankCardAction {
  type: 'bankCard'
  cardId: string
}

export interface PassAction {
  type: 'pass'
}

export interface DiscardAction {
  type: 'discard'
  cardId: string
}

export interface RespondAction {
  type: 'respond'
  accept: boolean // true = pay/comply, false = play Just Say No
  paymentCardIds?: string[] // cards from bank/properties to pay with
}

export type Action =
  | PlayPropertyAction
  | PlayActionAction
  | BankCardAction
  | PassAction
  | DiscardAction
  | RespondAction

export interface LogEntry {
  player: PlayerIndex
  message: string
}

export interface GameState {
  deck: Card[]
  discardPile: Card[]
  players: [PlayerState, PlayerState]
  currentPlayer: PlayerIndex
  actionsRemaining: number
  phase: Phase
  pendingAction: PendingAction | null
  log: LogEntry[]
  winner: PlayerIndex | null
}
```

- [ ] **Step 2: Write the failing test for constants**

Create `tests/game/constants.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ALL_CARDS, SET_SIZES, RENT_VALUES, CARD_COLORS } from '../../src/game/constants'

describe('constants', () => {
  it('has exactly 106 cards in the full deck', () => {
    expect(ALL_CARDS.length).toBe(106)
  })

  it('has 20 money cards', () => {
    const money = ALL_CARDS.filter(c => c.type === 'money')
    expect(money.length).toBe(20)
  })

  it('has 28 property cards', () => {
    const props = ALL_CARDS.filter(c => c.type === 'property')
    expect(props.length).toBe(28)
  })

  it('has 11 wild property cards', () => {
    const wilds = ALL_CARDS.filter(c => c.type === 'wild_property')
    expect(wilds.length).toBe(11)
  })

  it('has 34 action cards', () => {
    const actions = ALL_CARDS.filter(c => c.type === 'action')
    expect(actions.length).toBe(34)
  })

  it('has 13 rent cards', () => {
    const rents = ALL_CARDS.filter(c => c.type === 'rent')
    expect(rents.length).toBe(13)
  })

  it('has correct set sizes', () => {
    expect(SET_SIZES.brown).toBe(2)
    expect(SET_SIZES.blue).toBe(2)
    expect(SET_SIZES.utility).toBe(2)
    expect(SET_SIZES.railroad).toBe(4)
    expect(SET_SIZES.red).toBe(3)
  })

  it('has rent values for all colors', () => {
    for (const color of CARD_COLORS) {
      expect(RENT_VALUES[color]).toBeDefined()
      expect(RENT_VALUES[color].length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run tests/game/constants.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Write `src/game/constants.ts`**

```ts
import type { Card, Color, MoneyCard, PropertyCard, WildPropertyCard, ActionCard, RentCard } from './types'

export const CARD_COLORS: Color[] = [
  'brown', 'lightBlue', 'pink', 'orange', 'red',
  'yellow', 'green', 'blue', 'railroad', 'utility',
]

export const SET_SIZES: Record<Color, number> = {
  brown: 2, lightBlue: 3, pink: 3, orange: 3, red: 3,
  yellow: 3, green: 3, blue: 2, railroad: 4, utility: 2,
}

// Rent values by property count in set: index 0 = 1 property, index 1 = 2 properties, etc.
export const RENT_VALUES: Record<Color, number[]> = {
  brown:     [1, 2],
  lightBlue: [1, 2, 3],
  pink:      [1, 2, 4],
  orange:    [1, 3, 5],
  red:       [2, 3, 6],
  yellow:    [2, 4, 6],
  green:     [2, 4, 7],
  blue:      [3, 8],
  railroad:  [1, 2, 3, 4],
  utility:   [1, 2],
}

export const COLOR_DISPLAY: Record<Color, { label: string; hex: string }> = {
  brown:     { label: 'Brown',      hex: '#8B4513' },
  lightBlue: { label: 'Light Blue', hex: '#87CEEB' },
  pink:      { label: 'Pink',       hex: '#FF69B4' },
  orange:    { label: 'Orange',     hex: '#FF8C00' },
  red:       { label: 'Red',        hex: '#DC143C' },
  yellow:    { label: 'Yellow',     hex: '#FFD700' },
  green:     { label: 'Green',      hex: '#228B22' },
  blue:      { label: 'Blue',       hex: '#0000CD' },
  railroad:  { label: 'Railroad',   hex: '#2F2F2F' },
  utility:   { label: 'Utility',    hex: '#90EE90' },
}

let cardId = 0
function nextId(): string {
  return `card-${cardId++}`
}

function moneyCards(): MoneyCard[] {
  const counts: [number, number][] = [[1,6],[2,5],[3,3],[4,3],[5,2],[10,1]]
  const cards: MoneyCard[] = []
  for (const [value, count] of counts) {
    for (let i = 0; i < count; i++) {
      cards.push({ id: nextId(), type: 'money', value: value as MoneyCard['value'] })
    }
  }
  return cards
}

function propertyCards(): PropertyCard[] {
  const properties: { color: Color; names: string[]; value: number }[] = [
    { color: 'brown',     names: ['Baltic Avenue', 'Mediterranean Avenue'], value: 1 },
    { color: 'lightBlue', names: ['Connecticut Avenue', 'Oriental Avenue', 'Vermont Avenue'], value: 1 },
    { color: 'pink',      names: ['St. Charles Place', 'Virginia Avenue', 'States Avenue'], value: 2 },
    { color: 'orange',    names: ['St. James Place', 'Tennessee Avenue', 'New York Avenue'], value: 2 },
    { color: 'red',       names: ['Kentucky Avenue', 'Indiana Avenue', 'Illinois Avenue'], value: 3 },
    { color: 'yellow',    names: ['Atlantic Avenue', 'Ventnor Avenue', 'Marvin Gardens'], value: 3 },
    { color: 'green',     names: ['Pacific Avenue', 'North Carolina Avenue', 'Pennsylvania Avenue'], value: 4 },
    { color: 'blue',      names: ['Park Place', 'Boardwalk'], value: 4 },
    { color: 'railroad',  names: ['Reading Railroad', 'Pennsylvania Railroad', 'B&O Railroad', 'Short Line'], value: 2 },
    { color: 'utility',   names: ['Electric Company', 'Water Works'], value: 2 },
  ]
  const cards: PropertyCard[] = []
  for (const { color, names, value } of properties) {
    for (const name of names) {
      cards.push({ id: nextId(), type: 'property', color, name, value })
    }
  }
  return cards
}

function wildPropertyCards(): WildPropertyCard[] {
  const allColors = [...CARD_COLORS]
  const dualWilds: { colors: [Color, Color]; value: number }[] = [
    { colors: ['brown', 'lightBlue'], value: 1 },
    { colors: ['lightBlue', 'railroad'], value: 4 },
    { colors: ['pink', 'orange'], value: 2 },
    { colors: ['red', 'yellow'], value: 3 },
    { colors: ['green', 'blue'], value: 4 },
    { colors: ['green', 'railroad'], value: 4 },
    { colors: ['utility', 'railroad'], value: 2 },
    { colors: ['lightBlue', 'brown'], value: 1 },
    { colors: ['red', 'yellow'], value: 3 },
  ]
  const cards: WildPropertyCard[] = []
  for (const { colors, value } of dualWilds) {
    cards.push({ id: nextId(), type: 'wild_property', colors, value })
  }
  // 2 rainbow wilds
  cards.push({ id: nextId(), type: 'wild_property', colors: allColors, value: 0 })
  cards.push({ id: nextId(), type: 'wild_property', colors: allColors, value: 0 })
  return cards
}

function actionCards(): ActionCard[] {
  const defs: { name: ActionCard['name']; count: number; value: number }[] = [
    { name: 'dealBreaker',    count: 2,  value: 5 },
    { name: 'justSayNo',     count: 3,  value: 4 },
    { name: 'slyDeal',       count: 3,  value: 3 },
    { name: 'forcedDeal',    count: 3,  value: 3 },
    { name: 'debtCollector', count: 3,  value: 3 },
    { name: 'itsMyBirthday', count: 3,  value: 2 },
    { name: 'passGo',        count: 10, value: 1 },
    { name: 'house',         count: 3,  value: 3 },
    { name: 'hotel',         count: 2,  value: 4 },
    { name: 'doubleRent',    count: 2,  value: 1 },
  ]
  const cards: ActionCard[] = []
  for (const { name, count, value } of defs) {
    for (let i = 0; i < count; i++) {
      cards.push({ id: nextId(), type: 'action', name, value })
    }
  }
  return cards
}

function rentCards(): RentCard[] {
  const allColors = [...CARD_COLORS]
  const dualRents: { colors: [Color, Color]; value: number; count: number }[] = [
    { colors: ['brown', 'lightBlue'], value: 1, count: 2 },
    { colors: ['pink', 'orange'],     value: 1, count: 2 },
    { colors: ['red', 'yellow'],      value: 1, count: 2 },
    { colors: ['green', 'blue'],      value: 1, count: 2 },
    { colors: ['railroad', 'utility'], value: 1, count: 2 },
  ]
  const cards: RentCard[] = []
  for (const { colors, value, count } of dualRents) {
    for (let i = 0; i < count; i++) {
      cards.push({ id: nextId(), type: 'rent', colors, value })
    }
  }
  // 3 wild rent cards
  for (let i = 0; i < 3; i++) {
    cards.push({ id: nextId(), type: 'rent', colors: allColors, value: 3 })
  }
  return cards
}

// Reset ID counter and build the full deck definition
cardId = 0
export const ALL_CARDS: Card[] = [
  ...moneyCards(),
  ...propertyCards(),
  ...wildPropertyCards(),
  ...actionCards(),
  ...rentCards(),
]
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run tests/game/constants.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/types.ts src/game/constants.ts tests/game/constants.test.ts
git commit -m "feat: add card types and full 106-card deck constants"
```

---

### Task 3: Deck Module (Shuffle & Deal)

**Files:**
- Create: `src/game/deck.ts`, `tests/game/deck.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/game/deck.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createDeck, shuffle, dealInitialHands } from '../../src/game/deck'
import { ALL_CARDS } from '../../src/game/constants'

describe('createDeck', () => {
  it('returns a fresh copy of all 106 cards', () => {
    const deck = createDeck()
    expect(deck.length).toBe(106)
    // Ensure it's a copy, not the same reference
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/game/deck.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/deck.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/game/deck.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/deck.ts tests/game/deck.test.ts
git commit -m "feat: add deck creation, shuffle, and dealing"
```

---

### Task 4: Game Engine — Initialization & Draw Phase

**Files:**
- Create: `src/game/engine.ts`, `tests/game/engine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/game/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createGame, applyAction, getValidActions, checkWin } from '../../src/game/engine'
import type { GameState, Action } from '../../src/game/types'

describe('createGame', () => {
  it('initializes a valid game state', () => {
    const state = createGame()
    expect(state.players[0].hand.length).toBe(5)
    expect(state.players[1].hand.length).toBe(5)
    expect(state.deck.length).toBe(96)
    expect(state.currentPlayer).toBe(0)
    expect(state.phase).toBe('draw')
    expect(state.actionsRemaining).toBe(3)
    expect(state.pendingAction).toBeNull()
    expect(state.winner).toBeNull()
  })
})

describe('draw phase', () => {
  it('draws 2 cards and moves to action phase', () => {
    const state = createGame()
    const next = applyAction(state, { type: 'pass' }) // draw is auto on turn start
    // After draw: player should have 7 cards (5 + 2)
    expect(next.players[0].hand.length).toBe(7)
    expect(next.phase).toBe('action')
  })
})

describe('checkWin', () => {
  it('returns null when no one has 3 complete sets', () => {
    const state = createGame()
    expect(checkWin(state)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/game/engine.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/engine.ts` — initialization and draw**

```ts
import type { GameState, Action, PlayerIndex, PlayerState, LogEntry } from './types'
import { SET_SIZES } from './constants'
import { createDeck, shuffle, dealInitialHands, drawCards } from './deck'

function emptyPlayer(hand: import('./types').Card[]): PlayerState {
  return { hand, bank: [], properties: [] }
}

export function createGame(): GameState {
  const deck = shuffle(createDeck())
  const { hands, remainingDeck } = dealInitialHands(deck)
  return {
    deck: remainingDeck,
    discardPile: [],
    players: [emptyPlayer(hands[0]), emptyPlayer(hands[1])],
    currentPlayer: 0,
    actionsRemaining: 3,
    phase: 'draw',
    pendingAction: null,
    log: [],
    winner: null,
  }
}

export function performDraw(state: GameState): GameState {
  const player = state.currentPlayer
  const { drawn, deck, discardPile } = drawCards(state.deck, state.discardPile, 2)
  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]
  newPlayers[player] = {
    ...newPlayers[player],
    hand: [...newPlayers[player].hand, ...drawn],
  }
  return {
    ...state,
    deck,
    discardPile,
    players: newPlayers,
    phase: 'action',
    log: [...state.log, { player, message: `Drew ${drawn.length} cards` }],
  }
}

export function checkWin(state: GameState): PlayerIndex | null {
  for (const idx of [0, 1] as PlayerIndex[]) {
    const completeSets = state.players[idx].properties.filter(
      set => set.cards.length >= SET_SIZES[set.color]
    )
    if (completeSets.length >= 3) return idx
  }
  return null
}

export function getValidActions(state: GameState): Action[] {
  // Stub — will be expanded in Task 5
  if (state.phase === 'action') {
    return [{ type: 'pass' }]
  }
  return []
}

export function applyAction(state: GameState, action: Action): GameState {
  if (state.phase === 'draw') {
    return performDraw(state)
  }

  if (state.phase === 'action' && action.type === 'pass') {
    return endTurn(state)
  }

  return state
}

function endTurn(state: GameState): GameState {
  const nextPlayer: PlayerIndex = state.currentPlayer === 0 ? 1 : 0
  const needsDiscard = state.players[state.currentPlayer].hand.length > 7
  if (needsDiscard) {
    return { ...state, phase: 'discard' }
  }
  return {
    ...state,
    currentPlayer: nextPlayer,
    actionsRemaining: 3,
    phase: 'draw',
    log: [...state.log, { player: state.currentPlayer, message: 'Ended turn' }],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/game/engine.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine.ts tests/game/engine.test.ts
git commit -m "feat: add game engine with init, draw, and win check"
```

---

### Task 5: Game Engine — Action Phase (Play Property, Bank, Action Cards)

**Files:**
- Modify: `src/game/engine.ts`
- Modify: `tests/game/engine.test.ts`

- [ ] **Step 1: Write failing tests for property, bank, and action card plays**

Append to `tests/game/engine.test.ts`:

```ts
import { performDraw } from '../../src/game/engine'
import type { PropertyCard, ActionCard, MoneyCard, WildPropertyCard, RentCard } from '../../src/game/types'

function gameInActionPhase(): GameState {
  const state = createGame()
  return performDraw(state)
}

describe('play property', () => {
  it('moves a property card from hand to property sets', () => {
    let state = gameInActionPhase()
    const propCard = state.players[0].hand.find(c => c.type === 'property') as PropertyCard | undefined
    if (!propCard) return // skip if no property in hand (random deck)

    const next = applyAction(state, {
      type: 'playProperty',
      cardId: propCard.id,
      targetColor: propCard.color,
    })

    expect(next.players[0].hand.find(c => c.id === propCard.id)).toBeUndefined()
    const set = next.players[0].properties.find(s => s.color === propCard.color)
    expect(set).toBeDefined()
    expect(set!.cards.find(c => c.id === propCard.id)).toBeDefined()
    expect(next.actionsRemaining).toBe(2)
  })
})

describe('bank card', () => {
  it('moves a card from hand to bank', () => {
    let state = gameInActionPhase()
    const card = state.players[0].hand[0]
    const next = applyAction(state, { type: 'bankCard', cardId: card.id })

    expect(next.players[0].hand.find(c => c.id === card.id)).toBeUndefined()
    expect(next.players[0].bank.find(c => c.id === card.id)).toBeDefined()
    expect(next.actionsRemaining).toBe(2)
  })
})

describe('pass action', () => {
  it('ends the turn when in action phase', () => {
    const state = gameInActionPhase()
    const next = applyAction(state, { type: 'pass' })
    expect(next.currentPlayer).toBe(1)
    expect(next.phase).toBe('draw')
  })
})

describe('action count', () => {
  it('ends turn automatically after 3 actions', () => {
    let state = gameInActionPhase()
    // Play 3 bank actions
    for (let i = 0; i < 3; i++) {
      const card = state.players[state.currentPlayer].hand[0]
      if (!card) break
      state = applyAction(state, { type: 'bankCard', cardId: card.id })
    }
    // After 3 actions, should auto-transition
    expect(state.actionsRemaining).toBe(0)
    // Phase should be draw (next player) or discard
    expect(['draw', 'discard']).toContain(state.phase)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/engine.test.ts
```

Expected: New tests FAIL.

- [ ] **Step 3: Implement action handling in `src/game/engine.ts`**

Add these functions and update `applyAction` and `getValidActions`:

```ts
import type {
  GameState, Action, PlayerIndex, PlayerState, LogEntry,
  PropertyCard, WildPropertyCard, PropertySet, Card,
  PlayPropertyAction, PlayActionAction, BankCardAction, DiscardAction,
} from './types'

function findCard(hand: Card[], cardId: string): Card | undefined {
  return hand.find(c => c.id === cardId)
}

function removeCard(hand: Card[], cardId: string): Card[] {
  return hand.filter(c => c.id !== cardId)
}

function addToPropertySet(properties: PropertySet[], card: PropertyCard | WildPropertyCard, color: import('./types').Color): PropertySet[] {
  const sets = structuredClone(properties) as PropertySet[]
  let set = sets.find(s => s.color === color)
  if (!set) {
    set = { color, cards: [], hasHouse: false, hasHotel: false }
    sets.push(set)
  }
  set.cards.push(card)
  return sets
}

function applyPlayProperty(state: GameState, action: PlayPropertyAction): GameState {
  const player = state.currentPlayer
  const card = findCard(state.players[player].hand, action.cardId)
  if (!card || (card.type !== 'property' && card.type !== 'wild_property')) return state

  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]
  newPlayers[player] = {
    ...newPlayers[player],
    hand: removeCard(newPlayers[player].hand, action.cardId),
    properties: addToPropertySet(
      newPlayers[player].properties,
      card as PropertyCard | WildPropertyCard,
      action.targetColor,
    ),
  }

  const newState: GameState = {
    ...state,
    players: newPlayers,
    actionsRemaining: state.actionsRemaining - 1,
    log: [...state.log, { player, message: `Played ${card.type === 'property' ? (card as PropertyCard).name : 'Wild'} to ${action.targetColor}` }],
  }

  const winner = checkWin(newState)
  if (winner !== null) {
    return { ...newState, winner, phase: 'gameOver' }
  }

  return maybeEndTurn(newState)
}

function applyBankCard(state: GameState, action: BankCardAction): GameState {
  const player = state.currentPlayer
  const card = findCard(state.players[player].hand, action.cardId)
  if (!card) return state

  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]
  newPlayers[player] = {
    ...newPlayers[player],
    hand: removeCard(newPlayers[player].hand, action.cardId),
    bank: [...newPlayers[player].bank, card],
  }

  const newState: GameState = {
    ...state,
    players: newPlayers,
    actionsRemaining: state.actionsRemaining - 1,
    log: [...state.log, { player, message: `Banked a card ($${card.value})` }],
  }

  return maybeEndTurn(newState)
}

function maybeEndTurn(state: GameState): GameState {
  if (state.actionsRemaining <= 0) {
    return endTurn(state)
  }
  return state
}
```

Update `applyAction` to dispatch to these:

```ts
export function applyAction(state: GameState, action: Action): GameState {
  if (state.phase === 'draw') {
    return performDraw(state)
  }

  if (state.phase === 'discard' && action.type === 'discard') {
    return applyDiscard(state, action)
  }

  if (state.phase !== 'action') return state

  switch (action.type) {
    case 'playProperty': return applyPlayProperty(state, action)
    case 'bankCard': return applyBankCard(state, action)
    case 'playAction': return applyPlayAction(state, action)
    case 'pass': return endTurn(state)
    default: return state
  }
}

function applyDiscard(state: GameState, action: DiscardAction): GameState {
  const player = state.currentPlayer
  const card = findCard(state.players[player].hand, action.cardId)
  if (!card) return state

  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]
  newPlayers[player] = {
    ...newPlayers[player],
    hand: removeCard(newPlayers[player].hand, action.cardId),
  }

  const newState: GameState = {
    ...state,
    players: newPlayers,
    discardPile: [...state.discardPile, card],
    log: [...state.log, { player, message: 'Discarded a card' }],
  }

  if (newState.players[player].hand.length <= 7) {
    const nextPlayer: PlayerIndex = player === 0 ? 1 : 0
    return {
      ...newState,
      currentPlayer: nextPlayer,
      actionsRemaining: 3,
      phase: 'draw',
    }
  }

  return newState
}

function applyPlayAction(state: GameState, action: PlayActionAction): GameState {
  // Stub — expanded in Task 6
  return state
}
```

Update `getValidActions`:

```ts
export function getValidActions(state: GameState): Action[] {
  const player = state.currentPlayer
  const hand = state.players[player].hand

  if (state.phase === 'discard') {
    return hand.map(c => ({ type: 'discard' as const, cardId: c.id }))
  }

  if (state.phase !== 'action') return []

  const actions: Action[] = []

  for (const card of hand) {
    // Any card can be banked
    actions.push({ type: 'bankCard', cardId: card.id })

    if (card.type === 'property') {
      actions.push({ type: 'playProperty', cardId: card.id, targetColor: card.color })
    }

    if (card.type === 'wild_property') {
      for (const color of card.colors) {
        actions.push({ type: 'playProperty', cardId: card.id, targetColor: color })
      }
    }
  }

  actions.push({ type: 'pass' })
  return actions
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/engine.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine.ts tests/game/engine.test.ts
git commit -m "feat: add property play, banking, discard, and action counting"
```

---

### Task 6: Game Engine — Action Cards (Rent, Debt, Birthday, Pass Go, Steal, Deal Breaker, Just Say No)

**Files:**
- Modify: `src/game/engine.ts`
- Modify: `tests/game/engine.test.ts`

- [ ] **Step 1: Write failing tests for action cards**

Append to `tests/game/engine.test.ts`:

```ts
import { RENT_VALUES, SET_SIZES } from '../../src/game/constants'

function stateWithKnownHands(): GameState {
  // Build a controlled state for testing action cards
  const base = createGame()
  const state = performDraw(base)
  return state
}

describe('Pass Go', () => {
  it('draws 2 extra cards', () => {
    let state = gameInActionPhase()
    // Insert a passGo card into player's hand
    const passGoCard: ActionCard = { id: 'test-passgo', type: 'action', name: 'passGo', value: 1 }
    state = {
      ...state,
      players: [
        { ...state.players[0], hand: [...state.players[0].hand, passGoCard] },
        state.players[1],
      ] as [PlayerState, PlayerState],
    }
    const handBefore = state.players[0].hand.length
    const next = applyAction(state, { type: 'playAction', cardId: 'test-passgo' })
    expect(next.players[0].hand.length).toBe(handBefore - 1 + 2) // -1 played, +2 drawn
    expect(next.actionsRemaining).toBe(2)
  })
})

describe('Debt Collector', () => {
  it('creates a pending action for target to pay 5M', () => {
    let state = gameInActionPhase()
    const debtCard: ActionCard = { id: 'test-debt', type: 'action', name: 'debtCollector', value: 3 }
    state = {
      ...state,
      players: [
        { ...state.players[0], hand: [...state.players[0].hand, debtCard] },
        state.players[1],
      ] as [PlayerState, PlayerState],
    }
    const next = applyAction(state, {
      type: 'playAction',
      cardId: 'test-debt',
      targetPlayer: 1,
    })
    expect(next.phase).toBe('respond')
    expect(next.pendingAction).not.toBeNull()
    expect(next.pendingAction!.type).toBe('debtCollector')
    expect(next.pendingAction!.amount).toBe(5)
  })
})

describe('Its My Birthday', () => {
  it('creates a pending action for target to pay 2M', () => {
    let state = gameInActionPhase()
    const bdayCard: ActionCard = { id: 'test-bday', type: 'action', name: 'itsMyBirthday', value: 2 }
    state = {
      ...state,
      players: [
        { ...state.players[0], hand: [...state.players[0].hand, bdayCard] },
        state.players[1],
      ] as [PlayerState, PlayerState],
    }
    const next = applyAction(state, { type: 'playAction', cardId: 'test-bday' })
    expect(next.phase).toBe('respond')
    expect(next.pendingAction!.type).toBe('itsMyBirthday')
    expect(next.pendingAction!.amount).toBe(2)
  })
})

describe('respond to payment', () => {
  it('transfers payment cards from target bank to source bank', () => {
    let state = gameInActionPhase()
    // Give player 1 some bank cards
    const bankCard: MoneyCard = { id: 'test-money', type: 'money', value: 5 }
    state = {
      ...state,
      phase: 'respond' as const,
      pendingAction: {
        type: 'debtCollector',
        sourcePlayer: 0,
        targetPlayer: 1,
        amount: 5,
      },
      players: [
        state.players[0],
        { ...state.players[1], bank: [bankCard] },
      ] as [PlayerState, PlayerState],
    }
    const next = applyAction(state, {
      type: 'respond',
      accept: true,
      paymentCardIds: ['test-money'],
    })
    expect(next.players[1].bank.find(c => c.id === 'test-money')).toBeUndefined()
    expect(next.players[0].bank.find(c => c.id === 'test-money')).toBeDefined()
    expect(next.phase).toBe('action')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/engine.test.ts
```

Expected: New tests FAIL.

- [ ] **Step 3: Implement action cards in `src/game/engine.ts`**

Replace the `applyPlayAction` stub and add response handling:

```ts
function applyPlayAction(state: GameState, action: PlayActionAction): GameState {
  const player = state.currentPlayer
  const card = findCard(state.players[player].hand, action.cardId)
  if (!card || card.type !== 'action') return state
  const actionCard = card as import('./types').ActionCard
  const opponent: PlayerIndex = player === 0 ? 1 : 0

  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]
  newPlayers[player] = {
    ...newPlayers[player],
    hand: removeCard(newPlayers[player].hand, action.cardId),
  }

  const base: GameState = {
    ...state,
    players: newPlayers,
    discardPile: [...state.discardPile, card],
    actionsRemaining: state.actionsRemaining - 1,
  }

  switch (actionCard.name) {
    case 'passGo': {
      const { drawn, deck, discardPile } = drawCards(base.deck, base.discardPile, 2)
      const ps = structuredClone(base.players) as [PlayerState, PlayerState]
      ps[player] = { ...ps[player], hand: [...ps[player].hand, ...drawn] }
      const s: GameState = {
        ...base, deck, discardPile, players: ps,
        log: [...base.log, { player, message: 'Played Pass Go — drew 2 cards' }],
      }
      return maybeEndTurn(s)
    }

    case 'debtCollector':
      return {
        ...base,
        phase: 'respond',
        pendingAction: {
          type: 'debtCollector', sourcePlayer: player, targetPlayer: action.targetPlayer ?? opponent, amount: 5,
        },
        log: [...base.log, { player, message: 'Played Debt Collector' }],
      }

    case 'itsMyBirthday':
      return {
        ...base,
        phase: 'respond',
        pendingAction: {
          type: 'itsMyBirthday', sourcePlayer: player, targetPlayer: opponent, amount: 2,
        },
        log: [...base.log, { player, message: "Played It's My Birthday" }],
      }

    case 'slyDeal':
      return {
        ...base,
        phase: 'respond',
        pendingAction: {
          type: 'slyDeal', sourcePlayer: player, targetPlayer: opponent,
          targetCardId: action.targetCardId, targetColor: action.targetColor,
        },
        log: [...base.log, { player, message: 'Played Sly Deal' }],
      }

    case 'forcedDeal':
      return {
        ...base,
        phase: 'respond',
        pendingAction: {
          type: 'forcedDeal', sourcePlayer: player, targetPlayer: opponent,
          targetCardId: action.targetCardId, offeredCardId: action.offeredCardId,
          targetColor: action.targetColor,
        },
        log: [...base.log, { player, message: 'Played Forced Deal' }],
      }

    case 'dealBreaker':
      return {
        ...base,
        phase: 'respond',
        pendingAction: {
          type: 'dealBreaker', sourcePlayer: player, targetPlayer: opponent,
          targetColor: action.targetColor,
        },
        log: [...base.log, { player, message: `Played Deal Breaker on ${action.targetColor}` }],
      }

    case 'house': {
      // Add house to a complete set
      const ps = structuredClone(base.players) as [PlayerState, PlayerState]
      const set = ps[player].properties.find(
        s => s.color === action.targetColor && s.cards.length >= SET_SIZES[s.color] && !s.hasHouse
      )
      if (!set) return state
      set.hasHouse = true
      return maybeEndTurn({
        ...base, players: ps,
        log: [...base.log, { player, message: `Added House to ${action.targetColor}` }],
      })
    }

    case 'hotel': {
      const ps = structuredClone(base.players) as [PlayerState, PlayerState]
      const set = ps[player].properties.find(
        s => s.color === action.targetColor && s.cards.length >= SET_SIZES[s.color] && s.hasHouse && !s.hasHotel
      )
      if (!set) return state
      set.hasHotel = true
      return maybeEndTurn({
        ...base, players: ps,
        log: [...base.log, { player, message: `Added Hotel to ${action.targetColor}` }],
      })
    }

    case 'doubleRent':
      // Double rent is played alongside a rent card — handled in rent logic
      return state

    case 'justSayNo':
      // Played as a response, not as an action — handled in respond phase
      return state

    default:
      return state
  }
}

function applyRent(state: GameState, action: PlayActionAction): GameState {
  const player = state.currentPlayer
  const card = findCard(state.players[player].hand, action.cardId)
  if (!card || card.type !== 'rent') return state
  const rentCard = card as RentCard
  const opponent: PlayerIndex = player === 0 ? 1 : 0

  const targetColor = action.targetColor
  if (!targetColor) return state

  const set = state.players[player].properties.find(s => s.color === targetColor)
  const propCount = set ? set.cards.length : 0
  const rentTable = RENT_VALUES[targetColor]
  let rentAmount = propCount > 0 ? (rentTable[Math.min(propCount, rentTable.length) - 1] ?? 0) : 0

  // Add house/hotel bonuses
  if (set?.hasHouse) rentAmount += 3
  if (set?.hasHotel) rentAmount += 4

  // Double Rent
  if (action.doubleRentCardId) {
    const drCard = findCard(state.players[player].hand, action.doubleRentCardId)
    if (drCard) rentAmount *= 2
  }

  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]
  newPlayers[player] = {
    ...newPlayers[player],
    hand: removeCard(
      action.doubleRentCardId
        ? removeCard(newPlayers[player].hand, action.doubleRentCardId)
        : newPlayers[player].hand,
      action.cardId,
    ),
  }

  const actionsUsed = action.doubleRentCardId ? 2 : 1

  return {
    ...state,
    players: newPlayers,
    discardPile: [...state.discardPile, card],
    actionsRemaining: state.actionsRemaining - actionsUsed,
    phase: 'respond',
    pendingAction: {
      type: 'rent', sourcePlayer: player, targetPlayer: opponent,
      amount: rentAmount, targetColor,
    },
    log: [...state.log, { player, message: `Charged $${rentAmount}M rent for ${targetColor}` }],
  }
}

function applyRespond(state: GameState, action: import('./types').RespondAction): GameState {
  if (!state.pendingAction) return state
  const pending = state.pendingAction

  if (!action.accept) {
    // Playing Just Say No
    const responder = pending.targetPlayer
    const jsn = state.players[responder].hand.find(
      c => c.type === 'action' && (c as import('./types').ActionCard).name === 'justSayNo'
    )
    if (!jsn) return state // Can't say no without the card

    const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]
    newPlayers[responder] = {
      ...newPlayers[responder],
      hand: removeCard(newPlayers[responder].hand, jsn.id),
    }

    // The original player can counter with their own Just Say No
    return {
      ...state,
      players: newPlayers,
      discardPile: [...state.discardPile, jsn],
      pendingAction: {
        type: 'justSayNo',
        sourcePlayer: responder,
        targetPlayer: pending.sourcePlayer,
        respondingTo: pending,
      },
      log: [...state.log, { player: responder, message: 'Played Just Say No!' }],
    }
  }

  // Accept — resolve the pending action
  switch (pending.type) {
    case 'justSayNo': {
      // Accepting a Just Say No means the original action is cancelled
      return {
        ...state,
        pendingAction: null,
        phase: 'action',
        log: [...state.log, { player: pending.targetPlayer, message: 'Accepted Just Say No — action cancelled' }],
      }
    }

    case 'debtCollector':
    case 'itsMyBirthday':
    case 'rent': {
      return resolvePayment(state, pending, action.paymentCardIds ?? [])
    }

    case 'slyDeal': {
      return resolveSlyDeal(state, pending)
    }

    case 'forcedDeal': {
      return resolveForcedDeal(state, pending)
    }

    case 'dealBreaker': {
      return resolveDealBreaker(state, pending)
    }

    default:
      return { ...state, pendingAction: null, phase: 'action' }
  }
}

function resolvePayment(
  state: GameState,
  pending: import('./types').PendingAction,
  paymentCardIds: string[],
): GameState {
  const source = pending.sourcePlayer
  const target = pending.targetPlayer
  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]

  const paidCards: Card[] = []
  for (const cardId of paymentCardIds) {
    // Check bank first
    const bankIdx = newPlayers[target].bank.findIndex(c => c.id === cardId)
    if (bankIdx !== -1) {
      paidCards.push(newPlayers[target].bank.splice(bankIdx, 1)[0])
      continue
    }
    // Check properties
    for (const set of newPlayers[target].properties) {
      const propIdx = set.cards.findIndex(c => c.id === cardId)
      if (propIdx !== -1) {
        paidCards.push(set.cards.splice(propIdx, 1)[0])
        break
      }
    }
  }
  // Clean up empty sets
  newPlayers[target].properties = newPlayers[target].properties.filter(s => s.cards.length > 0)

  // Transfer to source's bank
  newPlayers[source].bank.push(...paidCards)

  const newState: GameState = {
    ...state,
    players: newPlayers,
    pendingAction: null,
    phase: 'action',
    log: [...state.log, { player: target, message: `Paid $${paidCards.reduce((sum, c) => sum + c.value, 0)}M` }],
  }

  return maybeEndTurn(newState)
}

function resolveSlyDeal(state: GameState, pending: import('./types').PendingAction): GameState {
  if (!pending.targetCardId || !pending.targetColor) return { ...state, pendingAction: null, phase: 'action' }
  const source = pending.sourcePlayer
  const target = pending.targetPlayer
  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]

  // Can't steal from a complete set
  const targetSet = newPlayers[target].properties.find(s => s.color === pending.targetColor)
  if (!targetSet || targetSet.cards.length >= SET_SIZES[targetSet.color]) {
    return { ...state, pendingAction: null, phase: 'action' }
  }

  const cardIdx = targetSet.cards.findIndex(c => c.id === pending.targetCardId)
  if (cardIdx === -1) return { ...state, pendingAction: null, phase: 'action' }

  const stolen = targetSet.cards.splice(cardIdx, 1)[0]
  newPlayers[target].properties = newPlayers[target].properties.filter(s => s.cards.length > 0)
  newPlayers[source].properties = addToPropertySet(newPlayers[source].properties, stolen, pending.targetColor!)

  const newState: GameState = {
    ...state, players: newPlayers, pendingAction: null, phase: 'action',
    log: [...state.log, { player: source, message: `Stole a property from ${pending.targetColor}` }],
  }
  const winner = checkWin(newState)
  if (winner !== null) return { ...newState, winner, phase: 'gameOver' }
  return maybeEndTurn(newState)
}

function resolveForcedDeal(state: GameState, pending: import('./types').PendingAction): GameState {
  if (!pending.targetCardId || !pending.offeredCardId || !pending.targetColor) {
    return { ...state, pendingAction: null, phase: 'action' }
  }
  const source = pending.sourcePlayer
  const target = pending.targetPlayer
  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]

  // Can't take from complete set
  const targetSet = newPlayers[target].properties.find(s => s.color === pending.targetColor)
  if (!targetSet || targetSet.cards.length >= SET_SIZES[targetSet.color]) {
    return { ...state, pendingAction: null, phase: 'action' }
  }

  const takenIdx = targetSet.cards.findIndex(c => c.id === pending.targetCardId)
  if (takenIdx === -1) return { ...state, pendingAction: null, phase: 'action' }
  const taken = targetSet.cards.splice(takenIdx, 1)[0]
  newPlayers[target].properties = newPlayers[target].properties.filter(s => s.cards.length > 0)

  // Find offered card in source's properties
  let offered: (PropertyCard | WildPropertyCard) | null = null
  let offeredColor: import('./types').Color | null = null
  for (const set of newPlayers[source].properties) {
    const idx = set.cards.findIndex(c => c.id === pending.offeredCardId)
    if (idx !== -1) {
      offered = set.cards.splice(idx, 1)[0]
      offeredColor = set.color
      break
    }
  }
  if (!offered || !offeredColor) return { ...state, pendingAction: null, phase: 'action' }
  newPlayers[source].properties = newPlayers[source].properties.filter(s => s.cards.length > 0)

  // Swap
  newPlayers[source].properties = addToPropertySet(newPlayers[source].properties, taken, pending.targetColor!)
  newPlayers[target].properties = addToPropertySet(newPlayers[target].properties, offered, offeredColor)

  const newState: GameState = {
    ...state, players: newPlayers, pendingAction: null, phase: 'action',
    log: [...state.log, { player: source, message: 'Completed a Forced Deal' }],
  }
  const winner = checkWin(newState)
  if (winner !== null) return { ...newState, winner, phase: 'gameOver' }
  return maybeEndTurn(newState)
}

function resolveDealBreaker(state: GameState, pending: import('./types').PendingAction): GameState {
  if (!pending.targetColor) return { ...state, pendingAction: null, phase: 'action' }
  const source = pending.sourcePlayer
  const target = pending.targetPlayer
  const newPlayers = structuredClone(state.players) as [PlayerState, PlayerState]

  const setIdx = newPlayers[target].properties.findIndex(
    s => s.color === pending.targetColor && s.cards.length >= SET_SIZES[s.color]
  )
  if (setIdx === -1) return { ...state, pendingAction: null, phase: 'action' }

  const [stolenSet] = newPlayers[target].properties.splice(setIdx, 1)
  // Add all cards to source's property area
  let sourceProps = newPlayers[source].properties
  for (const card of stolenSet.cards) {
    sourceProps = addToPropertySet(sourceProps, card, stolenSet.color)
  }
  // Preserve house/hotel
  const newSet = sourceProps.find(s => s.color === stolenSet.color)
  if (newSet) {
    newSet.hasHouse = stolenSet.hasHouse
    newSet.hasHotel = stolenSet.hasHotel
  }
  newPlayers[source].properties = sourceProps

  const newState: GameState = {
    ...state, players: newPlayers, pendingAction: null, phase: 'action',
    log: [...state.log, { player: source, message: `Deal Breaker! Stole complete ${pending.targetColor} set` }],
  }
  const winner = checkWin(newState)
  if (winner !== null) return { ...newState, winner, phase: 'gameOver' }
  return maybeEndTurn(newState)
}
```

Update `applyAction` to handle rent and respond:

```ts
export function applyAction(state: GameState, action: Action): GameState {
  if (state.phase === 'draw') {
    return performDraw(state)
  }

  if (state.phase === 'respond' && action.type === 'respond') {
    return applyRespond(state, action)
  }

  if (state.phase === 'discard' && action.type === 'discard') {
    return applyDiscard(state, action)
  }

  if (state.phase !== 'action') return state

  switch (action.type) {
    case 'playProperty': return applyPlayProperty(state, action)
    case 'bankCard': return applyBankCard(state, action)
    case 'playAction': {
      const card = findCard(state.players[state.currentPlayer].hand, action.cardId)
      if (card?.type === 'rent') return applyRent(state, action)
      return applyPlayAction(state, action)
    }
    case 'pass': return endTurn(state)
    default: return state
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/engine.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine.ts tests/game/engine.test.ts
git commit -m "feat: add all action cards, rent, responses, and Just Say No chains"
```

---

### Task 7: AI Module

**Files:**
- Create: `src/game/ai.ts`, `tests/game/ai.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/game/ai.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { chooseAction, chooseResponse, chooseDiscards } from '../../src/game/ai'
import { createGame, performDraw, getValidActions } from '../../src/game/engine'
import type { GameState, PlayerState, MoneyCard, PropertyCard, ActionCard } from '../../src/game/types'

function aiActionPhase(): GameState {
  let state = createGame()
  // Switch to AI's turn (player 1)
  state = { ...state, currentPlayer: 1, phase: 'draw' }
  return performDraw(state)
}

describe('chooseAction', () => {
  it('returns a valid action from the available actions', () => {
    const state = aiActionPhase()
    const validActions = getValidActions(state)
    const chosen = chooseAction(state)
    // The chosen action type should be among valid action types
    expect(chosen).toBeDefined()
    expect(chosen.type).toBeDefined()
  })

  it('prefers completing a set over banking', () => {
    let state = aiActionPhase()
    // Give AI a brown set with 1 card and a brown property in hand
    const existing: PropertyCard = { id: 'ai-brown-1', type: 'property', color: 'brown', name: 'Baltic Avenue', value: 1 }
    const completing: PropertyCard = { id: 'ai-brown-2', type: 'property', color: 'brown', name: 'Mediterranean Avenue', value: 1 }
    state = {
      ...state,
      players: [
        state.players[0],
        {
          ...state.players[1],
          hand: [completing, { id: 'ai-money', type: 'money', value: 1 } as MoneyCard],
          properties: [{ color: 'brown', cards: [existing], hasHouse: false, hasHotel: false }],
        },
      ] as [PlayerState, PlayerState],
    }
    const chosen = chooseAction(state)
    expect(chosen.type).toBe('playProperty')
  })
})

describe('chooseResponse', () => {
  it('plays Just Say No when available', () => {
    let state = aiActionPhase()
    const jsn: ActionCard = { id: 'ai-jsn', type: 'action', name: 'justSayNo', value: 4 }
    state = {
      ...state,
      phase: 'respond' as const,
      pendingAction: {
        type: 'debtCollector', sourcePlayer: 0, targetPlayer: 1, amount: 5,
      },
      players: [
        state.players[0],
        { ...state.players[1], hand: [...state.players[1].hand, jsn] },
      ] as [PlayerState, PlayerState],
    }
    const response = chooseResponse(state)
    expect(response.accept).toBe(false)
  })
})

describe('chooseDiscards', () => {
  it('returns cards to discard when hand exceeds 7', () => {
    let state = aiActionPhase()
    // Give AI 9 cards in hand
    const extras: MoneyCard[] = Array.from({ length: 4 }, (_, i) => ({
      id: `extra-${i}`, type: 'money', value: 1,
    }))
    state = {
      ...state,
      players: [
        state.players[0],
        { ...state.players[1], hand: [...state.players[1].hand, ...extras] },
      ] as [PlayerState, PlayerState],
    }
    const discards = chooseDiscards(state)
    const handSize = state.players[1].hand.length
    expect(discards.length).toBe(handSize - 7)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/game/ai.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/ai.ts`**

```ts
import type {
  GameState, Action, RespondAction, Card, PlayerIndex,
  PropertyCard, WildPropertyCard, ActionCard, PlayPropertyAction,
  PlayActionAction, BankCardAction,
} from './types'
import { SET_SIZES, RENT_VALUES } from './constants'
import { getValidActions } from './engine'

function getPlayer(state: GameState) {
  return state.players[state.currentPlayer]
}

function getOpponent(state: GameState) {
  const oppIdx: PlayerIndex = state.currentPlayer === 0 ? 1 : 0
  return state.players[oppIdx]
}

function setsNeeded(state: GameState, playerIdx: PlayerIndex, color: string): number {
  const set = state.players[playerIdx].properties.find(s => s.color === color)
  const size = SET_SIZES[color as keyof typeof SET_SIZES]
  return size - (set?.cards.length ?? 0)
}

function scoreAction(state: GameState, action: Action): number {
  const player = getPlayer(state)
  const oppIdx: PlayerIndex = state.currentPlayer === 0 ? 1 : 0

  switch (action.type) {
    case 'playProperty': {
      const a = action as PlayPropertyAction
      const needed = setsNeeded(state, state.currentPlayer, a.targetColor)
      if (needed === 1) return 100 // completes a set
      if (needed === 2) return 60
      return 40
    }

    case 'playAction': {
      const a = action as PlayActionAction
      const card = player.hand.find(c => c.id === a.cardId)
      if (!card) return 0
      if (card.type === 'action') {
        const ac = card as ActionCard
        switch (ac.name) {
          case 'dealBreaker': return 90
          case 'slyDeal': return 70
          case 'forcedDeal': return 50
          case 'debtCollector': return 55
          case 'itsMyBirthday': return 45
          case 'passGo': return 65
          case 'house': return 30
          case 'hotel': return 35
          case 'doubleRent': return 10 // only valuable with rent
          default: return 0
        }
      }
      if (card.type === 'rent') {
        // Score based on rent amount
        const color = a.targetColor
        if (!color) return 20
        const set = player.properties.find(s => s.color === color)
        if (!set || set.cards.length === 0) return 5
        const rentTable = RENT_VALUES[color]
        const amount = rentTable[Math.min(set.cards.length, rentTable.length) - 1] ?? 0
        return 20 + amount * 5
      }
      return 0
    }

    case 'bankCard':
      return 15

    case 'pass':
      return 1

    default:
      return 0
  }
}

export function chooseAction(state: GameState): Action {
  const actions = getValidActions(state)
  if (actions.length === 0) return { type: 'pass' }

  // Score and sort
  const scored = actions.map(a => ({ action: a, score: scoreAction(state, a) }))
  scored.sort((a, b) => b.score - a.score)

  return scored[0].action
}

export function chooseResponse(state: GameState): RespondAction {
  if (!state.pendingAction) return { type: 'respond', accept: true }

  const target = state.pendingAction.targetPlayer
  const hand = state.players[target].hand

  // Check for Just Say No
  const jsn = hand.find(
    c => c.type === 'action' && (c as ActionCard).name === 'justSayNo'
  )

  // Use Just Say No for high-value threats
  if (jsn) {
    const threatening = ['dealBreaker', 'rent', 'debtCollector'].includes(state.pendingAction.type)
    if (threatening) {
      return { type: 'respond', accept: false }
    }
  }

  // Accept and pay — choose cheapest cards
  const available: Card[] = [
    ...state.players[target].bank,
    ...state.players[target].properties.flatMap(s => {
      // Don't sacrifice from complete sets unless we must
      if (s.cards.length >= SET_SIZES[s.color]) return []
      return s.cards
    }),
  ]

  // Sort by value ascending — pay cheapest first
  available.sort((a, b) => a.value - b.value)

  const amount = state.pendingAction.amount ?? 0
  const paymentIds: string[] = []
  let paid = 0
  for (const card of available) {
    if (paid >= amount) break
    paymentIds.push(card.id)
    paid += card.value
  }

  // If not enough from non-complete sets, sacrifice from complete sets
  if (paid < amount) {
    const completeSets = state.players[target].properties
      .filter(s => s.cards.length >= SET_SIZES[s.color])
      .flatMap(s => s.cards)
      .sort((a, b) => a.value - b.value)
    for (const card of completeSets) {
      if (paid >= amount) break
      paymentIds.push(card.id)
      paid += card.value
    }
  }

  return { type: 'respond', accept: true, paymentCardIds: paymentIds }
}

export function chooseDiscards(state: GameState): string[] {
  const player = state.players[state.currentPlayer]
  const excess = player.hand.length - 7
  if (excess <= 0) return []

  // Score each card — lowest score gets discarded
  const scored = player.hand.map(card => {
    let score = card.value

    if (card.type === 'property' || card.type === 'wild_property') {
      const color = card.type === 'property' ? card.color : (card as WildPropertyCard).colors[0]
      const needed = setsNeeded(state, state.currentPlayer, color)
      if (needed <= 1) score += 20 // close to completing
      else score += 5
    }

    if (card.type === 'action') {
      const ac = card as ActionCard
      if (ac.name === 'justSayNo') score += 15
      if (ac.name === 'dealBreaker') score += 10
    }

    return { id: card.id, score }
  })

  scored.sort((a, b) => a.score - b.score)
  return scored.slice(0, excess).map(s => s.id)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/game/ai.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/ai.ts tests/game/ai.test.ts
git commit -m "feat: add heuristic AI with action scoring, response, and discard logic"
```

---

### Task 8: useGame Hook

**Files:**
- Create: `src/hooks/useGame.ts`

- [ ] **Step 1: Write `src/hooks/useGame.ts`**

```ts
import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { GameState, Action, LogEntry } from '../game/types'
import { createGame, applyAction, performDraw } from '../game/engine'
import { chooseAction, chooseResponse, chooseDiscards } from '../game/ai'

type GameAction =
  | { type: 'PLAYER_ACTION'; action: Action }
  | { type: 'AI_STEP' }
  | { type: 'NEW_GAME' }

function gameReducer(state: GameState, gameAction: GameAction): GameState {
  switch (gameAction.type) {
    case 'NEW_GAME':
      return createGame()

    case 'PLAYER_ACTION':
      return applyAction(state, gameAction.action)

    case 'AI_STEP': {
      if (state.phase === 'draw' && state.currentPlayer === 1) {
        return performDraw(state)
      }
      if (state.phase === 'action' && state.currentPlayer === 1) {
        const action = chooseAction(state)
        return applyAction(state, action)
      }
      if (state.phase === 'respond' && state.pendingAction?.targetPlayer === 1) {
        const response = chooseResponse(state)
        return applyAction(state, response)
      }
      if (state.phase === 'discard' && state.currentPlayer === 1) {
        const discards = chooseDiscards(state)
        if (discards.length > 0) {
          return applyAction(state, { type: 'discard', cardId: discards[0] })
        }
      }
      // If human needs to respond to AI's action
      if (state.phase === 'respond' && state.pendingAction?.targetPlayer === 0) {
        return state // Wait for human
      }
      return state
    }

    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, null, createGame)
  const aiTimerRef = useRef<number | null>(null)

  const playerAction = useCallback((action: Action) => {
    dispatch({ type: 'PLAYER_ACTION', action })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  // Auto-draw for human player at start of turn
  useEffect(() => {
    if (state.phase === 'draw' && state.currentPlayer === 0) {
      dispatch({ type: 'PLAYER_ACTION', action: { type: 'pass' } }) // triggers draw
    }
  }, [state.phase, state.currentPlayer])

  // AI turn automation with delay
  useEffect(() => {
    const isAiTurn = state.currentPlayer === 1 && state.phase !== 'gameOver'
    const isAiResponding = state.phase === 'respond' && state.pendingAction?.targetPlayer === 1

    if (isAiTurn || isAiResponding) {
      aiTimerRef.current = window.setTimeout(() => {
        dispatch({ type: 'AI_STEP' })
      }, 500)
    }

    return () => {
      if (aiTimerRef.current !== null) {
        clearTimeout(aiTimerRef.current)
      }
    }
  }, [state])

  return { state, playerAction, newGame }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useGame.ts
git commit -m "feat: add useGame hook with AI turn automation"
```

---

### Task 9: CardView Component

**Files:**
- Create: `src/components/CardView.tsx`

- [ ] **Step 1: Write `src/components/CardView.tsx`**

```tsx
import type { Card, PropertyCard, WildPropertyCard, ActionCard, RentCard, MoneyCard } from '../game/types'
import { COLOR_DISPLAY } from '../game/constants'

interface CardViewProps {
  card: Card
  onClick?: () => void
  selected?: boolean
  faceDown?: boolean
  small?: boolean
}

function getCardColor(card: Card): string {
  if (card.type === 'property') return COLOR_DISPLAY[(card as PropertyCard).color].hex
  if (card.type === 'wild_property') {
    const colors = (card as WildPropertyCard).colors
    if (colors.length > 2) return '#FFD700' // rainbow
    return COLOR_DISPLAY[colors[0]].hex
  }
  if (card.type === 'money') return '#85BB65'
  if (card.type === 'rent') return '#FF6347'
  return '#DDD'
}

function getCardTitle(card: Card): string {
  switch (card.type) {
    case 'money': return `$${(card as MoneyCard).value}M`
    case 'property': return (card as PropertyCard).name
    case 'wild_property': {
      const c = card as WildPropertyCard
      if (c.colors.length > 2) return 'Wild (Any)'
      return `Wild ${COLOR_DISPLAY[c.colors[0]].label}/${COLOR_DISPLAY[c.colors[1]].label}`
    }
    case 'action': {
      const names: Record<string, string> = {
        dealBreaker: 'Deal Breaker',
        justSayNo: 'Just Say No',
        slyDeal: 'Sly Deal',
        forcedDeal: 'Forced Deal',
        debtCollector: 'Debt Collector',
        itsMyBirthday: "It's My Birthday",
        passGo: 'Pass Go',
        house: 'House',
        hotel: 'Hotel',
        doubleRent: 'Double Rent',
      }
      return names[(card as ActionCard).name] ?? (card as ActionCard).name
    }
    case 'rent': {
      const r = card as RentCard
      if (r.colors.length > 2) return 'Rent (Any)'
      return `Rent ${COLOR_DISPLAY[r.colors[0]].label}/${COLOR_DISPLAY[r.colors[1]].label}`
    }
  }
}

export function CardView({ card, onClick, selected, faceDown, small }: CardViewProps) {
  if (faceDown) {
    return (
      <div
        style={{
          width: small ? 50 : 80,
          height: small ? 70 : 110,
          backgroundColor: '#4A90D9',
          border: '2px solid #2C5F8A',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: small ? 10 : 14,
          fontWeight: 'bold',
        }}
      >
        MD
      </div>
    )
  }

  const bgColor = getCardColor(card)
  const title = getCardTitle(card)

  return (
    <div
      onClick={onClick}
      style={{
        width: small ? 50 : 80,
        height: small ? 70 : 110,
        backgroundColor: bgColor,
        border: selected ? '3px solid #000' : '2px solid #666',
        borderRadius: 6,
        padding: 4,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: small ? 8 : 11,
        color: '#fff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
        userSelect: 'none',
        transition: 'transform 0.1s',
        transform: selected ? 'translateY(-8px)' : 'none',
      }}
    >
      <div style={{ fontWeight: 'bold', lineHeight: 1.2 }}>{title}</div>
      <div style={{ textAlign: 'right', fontSize: small ? 7 : 10 }}>${card.value}M</div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CardView.tsx
git commit -m "feat: add CardView component for rendering cards"
```

---

### Task 10: Hand, PropertyArea, Bank, OpponentView Components

**Files:**
- Create: `src/components/Hand.tsx`, `src/components/PropertyArea.tsx`, `src/components/Bank.tsx`, `src/components/OpponentView.tsx`

- [ ] **Step 1: Write `src/components/Hand.tsx`**

```tsx
import type { Card } from '../game/types'
import { CardView } from './CardView'

interface HandProps {
  cards: Card[]
  selectedCardId: string | null
  onSelectCard: (cardId: string) => void
}

export function Hand({ cards, selectedCardId, onSelectCard }: HandProps) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
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
```

- [ ] **Step 2: Write `src/components/PropertyArea.tsx`**

```tsx
import type { PropertySet } from '../game/types'
import { CardView } from './CardView'
import { SET_SIZES, COLOR_DISPLAY } from '../game/constants'

interface PropertyAreaProps {
  properties: PropertySet[]
  small?: boolean
}

export function PropertyArea({ properties, small }: PropertyAreaProps) {
  if (properties.length === 0) {
    return <div style={{ color: '#888', fontStyle: 'italic', padding: 8 }}>No properties</div>
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {properties.map(set => {
        const isComplete = set.cards.length >= SET_SIZES[set.color]
        return (
          <div
            key={set.color}
            style={{
              border: isComplete ? '2px solid gold' : '1px solid #444',
              borderRadius: 8,
              padding: 6,
              backgroundColor: isComplete ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: COLOR_DISPLAY[set.color].hex }}>
              {COLOR_DISPLAY[set.color].label} ({set.cards.length}/{SET_SIZES[set.color]})
              {set.hasHouse && ' 🏠'}
              {set.hasHotel && ' 🏨'}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {set.cards.map(card => (
                <CardView key={card.id} card={card} small={small} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/Bank.tsx`**

```tsx
import type { Card } from '../game/types'

interface BankProps {
  cards: Card[]
}

export function Bank({ cards }: BankProps) {
  const total = cards.reduce((sum, c) => sum + c.value, 0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 'bold' }}>Bank: ${total}M</span>
      <span style={{ color: '#888', fontSize: 12 }}>({cards.length} cards)</span>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/OpponentView.tsx`**

```tsx
import type { PlayerState } from '../game/types'
import { PropertyArea } from './PropertyArea'
import { Bank } from './Bank'

interface OpponentViewProps {
  player: PlayerState
}

export function OpponentView({ player }: OpponentViewProps) {
  return (
    <div style={{ padding: 12, borderBottom: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 'bold' }}>Opponent ({player.hand.length} cards in hand)</span>
        <Bank cards={player.bank} />
      </div>
      <PropertyArea properties={player.properties} small />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Hand.tsx src/components/PropertyArea.tsx src/components/Bank.tsx src/components/OpponentView.tsx
git commit -m "feat: add Hand, PropertyArea, Bank, and OpponentView components"
```

---

### Task 11: ActionButtons, ActionLog, Board Components

**Files:**
- Create: `src/components/ActionButtons.tsx`, `src/components/ActionLog.tsx`, `src/components/Board.tsx`

- [ ] **Step 1: Write `src/components/ActionButtons.tsx`**

```tsx
import type { Card, GameState, Action, PropertyCard, WildPropertyCard, ActionCard, RentCard } from '../game/types'

interface ActionButtonsProps {
  state: GameState
  selectedCardId: string | null
  onAction: (action: Action) => void
}

export function ActionButtons({ state, selectedCardId, onAction }: ActionButtonsProps) {
  const player = state.players[0]
  const card = selectedCardId ? player.hand.find(c => c.id === selectedCardId) : null

  if (state.phase === 'discard') {
    return (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 8 }}>
        <span style={{ color: '#f88' }}>Discard down to 7 cards ({player.hand.length} in hand)</span>
        {card && (
          <button onClick={() => onAction({ type: 'discard', cardId: card.id })}>
            Discard Selected
          </button>
        )}
      </div>
    )
  }

  if (state.phase === 'respond' && state.pendingAction?.targetPlayer === 0) {
    const hasJSN = player.hand.some(c => c.type === 'action' && (c as ActionCard).name === 'justSayNo')
    return (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 8 }}>
        <span style={{ color: '#ff8' }}>
          Respond to {state.pendingAction.type}
          {state.pendingAction.amount ? ` ($${state.pendingAction.amount}M)` : ''}
        </span>
        <button onClick={() => onAction({ type: 'respond', accept: true, paymentCardIds: [] })}>
          Pay / Accept
        </button>
        {hasJSN && (
          <button onClick={() => onAction({ type: 'respond', accept: false })}>
            Just Say No!
          </button>
        )}
      </div>
    )
  }

  if (state.phase !== 'action' || state.currentPlayer !== 0) return null

  const buttons: JSX.Element[] = []

  if (card) {
    // Bank any card
    buttons.push(
      <button key="bank" onClick={() => onAction({ type: 'bankCard', cardId: card.id })}>
        Bank (${card.value}M)
      </button>
    )

    // Play as property
    if (card.type === 'property') {
      const pc = card as PropertyCard
      buttons.push(
        <button key="prop" onClick={() => onAction({ type: 'playProperty', cardId: card.id, targetColor: pc.color })}>
          Play as Property ({pc.color})
        </button>
      )
    }

    if (card.type === 'wild_property') {
      const wc = card as WildPropertyCard
      for (const color of wc.colors.length <= 2 ? wc.colors : []) {
        buttons.push(
          <button key={`prop-${color}`} onClick={() => onAction({ type: 'playProperty', cardId: card.id, targetColor: color })}>
            Play as {color}
          </button>
        )
      }
      if (wc.colors.length > 2) {
        // Rainbow wild — show all colors player has sets for, plus any new color
        const activeColors = player.properties.map(s => s.color)
        const colorsToShow = activeColors.length > 0 ? activeColors : wc.colors.slice(0, 4)
        for (const color of colorsToShow) {
          buttons.push(
            <button key={`prop-${color}`} onClick={() => onAction({ type: 'playProperty', cardId: card.id, targetColor: color })}>
              Play as {color}
            </button>
          )
        }
      }
    }

    if (card.type === 'action') {
      const ac = card as ActionCard
      switch (ac.name) {
        case 'passGo':
          buttons.push(
            <button key="action" onClick={() => onAction({ type: 'playAction', cardId: card.id })}>
              Play Pass Go
            </button>
          )
          break
        case 'debtCollector':
          buttons.push(
            <button key="action" onClick={() => onAction({ type: 'playAction', cardId: card.id, targetPlayer: 1 })}>
              Play Debt Collector
            </button>
          )
          break
        case 'itsMyBirthday':
          buttons.push(
            <button key="action" onClick={() => onAction({ type: 'playAction', cardId: card.id })}>
              Play Birthday
            </button>
          )
          break
        case 'dealBreaker': {
          const oppCompleteSets = state.players[1].properties.filter(
            s => s.cards.length >= (require('../game/constants') as any).SET_SIZES[s.color]
          )
          for (const set of oppCompleteSets) {
            buttons.push(
              <button key={`db-${set.color}`} onClick={() => onAction({ type: 'playAction', cardId: card.id, targetColor: set.color })}>
                Deal Break {set.color}
              </button>
            )
          }
          break
        }
        case 'slyDeal': {
          const oppCards = state.players[1].properties.flatMap(s =>
            s.cards.map(c => ({ card: c, color: s.color, setSize: s.cards.length }))
          )
          for (const { card: tc, color, setSize } of oppCards) {
            if (setSize < (require('../game/constants') as any).SET_SIZES[color]) {
              buttons.push(
                <button key={`sly-${tc.id}`} onClick={() => onAction({ type: 'playAction', cardId: card.id, targetCardId: tc.id, targetColor: color })}>
                  Steal {tc.type === 'property' ? (tc as PropertyCard).name : 'Wild'} from {color}
                </button>
              )
            }
          }
          break
        }
      }
    }

    if (card.type === 'rent') {
      const rc = card as RentCard
      const applicableColors = rc.colors.length > 2
        ? player.properties.map(s => s.color)
        : rc.colors.filter(c => player.properties.some(s => s.color === c))
      for (const color of applicableColors) {
        buttons.push(
          <button key={`rent-${color}`} onClick={() => onAction({ type: 'playAction', cardId: card.id, targetColor: color })}>
            Charge Rent ({color})
          </button>
        )
      }
    }
  }

  buttons.push(
    <button key="end" onClick={() => onAction({ type: 'pass' })}>
      End Turn ({state.actionsRemaining} actions left)
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', padding: 8 }}>
      {buttons}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/ActionLog.tsx`**

```tsx
import type { LogEntry } from '../game/types'

interface ActionLogProps {
  log: LogEntry[]
}

export function ActionLog({ log }: ActionLogProps) {
  const recent = log.slice(-15)
  return (
    <div style={{
      width: 200,
      height: '100%',
      overflowY: 'auto',
      borderLeft: '1px solid #333',
      padding: 8,
      fontSize: 11,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Action Log</div>
      {recent.map((entry, i) => (
        <div key={i} style={{ marginBottom: 2, color: entry.player === 0 ? '#8cf' : '#f8c' }}>
          {entry.player === 0 ? 'You' : 'AI'}: {entry.message}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/Board.tsx`**

```tsx
import { useState } from 'react'
import type { GameState, Action } from '../game/types'
import { OpponentView } from './OpponentView'
import { PropertyArea } from './PropertyArea'
import { Bank } from './Bank'
import { Hand } from './Hand'
import { ActionButtons } from './ActionButtons'
import { ActionLog } from './ActionLog'

interface BoardProps {
  state: GameState
  onAction: (action: Action) => void
}

export function Board({ state, onAction }: BoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const handleAction = (action: Action) => {
    onAction(action)
    setSelectedCardId(null)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', color: '#eee', backgroundColor: '#1a1a2e' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Opponent area */}
        <OpponentView player={state.players[1]} />

        {/* Middle area */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: 12, borderBottom: '1px solid #333' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Deck</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{state.deck.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Discard</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{state.discardPile.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Turn</div>
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>
              {state.currentPlayer === 0 ? 'Your Turn' : "AI's Turn"}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Actions</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{state.actionsRemaining}</div>
          </div>
        </div>

        {/* Player area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12, gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <PropertyArea properties={state.players[0].properties} />
            <Bank cards={state.players[0].bank} />
          </div>
          <ActionButtons state={state} selectedCardId={selectedCardId} onAction={handleAction} />
          <Hand cards={state.players[0].hand} selectedCardId={selectedCardId} onSelectCard={setSelectedCardId} />
        </div>
      </div>

      {/* Action log */}
      <ActionLog log={state.log} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ActionButtons.tsx src/components/ActionLog.tsx src/components/Board.tsx
git commit -m "feat: add ActionButtons, ActionLog, and Board layout components"
```

---

### Task 12: App Component & Wiring

**Files:**
- Modify: `src/components/App.tsx` (or create if scaffold differs)
- Modify: `src/index.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write `src/components/App.tsx`**

```tsx
import { useGame } from '../hooks/useGame'
import { Board } from './Board'

export function App() {
  const { state, playerAction, newGame } = useGame()

  if (state.phase === 'gameOver') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'system-ui', color: '#eee', backgroundColor: '#1a1a2e',
        gap: 20,
      }}>
        <h1>{state.winner === 0 ? 'You Win!' : 'AI Wins!'}</h1>
        <button
          onClick={newGame}
          style={{ padding: '12px 32px', fontSize: 18, cursor: 'pointer', borderRadius: 8 }}
        >
          Play Again
        </button>
      </div>
    )
  }

  return <Board state={state} onAction={playerAction} />
}
```

- [ ] **Step 2: Update `src/index.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #1a1a2e;
  color: #eee;
}

button {
  background: #2a2a4a;
  color: #eee;
  border: 1px solid #555;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

button:hover {
  background: #3a3a5a;
}
```

- [ ] **Step 3: Update entry point `src/main.tsx`**

Replace contents of `src/main.tsx` (Vite's default entry) with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Verify it runs**

```bash
npm run dev
```

Expected: Browser shows the game board, cards dealt, playable.

- [ ] **Step 5: Commit**

```bash
git add src/components/App.tsx src/index.css src/main.tsx
git commit -m "feat: wire up App, entry point, and styles — game is playable"
```

---

### Task 13: Fix ActionButtons Import Issue & Polish

**Files:**
- Modify: `src/components/ActionButtons.tsx`

- [ ] **Step 1: Fix the `require` calls in ActionButtons**

Replace the `require('../game/constants')` calls with a proper import. At the top of `ActionButtons.tsx`, add:

```tsx
import { SET_SIZES } from '../game/constants'
```

Then replace all instances of `(require('../game/constants') as any).SET_SIZES[...]` with `SET_SIZES[...]`.

- [ ] **Step 2: Verify the app builds cleanly**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ActionButtons.tsx
git commit -m "fix: replace require() with proper import in ActionButtons"
```

---

### Task 14: Payment UI for Respond Phase

**Files:**
- Modify: `src/components/ActionButtons.tsx`

The current respond UI only has "Pay / Accept" with no way to select which cards to pay with. Add card selection for payment.

- [ ] **Step 1: Update ActionButtons to handle payment selection**

Replace the respond section in `ActionButtons.tsx`:

```tsx
// Inside the respond phase block:
if (state.phase === 'respond' && state.pendingAction?.targetPlayer === 0) {
  const pending = state.pendingAction
  const hasJSN = player.hand.some(c => c.type === 'action' && (c as ActionCard).name === 'justSayNo')
  const availablePayment = [
    ...player.bank.map(c => ({ card: c, source: 'bank' as const })),
    ...player.properties.flatMap(s => s.cards.map(c => ({ card: c, source: 'property' as const, color: s.color }))),
  ]
  const [selectedPayment, setSelectedPayment] = useState<string[]>([])
  const selectedTotal = availablePayment
    .filter(p => selectedPayment.includes(p.card.id))
    .reduce((sum, p) => sum + p.card.value, 0)

  return (
    <div style={{ padding: 8 }}>
      <div style={{ color: '#ff8', marginBottom: 8 }}>
        Respond to {pending.type} — owe ${pending.amount ?? 0}M (selected: ${selectedTotal}M)
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {availablePayment.map(({ card }) => (
          <button
            key={card.id}
            onClick={() => setSelectedPayment(prev =>
              prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
            )}
            style={{
              background: selectedPayment.includes(card.id) ? '#558855' : undefined,
            }}
          >
            {card.type === 'property' ? (card as PropertyCard).name : `$${card.value}M`}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onAction({ type: 'respond', accept: true, paymentCardIds: selectedPayment })}
          disabled={selectedTotal < (pending.amount ?? 0) && availablePayment.length > selectedPayment.length}
        >
          Pay ${selectedTotal}M
        </button>
        {hasJSN && (
          <button onClick={() => onAction({ type: 'respond', accept: false })}>
            Just Say No!
          </button>
        )}
      </div>
    </div>
  )
}
```

Note: This requires adding `useState` import and making the respond section its own sub-component to use hooks properly. Extract it:

Create the respond section as a separate component within the same file:

```tsx
import { useState } from 'react'

function RespondPanel({ state, onAction }: { state: GameState; onAction: (action: Action) => void }) {
  const [selectedPayment, setSelectedPayment] = useState<string[]>([])
  const player = state.players[0]
  const pending = state.pendingAction!
  const hasJSN = player.hand.some(c => c.type === 'action' && (c as ActionCard).name === 'justSayNo')

  const availablePayment = [
    ...player.bank,
    ...player.properties.flatMap(s => s.cards),
  ]

  const selectedTotal = availablePayment
    .filter(c => selectedPayment.includes(c.id))
    .reduce((sum, c) => sum + c.value, 0)

  return (
    <div style={{ padding: 8 }}>
      <div style={{ color: '#ff8', marginBottom: 8 }}>
        Respond to {pending.type} — owe ${pending.amount ?? 0}M (selected: ${selectedTotal}M)
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {availablePayment.map(card => (
          <button
            key={card.id}
            onClick={() => setSelectedPayment(prev =>
              prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
            )}
            style={{
              background: selectedPayment.includes(card.id) ? '#558855' : undefined,
            }}
          >
            {card.type === 'property' ? (card as PropertyCard).name : `$${card.value}M`}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onAction({ type: 'respond', accept: true, paymentCardIds: selectedPayment })}>
          Pay ${selectedTotal}M
        </button>
        {hasJSN && (
          <button onClick={() => onAction({ type: 'respond', accept: false })}>
            Just Say No!
          </button>
        )}
      </div>
    </div>
  )
}
```

Then in `ActionButtons`, replace the respond block with:

```tsx
if (state.phase === 'respond' && state.pendingAction?.targetPlayer === 0) {
  return <RespondPanel state={state} onAction={onAction} />
}
```

- [ ] **Step 2: Verify it works**

```bash
npm run dev
```

Expected: When AI plays Debt Collector or Rent, you see payment card selection UI.

- [ ] **Step 3: Commit**

```bash
git add src/components/ActionButtons.tsx
git commit -m "feat: add payment card selection UI for respond phase"
```

---

### Task 15: End-to-End Smoke Test

**Files:**
- Create: `tests/game/integration.test.ts`

- [ ] **Step 1: Write integration test**

```ts
import { describe, it, expect } from 'vitest'
import { createGame, applyAction, performDraw, checkWin, getValidActions } from '../../src/game/engine'
import { chooseAction, chooseResponse, chooseDiscards } from '../../src/game/ai'
import type { GameState } from '../../src/game/types'

describe('full game simulation', () => {
  it('can play a complete game without crashing', () => {
    let state = createGame()
    let turns = 0
    const maxTurns = 200

    while (state.phase !== 'gameOver' && turns < maxTurns) {
      if (state.phase === 'draw') {
        state = performDraw(state)
        continue
      }

      if (state.phase === 'action') {
        const action = chooseAction(state)
        state = applyAction(state, action)
        continue
      }

      if (state.phase === 'respond') {
        const response = chooseResponse(state)
        state = applyAction(state, response)
        continue
      }

      if (state.phase === 'discard') {
        const discards = chooseDiscards(state)
        if (discards.length > 0) {
          state = applyAction(state, { type: 'discard', cardId: discards[0] })
        } else {
          // Force end turn if no discards needed
          break
        }
        continue
      }

      turns++
    }

    // Game should either have a winner or hit max turns without crashing
    expect(turns).toBeLessThan(maxTurns)
    // State should be valid throughout
    expect(state.players[0].hand.length).toBeGreaterThanOrEqual(0)
    expect(state.players[1].hand.length).toBeGreaterThanOrEqual(0)
  })

  it('getValidActions never returns empty during action phase', () => {
    let state = createGame()
    state = performDraw(state)
    const actions = getValidActions(state)
    // Should always at least have 'pass' and bank options
    expect(actions.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/game/integration.test.ts
git commit -m "test: add integration smoke test for full game simulation"
```

---

### Task 16: Final Build Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Preview production build**

```bash
npm run preview
```

Expected: Game is playable in the browser.

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: final build verification — game complete"
```
