# Monopoly Deal — Browser Game Design

## Overview

A 1v1 Monopoly Deal card game playable in the browser against a heuristic AI opponent. Built with React + TypeScript. Clean, minimal visual style with flat colors and simple card shapes. Follows official Monopoly Deal rules exactly.

## Architecture

Single state object architecture. One central `GameState` object holds all game data. A pure `engine` module validates and applies actions. React UI renders state and dispatches actions. AI reads the same state to pick actions.

```
src/
  game/           — pure game logic, no React
    types.ts        — all type definitions
    deck.ts         — card definitions, shuffle, deal
    engine.ts       — applyAction(), getValidActions(), win check
    ai.ts           — heuristic opponent
  components/     — React UI
    App.tsx         — game flow (menu → game → win screen)
    Board.tsx       — main game layout
    Hand.tsx        — player's hand (clickable cards)
    PropertyArea.tsx — property sets display
    Bank.tsx        — banked money
    OpponentView.tsx — opponent's hidden hand + visible properties/bank
    ActionLog.tsx   — recent moves feed
  utils/
    constants.ts    — card counts, color sets, rent values
```

Key separation: `game/` is pure TypeScript with zero React imports. Entire game logic is testable without rendering.

## Game State & Core Types

```ts
type CardType = 'money' | 'property' | 'action' | 'rent' | 'wild_property'

type GameState = {
  deck: Card[]
  discardPile: Card[]
  players: [PlayerState, PlayerState]  // index 0 = human, 1 = AI
  currentPlayer: 0 | 1
  actionsRemaining: number  // 3 per turn
  phase: 'draw' | 'action' | 'respond' | 'discard' | 'gameOver'
  pendingAction: PendingAction | null
}

type PlayerState = {
  hand: Card[]
  bank: Card[]
  properties: PropertySet[]  // grouped by color
}
```

### Turn Flow

Draw 2 → play up to 3 cards (or pass) → discard down to 7 → next player.

The `phase` field drives the UI — determines what to show and what's clickable. The `respond` phase handles interactive moments (Just Say No chains, Deal Breaker targets, etc.). The `pendingAction` holds details when a player needs to respond.

## AI Strategy

The AI evaluates `getValidActions(state)` and scores each action by priority:

1. **Complete a set** — play property/wild that finishes a color group
2. **Play property toward a set** — prefer colors closest to completion
3. **Use high-value action cards** — Deal Breaker on complete sets, Sly Deal on cards that complete AI's sets, rent on colors with most properties down
4. **Bank money** — default safe play for remaining actions
5. **Pass** — if nothing useful to play

Responses: play Just Say No if available (unless protecting a low-value card). When forced to give up cards, sacrifice from least-complete sets first.

Discard: drop lowest-value cards that don't contribute to near-complete sets.

Deterministic beyond deck shuffle. Competent but not frustrating.

## UI Layout

Top-down table view:

```
┌─────────────────────────────────────┐
│  Opponent: [hand count] [bank total]│
│  [property sets]                    │
├─────────────────────────────────────┤
│  Deck (count)  │  Discard  │  Log   │
├─────────────────────────────────────┤
│  Your property sets     [bank total]│
│  [your hand - clickable cards]      │
│  [action buttons: Play / Bank / End]│
└─────────────────────────────────────┘
```

- Cards: flat colored rectangles with text (name + value)
- Property sets: color-coded groups, complete sets get subtle border/highlight
- Hand: fans out at bottom, highlight on hover, click to select
- After selecting: context buttons appear (Play as Property, Play as Action, Bank as Money for dual-purpose cards)
- Action log: scrolls on the right showing recent moves
- AI turns: ~500ms delay per action so player can follow

## Card Definitions (106 cards)

### Money (20)
1M ×6, 2M ×5, 3M ×3, 4M ×3, 5M ×2, 10M ×1

### Properties (28)
2-3 per color across 10 color groups: Brown (2), Light Blue (3), Pink (3), Orange (3), Red (3), Yellow (3), Green (3), Blue (2), Railroad (4), Utility (2)

### Wild Properties (11)
2-color wilds (one per adjacent color pair) + 2 rainbow wilds (any color)

### Action Cards (34)
Deal Breaker ×2, Just Say No ×3, Sly Deal ×3, Forced Deal ×3, Debt Collector ×3, It's My Birthday ×3, Pass Go ×10, House ×3, Hotel ×2, Double Rent ×2

### Rent Cards (13)
2-color rent ×2 each for most pairs + 3 wild rent (any color)

Each card has a money value for banking. Sets require specific counts to complete (Brown=2, Blue=2, Utility=2, Railroad=4, all others=3).

## Deck Exhaustion

When the draw deck is empty, shuffle the discard pile to form a new deck (official rule).

## Win Condition

First player to complete 3 full property sets wins. Checked after every action.

## Tech Stack

- React 18 + TypeScript
- Vite for build/dev
- No external state management (useReducer + context)
- No backend — entirely client-side
