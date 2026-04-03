# UI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Monopoly Deal UI to a clean, flat, minimal aesthetic with colored-border cards, grouped bank display, interactive property placement via "+" buttons, and tooltips.

**Architecture:** Pure visual refactor — no game logic changes. Each component is rewritten in place. A shared `theme.ts` constants file avoids duplicating color/sizing values. The CardView rewrite is the foundation; other components depend on its new API.

**Tech Stack:** React 18, TypeScript, inline styles (consistent with existing codebase)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/theme.ts` | Create | Shared color palette, sizing, and style helper functions |
| `src/index.css` | Modify | Update background, button defaults, body font |
| `src/components/CardView.tsx` | Rewrite | Flat card with colored border, stripe, split colors, tooltip, no emojis |
| `src/components/Bank.tsx` | Rewrite | Grouped denominations with counts, "+ bank" button |
| `src/components/PropertyArea.tsx` | Rewrite | "+" placement slots, "new set" zones, section styling |
| `src/components/ActionLog.tsx` | Rewrite | "Activity" title, entry styling, auto-scroll |
| `src/components/Hand.tsx` | Modify | Layout adjustments |
| `src/components/OpponentView.tsx` | Rewrite | Mirror player zone layout |
| `src/components/Board.tsx` | Rewrite | Top bar with deck/discard, zone structure, wire up interactive placement |
| `src/components/ActionButtons.tsx` | Modify | Remove property placement buttons (moved to PropertyArea), restyle remaining buttons |
| `src/components/App.tsx` | Modify | Polish game-over screen |

---

### Task 1: Create Theme Constants

**Files:**
- Create: `src/components/theme.ts`

- [ ] **Step 1: Create the theme file**

```ts
import type { Card, Color } from '../game/types'
import { COLOR_DISPLAY } from '../game/constants'

// ── Palette ──
export const COLORS = {
  bg: '#0f172a',
  cardSurface: '#1e293b',
  textPrimary: '#e2e8f0',
  textSecondary: 'rgba(255,255,255,0.35)',
  textMuted: 'rgba(255,255,255,0.25)',
  textFaint: 'rgba(255,255,255,0.15)',
  borderStructural: 'rgba(255,255,255,0.06)',
  borderSubtle: 'rgba(255,255,255,0.04)',
  green: '#4ade80',
  blue: '#60a5fa',
  pink: '#f472b6',
  purple: 'rgba(168,85,247,1)',
  red: 'rgba(244,63,94,1)',
} as const

// ── Sizing ──
export const CARD_SIZE = { w: 80, h: 110 } as const
export const CARD_SIZE_SMALL = { w: 50, h: 70 } as const
export const BANK_CARD_SIZE = { w: 44, h: 28 } as const

// ── Card color helpers ──

/** Returns the accent color for a card's border/stripe. Opacity NOT included. */
export function cardColor(card: Card): string {
  switch (card.type) {
    case 'property':
      return COLOR_DISPLAY[card.color].hex
    case 'wild_property':
      return card.colors.length > 2 ? '#a78bfa' : COLOR_DISPLAY[card.colors[0]].hex
    case 'money':
      return COLORS.green
    case 'rent':
      return card.colors.length > 2 ? '#fb923c' : COLOR_DISPLAY[card.colors[0]].hex
    case 'action': {
      const map: Record<string, string> = {
        justSayNo: COLORS.red,
        dealBreaker: '#ef4444',
        slyDeal: '#f59e0b',
        forcedDeal: '#f59e0b',
        debtCollector: COLORS.purple,
        itsMyBirthday: '#ec4899',
        passGo: COLORS.purple,
        house: '#78716c',
        hotel: '#78716c',
        doubleRent: '#ef4444',
      }
      return map[card.name] ?? COLORS.purple
    }
  }
}

/** For dual-color cards, returns [left, right]. For single-color, returns null. */
export function splitColors(card: Card): [string, string] | null {
  if (card.type === 'wild_property' && card.colors.length === 2) {
    return [COLOR_DISPLAY[card.colors[0]].hex, COLOR_DISPLAY[card.colors[1]].hex]
  }
  if (card.type === 'rent' && card.colors.length === 2) {
    return [COLOR_DISPLAY[card.colors[0]].hex, COLOR_DISPLAY[card.colors[1]].hex]
  }
  return null
}

/** Tooltip text for a card. */
export function cardTooltip(card: Card): string {
  if (card.type === 'money') return `Bank this card for $${card.value}M`
  if (card.type === 'property') return `${COLOR_DISPLAY[card.color].label} property`
  if (card.type === 'wild_property') {
    if (card.colors.length > 2) return 'Play as any color property'
    return `Play as ${card.colors.map(c => COLOR_DISPLAY[c].label).join(' or ')} property`
  }
  if (card.type === 'rent') {
    if (card.colors.length > 2) return 'Charge rent on any color'
    return `Charge rent on ${card.colors.map(c => COLOR_DISPLAY[c].label).join(' or ')}`
  }
  if (card.type === 'action') {
    const tips: Record<string, string> = {
      justSayNo: 'Cancel any action played against you',
      dealBreaker: 'Steal a complete property set',
      slyDeal: 'Steal one property from an opponent',
      forcedDeal: 'Swap one of your properties for one of theirs',
      debtCollector: 'Collect $5M from any player',
      itsMyBirthday: 'Collect $2M from every player',
      passGo: 'Draw 2 extra cards',
      house: 'Add to a complete set for +$3M rent',
      hotel: 'Add to a set with a house for +$4M rent',
      doubleRent: 'Double the rent amount',
    }
    return tips[card.name] ?? ''
  }
  return ''
}

/** Type label shown on cards */
export function cardTypeLabel(card: Card): string {
  switch (card.type) {
    case 'property': return 'Property'
    case 'wild_property': return 'Wild'
    case 'money': return 'Money'
    case 'rent': return 'Rent'
    case 'action': return 'Action'
  }
}

/** Display name for a card */
export function cardDisplayName(card: Card): string {
  if (card.type === 'property') return card.name
  if (card.type === 'money') return `$${card.value}M`
  if (card.type === 'wild_property') return 'Wild'
  if (card.type === 'rent') return 'Rent'
  if (card.type === 'action') {
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
    return names[card.name] ?? card.name
  }
  return ''
}

/** Subtitle for a card (color names, brief description) */
export function cardSubtitle(card: Card): string {
  if (card.type === 'property') return COLOR_DISPLAY[card.color].label
  if (card.type === 'wild_property' && card.colors.length <= 2) {
    return card.colors.map(c => COLOR_DISPLAY[c].label).join(' / ')
  }
  if (card.type === 'rent' && card.colors.length <= 2) {
    return card.colors.map(c => COLOR_DISPLAY[c].label).join(' / ')
  }
  if (card.type === 'action') {
    const subs: Record<string, string> = {
      justSayNo: 'Cancel any action',
      dealBreaker: 'Steal a complete set',
      slyDeal: 'Steal 1 property',
      forcedDeal: 'Swap a property',
      debtCollector: 'Collect $5M',
      itsMyBirthday: 'Collect $2M',
      passGo: 'Draw 2 cards',
      house: '+$3M rent',
      hotel: '+$4M rent',
      doubleRent: '2x rent',
    }
    return subs[card.name] ?? ''
  }
  return ''
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/theme.ts
git commit -m "feat: add shared theme constants and card helper functions"
```

---

### Task 2: Update Global Styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Rewrite index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #0f172a;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

button {
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 5px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-family: inherit;
  transition: background 0.15s;
}

button:hover {
  background: rgba(255,255,255,0.08);
}
```

- [ ] **Step 2: Verify app still renders**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: update global styles to new theme"
```

---

### Task 3: Rewrite CardView

**Files:**
- Rewrite: `src/components/CardView.tsx`

This is the foundation component. All other components depend on it.

- [ ] **Step 1: Rewrite CardView.tsx**

```tsx
import React, { useState } from 'react'
import type { Card } from '../game/types'
import {
  COLORS, CARD_SIZE, CARD_SIZE_SMALL,
  cardColor, splitColors, cardTooltip, cardTypeLabel, cardDisplayName, cardSubtitle,
} from './theme'

interface CardViewProps {
  card: Card
  onClick?: () => void
  selected?: boolean
  faceDown?: boolean
  small?: boolean
}

export default function CardView({ card, onClick, selected, faceDown, small }: CardViewProps) {
  const [hovered, setHovered] = useState(false)
  const size = small ? CARD_SIZE_SMALL : CARD_SIZE
  const borderWidth = selected ? 2 : 1.5
  const borderOpacity = selected ? 0.7 : 0.4

  if (faceDown) {
    return (
      <div
        style={{
          width: size.w,
          height: size.h,
          borderRadius: 8,
          background: COLORS.cardSurface,
          border: `1px solid ${COLORS.borderStructural}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{
          fontSize: small ? 7 : 8,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.1)',
          letterSpacing: 1,
        }}>MD</span>
      </div>
    )
  }

  const dual = splitColors(card)
  const color = cardColor(card)
  const tooltip = cardTooltip(card)
  const typeLabel = cardTypeLabel(card)
  const name = cardDisplayName(card)
  const sub = cardSubtitle(card)
  const value = card.type === 'wild_property' && card.value === 0 ? null : `$${card.value}M`

  const borderStyle: React.CSSProperties = dual
    ? {
        borderLeft: `${borderWidth}px solid ${hexWithAlpha(dual[0], borderOpacity)}`,
        borderRight: `${borderWidth}px solid ${hexWithAlpha(dual[1], borderOpacity)}`,
        borderTop: `${borderWidth}px solid ${hexWithAlpha(dual[0], borderOpacity * 0.8)}`,
        borderBottom: `${borderWidth}px solid ${hexWithAlpha(dual[1], borderOpacity * 0.8)}`,
      }
    : {
        border: `${borderWidth}px solid ${hexWithAlpha(color, borderOpacity)}`,
      }

  const fs = (normal: number, sm: number) => small ? sm : normal

  return (
    <div
      style={{
        width: size.w,
        height: size.h,
        borderRadius: 8,
        background: COLORS.cardSurface,
        ...borderStyle,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? 5 : 8,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: selected ? 'translateY(-8px)' : hovered ? 'translateY(-2px)' : 'none',
        boxShadow: selected
          ? '0 8px 24px rgba(0,0,0,0.4)'
          : hovered
          ? '0 6px 20px rgba(0,0,0,0.3)'
          : 'none',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Color stripe */}
      {dual ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, display: 'flex' }}>
          <div style={{ flex: 1, background: hexWithAlpha(dual[0], 0.6) }} />
          <div style={{ flex: 1, background: hexWithAlpha(dual[1], 0.6) }} />
        </div>
      ) : (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: hexWithAlpha(color, 0.5),
        }} />
      )}

      {/* Top content */}
      <div>
        <div style={{
          fontSize: fs(8, 6),
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: COLORS.textSecondary,
        }}>{typeLabel}</div>
        <div style={{
          fontSize: fs(11, 8),
          fontWeight: 600,
          color: COLORS.textPrimary,
          lineHeight: 1.3,
        }}>{name}</div>
        {sub && (
          <div style={{
            fontSize: fs(8, 6),
            color: COLORS.textSecondary,
            marginTop: 1,
          }}>{sub}</div>
        )}
      </div>

      {/* Value */}
      {value && (
        <div style={{
          fontSize: fs(10, 8),
          color: 'rgba(255,255,255,0.45)',
          alignSelf: 'flex-end',
        }}>{value}</div>
      )}

      {/* Tooltip */}
      {hovered && tooltip && !small && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.cardSurface,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 10,
          color: 'rgba(255,255,255,0.6)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          zIndex: 10,
        }}>{tooltip}</div>
      )}
    </div>
  )
}

function hexWithAlpha(hex: string, alpha: number): string {
  // If already rgba, just return it
  if (hex.startsWith('rgba')) return hex
  // Convert hex to rgba
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: all 75 tests pass (CardView has no tests, but engine/ai tests should still pass)

- [ ] **Step 4: Commit**

```bash
git add src/components/CardView.tsx
git commit -m "feat: rewrite CardView with flat minimal style, colored borders, split colors, tooltips"
```

---

### Task 4: Rewrite Bank Component

**Files:**
- Rewrite: `src/components/Bank.tsx`

- [ ] **Step 1: Rewrite Bank.tsx**

```tsx
import type { Card } from '../game/types'
import { COLORS, BANK_CARD_SIZE } from './theme'

interface BankProps {
  cards: Card[]
  /** When set, shows a "+$XM" button that calls this callback */
  onBank?: () => void
  bankValue?: number
}

export default function Bank({ cards, onBank, bankValue }: BankProps) {
  // Group by value
  const groups = new Map<number, number>()
  let total = 0
  for (const c of cards) {
    total += c.value
    groups.set(c.value, (groups.get(c.value) ?? 0) + 1)
  }
  const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0])

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {sorted.map(([value, count]) => (
        <div key={value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: BANK_CARD_SIZE.w,
            height: BANK_CARD_SIZE.h,
            borderRadius: 5,
            background: COLORS.cardSurface,
            border: `1.5px solid rgba(74,222,128,0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.green,
          }}>${value}M</div>
          <div style={{ fontSize: 9, color: COLORS.textSecondary }}>x{count}</div>
        </div>
      ))}

      {onBank && bankValue != null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div
            onClick={onBank}
            style={{
              width: BANK_CARD_SIZE.w,
              height: BANK_CARD_SIZE.h,
              borderRadius: 5,
              border: '2px dashed rgba(96,165,250,0.3)',
              background: 'rgba(96,165,250,0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
              gap: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(96,165,250,0.6)'
              e.currentTarget.style.background = 'rgba(96,165,250,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'
              e.currentTarget.style.background = 'rgba(96,165,250,0.04)'
            }}
          >
            <span style={{ fontSize: 14, color: 'rgba(96,165,250,0.5)', fontWeight: 300, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 8, color: 'rgba(96,165,250,0.4)', fontWeight: 500 }}>${bankValue}M</span>
          </div>
        </div>
      )}

      {(sorted.length > 0 || (onBank && bankValue != null)) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, alignSelf: 'center', marginLeft: 4 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>Total</div>
          <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>${total}M</div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Bank.tsx
git commit -m "feat: rewrite Bank with grouped denominations and bank-add button"
```

---

### Task 5: Rewrite ActionLog

**Files:**
- Rewrite: `src/components/ActionLog.tsx`

- [ ] **Step 1: Rewrite ActionLog.tsx**

```tsx
import { useEffect, useRef } from 'react'
import type { LogEntry } from '../game/types'
import { COLORS } from './theme'

interface ActionLogProps {
  log: LogEntry[]
}

export default function ActionLog({ log }: ActionLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const entries = log.slice(-20)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div style={{
      width: 210,
      borderLeft: `1px solid ${COLORS.borderSubtle}`,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: COLORS.textMuted,
        marginBottom: 6,
      }}>Activity</div>
      {entries.map((entry, i) => (
        <div key={i} style={{
          fontSize: 10,
          color: COLORS.textSecondary,
          lineHeight: 1.6,
          padding: '2px 0',
        }}>
          <span style={{
            fontWeight: 600,
            color: entry.player === 0 ? COLORS.blue : COLORS.pink,
          }}>{entry.player === 0 ? 'You' : 'AI'}</span>{' '}
          {entry.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ActionLog.tsx
git commit -m "feat: rewrite ActionLog with auto-scroll and new styling"
```

---

### Task 6: Rewrite PropertyArea with Interactive Placement

**Files:**
- Rewrite: `src/components/PropertyArea.tsx`

- [ ] **Step 1: Rewrite PropertyArea.tsx**

```tsx
import type { PropertySet, Card, Color } from '../game/types'
import { COLOR_DISPLAY, SET_SIZES, RENT_VALUES } from '../game/constants'
import { COLORS, CARD_SIZE_SMALL } from './theme'
import CardView from './CardView'

interface PropertyAreaProps {
  properties: PropertySet[]
  small?: boolean
  /** ID of a wild card selected on the board (for move-wild) */
  selectedWildId?: string | null
  onSelectWild?: (cardId: string | null) => void
  /** Colors where the selected hand card can be played as property */
  validPlacements?: Color[]
  /** Called when user clicks a "+" to place the card in that color */
  onPlace?: (color: Color) => void
}

function getRentAmount(set: PropertySet): number {
  const rentTable = RENT_VALUES[set.color]
  const count = set.cards.length
  let rent = count > 0 ? (rentTable[Math.min(count, rentTable.length) - 1] ?? 0) : 0
  if (set.hasHouse) rent += 3
  if (set.hasHotel) rent += 4
  return rent
}

function AddSlot({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: CARD_SIZE_SMALL.w,
        height: CARD_SIZE_SMALL.h,
        borderRadius: 8,
        border: '2px dashed rgba(96,165,250,0.3)',
        background: 'rgba(96,165,250,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(96,165,250,0.6)'
        e.currentTarget.style.background = 'rgba(96,165,250,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'
        e.currentTarget.style.background = 'rgba(96,165,250,0.04)'
      }}
    >
      <span style={{ fontSize: 20, color: 'rgba(96,165,250,0.5)', fontWeight: 300 }}>+</span>
    </div>
  )
}

export default function PropertyArea({
  properties, small, selectedWildId, onSelectWild, validPlacements, onPlace,
}: PropertyAreaProps) {
  const existingColors = new Set(properties.map(s => s.color))
  const newSetColors = (validPlacements ?? []).filter(c => !existingColors.has(c))

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {properties.map(set => {
        const required = SET_SIZES[set.color]
        const hasNatural = set.cards.some(c => c.type === 'property')
        const complete = set.cards.length >= required && hasNatural
        const rent = getRentAmount(set)
        const canPlace = validPlacements?.includes(set.color)

        return (
          <div
            key={set.color}
            style={{
              borderRadius: 8,
              background: complete ? 'rgba(250,204,21,0.03)' : 'rgba(255,255,255,0.02)',
              border: complete
                ? '1px solid rgba(250,204,21,0.12)'
                : canPlace
                ? '1px solid rgba(96,165,250,0.15)'
                : `1px solid ${COLORS.borderSubtle}`,
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: small ? 8 : 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: COLOR_DISPLAY[set.color].hex,
              }}>
                {COLOR_DISPLAY[set.color].label}{' '}
                <span style={{ fontSize: small ? 7 : 9, color: COLORS.textSecondary, fontWeight: 400 }}>
                  ({set.cards.length}/{required}){complete ? ' \u2713' : ''}
                </span>
              </span>
              <span style={{ fontSize: small ? 8 : 10, color: COLORS.green, fontWeight: 600 }}>${rent}M</span>
            </div>
            {(set.hasHouse || set.hasHotel) && (
              <div style={{ fontSize: small ? 7 : 9, color: COLORS.textSecondary }}>
                {set.hasHouse && 'House (+$3M)'}
                {set.hasHouse && set.hasHotel && '  '}
                {set.hasHotel && 'Hotel (+$4M)'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              {set.cards.map(card => (
                <CardView
                  key={card.id}
                  card={card}
                  small={small ?? false}
                  selected={card.id === selectedWildId}
                  onClick={
                    card.type === 'wild_property' && onSelectWild
                      ? () => onSelectWild(selectedWildId === card.id ? null : card.id)
                      : undefined
                  }
                />
              ))}
              {canPlace && onPlace && <AddSlot onClick={() => onPlace(set.color)} />}
            </div>
          </div>
        )
      })}

      {/* New set zones */}
      {newSetColors.map(color => (
        <div
          key={`new-${color}`}
          onClick={() => onPlace?.(color)}
          style={{
            borderRadius: 8,
            border: '2px dashed rgba(96,165,250,0.2)',
            background: 'rgba(96,165,250,0.02)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'
            e.currentTarget.style.background = 'rgba(96,165,250,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(96,165,250,0.2)'
            e.currentTarget.style.background = 'rgba(96,165,250,0.02)'
          }}
        >
          <span style={{ fontSize: 16, color: 'rgba(96,165,250,0.4)' }}>+</span>
          <span style={{
            fontSize: 10,
            color: 'rgba(96,165,250,0.4)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>New {COLOR_DISPLAY[color].label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/PropertyArea.tsx
git commit -m "feat: rewrite PropertyArea with interactive placement slots"
```

---

### Task 7: Update Hand Component

**Files:**
- Modify: `src/components/Hand.tsx`

- [ ] **Step 1: Update Hand.tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hand.tsx
git commit -m "style: update Hand component for new theme"
```

---

### Task 8: Rewrite OpponentView

**Files:**
- Rewrite: `src/components/OpponentView.tsx`

- [ ] **Step 1: Rewrite OpponentView.tsx**

```tsx
import type { PlayerState } from '../game/types'
import { COLORS } from './theme'
import Bank from './Bank'
import PropertyArea from './PropertyArea'
import CardView from './CardView'

interface OpponentViewProps {
  player: PlayerState
}

const dummyCard = { id: 'dummy', type: 'money' as const, value: 0 as any }

export default function OpponentView({ player }: OpponentViewProps) {
  return (
    <div style={{
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      borderBottom: `1px solid ${COLORS.borderSubtle}`,
    }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: COLORS.textMuted,
      }}>Opponent</div>

      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: player.hand.length }, (_, i) => (
          <CardView key={i} card={dummyCard} faceDown small />
        ))}
      </div>

      <PropertyArea properties={player.properties} small />

      <Bank cards={player.bank} />
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/OpponentView.tsx
git commit -m "feat: rewrite OpponentView mirroring player zone layout"
```

---

### Task 9: Rewrite Board with Top Bar and Interactive Placement

**Files:**
- Rewrite: `src/components/Board.tsx`

This is the main wiring task — connects the new Bank "+" button and PropertyArea "+" placement to game actions.

- [ ] **Step 1: Rewrite Board.tsx**

```tsx
import { useState } from 'react'
import type { GameState, Action, Color } from '../game/types'
import { SET_SIZES } from '../game/constants'
import { COLORS } from './theme'
import OpponentView from './OpponentView'
import PropertyArea from './PropertyArea'
import Bank from './Bank'
import Hand from './Hand'
import ActionButtons from './ActionButtons'
import ActionLog from './ActionLog'

interface BoardProps {
  state: GameState
  onAction: (action: Action) => void
}

export default function Board({ state, onAction }: BoardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedWildId, setSelectedWildId] = useState<string | null>(null)

  const handleAction = (action: Action) => {
    setSelectedCardId(null)
    setSelectedWildId(null)
    onAction(action)
  }

  const player = state.players[0]
  const isPlayerAction = state.phase === 'action' && state.currentPlayer === 0

  // Determine valid property placements for selected card
  const selectedCard = selectedCardId ? player.hand.find(c => c.id === selectedCardId) ?? null : null
  let validPlacements: Color[] = []
  if (isPlayerAction && selectedCard) {
    if (selectedCard.type === 'property') {
      validPlacements = [selectedCard.color]
    } else if (selectedCard.type === 'wild_property') {
      validPlacements = selectedCard.colors
    }
  }

  // Move-wild: valid colors for a selected wild on the board
  let moveWildColors: Color[] = []
  if (isPlayerAction && selectedWildId) {
    const wildCard = player.properties.flatMap(s => s.cards).find(c => c.id === selectedWildId)
    if (wildCard?.type === 'wild_property') {
      const currentSet = player.properties.find(s => s.cards.some(c => c.id === selectedWildId))
      moveWildColors = wildCard.colors.filter(c => c !== currentSet?.color)
    }
  }

  const handlePlace = (color: Color) => {
    if (selectedCardId) {
      handleAction({ type: 'playProperty', cardId: selectedCardId, targetColor: color })
    }
  }

  const handleMoveWild = (color: Color) => {
    if (selectedWildId) {
      handleAction({ type: 'moveWild', cardId: selectedWildId, targetColor: color })
    }
  }

  const handleBank = () => {
    if (selectedCardId) {
      handleAction({ type: 'bankCard', cardId: selectedCardId })
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: COLORS.bg,
      color: COLORS.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: `1px solid ${COLORS.borderStructural}`,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: state.currentPlayer === 0 ? COLORS.blue : COLORS.pink,
            }}>
              {state.currentPlayer === 0 ? 'Your Turn' : "AI's Turn"}
            </span>
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
              · {state.actionsRemaining} actions remaining
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <DeckInfo label="Deck" count={state.deck.length} />
            <DeckInfo label="Discard" count={state.discardPile.length} />
          </div>
        </div>

        {/* Opponent */}
        <OpponentView player={state.players[1]} />

        {/* Divider */}
        <div style={{ height: 1, background: COLORS.borderSubtle, margin: '0 20px' }} />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Player zone */}
        <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.textMuted,
          }}>You</div>

          {/* Properties */}
          <PropertyArea
            properties={player.properties}
            selectedWildId={isPlayerAction ? selectedWildId : null}
            onSelectWild={isPlayerAction ? setSelectedWildId : undefined}
            validPlacements={validPlacements.length > 0 ? validPlacements : undefined}
            onPlace={validPlacements.length > 0 ? handlePlace : undefined}
          />

          {/* Move-wild buttons */}
          {selectedWildId && moveWildColors.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Move wild to:</span>
              {moveWildColors.map(color => (
                <button key={color} onClick={() => handleMoveWild(color)}>
                  {player.properties.find(s => s.color === color)
                    ? `${color} (${player.properties.find(s => s.color === color)!.cards.length}/${SET_SIZES[color]})`
                    : `New ${color}`}
                </button>
              ))}
              <button onClick={() => setSelectedWildId(null)}>Cancel</button>
            </div>
          )}

          {/* Bank */}
          <Bank
            cards={player.bank}
            onBank={isPlayerAction && selectedCard ? handleBank : undefined}
            bankValue={isPlayerAction && selectedCard ? selectedCard.value : undefined}
          />
        </div>

        {/* Action buttons */}
        <div style={{ padding: '8px 20px' }}>
          <ActionButtons state={state} selectedCardId={selectedCardId} onAction={handleAction} />
        </div>

        {/* Hand */}
        <div style={{ padding: '10px 20px 16px' }}>
          <div style={{
            fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.textFaint, marginBottom: 6,
          }}>Hand</div>
          <Hand
            cards={player.hand}
            selectedCardId={selectedCardId}
            onSelectCard={(id) => {
              setSelectedWildId(null)
              setSelectedCardId(prev => (prev === id ? null : id))
            }}
          />
        </div>
      </div>

      {/* Log */}
      <ActionLog log={state.log} />
    </div>
  )
}

function DeckInfo({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 24, height: 32, borderRadius: 4,
        background: COLORS.cardSurface, border: `1px solid ${COLORS.borderStructural}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700,
      }}>MD</div>
      <div>
        <div style={{ fontSize: 10, color: COLORS.textSecondary }}>{label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{count}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat: rewrite Board with top bar, zones, and interactive placement wiring"
```

---

### Task 10: Simplify ActionButtons

**Files:**
- Modify: `src/components/ActionButtons.tsx`

Remove property placement buttons (now handled by PropertyArea "+" slots and Bank "+" button). Keep action card buttons, rent, forced deal modal, respond panel, discard.

- [ ] **Step 1: Rewrite ActionButtons.tsx**

```tsx
import { useState } from 'react'
import type { GameState, Action, Card, Color } from '../game/types'
import { SET_SIZES } from '../game/constants'
import { COLOR_DISPLAY } from '../game/constants'
import { COLORS } from './theme'

interface ActionButtonsProps {
  state: GameState
  selectedCardId: string | null
  onAction: (action: Action) => void
}

interface RespondPanelProps {
  state: GameState
  onAction: (action: Action) => void
}

function RespondPanel({ state, onAction }: RespondPanelProps) {
  const [selectedPayment, setSelectedPayment] = useState<string[]>([])
  const player = state.players[0]
  const pending = state.pendingAction!

  const paymentCards: Card[] = [
    ...player.bank,
    ...player.properties.flatMap(set => set.cards),
  ]

  const hasJustSayNo = player.hand.some(
    c => c.type === 'action' && c.name === 'justSayNo'
  )

  const toggleCard = (id: string) => {
    setSelectedPayment(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const payTotal = paymentCards
    .filter(c => selectedPayment.includes(c.id))
    .reduce((sum, c) => sum + c.value, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: COLORS.pink, fontWeight: 600, fontSize: 12 }}>
        Respond to {pending.type}
        {pending.amount != null ? ` ($${pending.amount}M)` : ''}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Select cards to pay:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {paymentCards.map(card => (
          <button
            key={card.id}
            onClick={() => toggleCard(card.id)}
            style={{
              background: selectedPayment.includes(card.id) ? 'rgba(255,255,255,0.08)' : undefined,
              border: selectedPayment.includes(card.id) ? `1px solid ${COLORS.blue}` : undefined,
            }}
          >
            ${card.value}M{' '}
            {card.type === 'property' ? card.name : card.type === 'wild_property' ? 'Wild' : ''}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Total: ${payTotal}M</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onAction({ type: 'respond', accept: true, paymentCardIds: selectedPayment })}>
          Pay
        </button>
        {hasJustSayNo && (
          <button
            onClick={() => onAction({ type: 'respond', accept: false })}
            style={{ background: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)', color: COLORS.red }}
          >
            Just Say No!
          </button>
        )}
      </div>
    </div>
  )
}

interface ForcedDealModalProps {
  state: GameState
  cardId: string
  onAction: (action: Action) => void
  onCancel: () => void
}

function ForcedDealModal({ state, cardId, onAction, onCancel }: ForcedDealModalProps) {
  const [takeCard, setTakeCard] = useState<{ id: string; color: Color } | null>(null)
  const player = state.players[0]

  const oppCards = state.players[1].properties.flatMap(set => {
    const isComplete = set.cards.length >= SET_SIZES[set.color] && set.cards.some(c => c.type === 'property')
    if (isComplete) return []
    return set.cards.map(c => ({ card: c, color: set.color }))
  })

  const myCards = player.properties.flatMap(set =>
    set.cards.map(c => ({ card: c, color: set.color }))
  )

  const labelFor = (card: Card, color: Color) =>
    card.type === 'property' ? card.name : `${COLOR_DISPLAY[color].label} Wild`

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onCancel}>
      <div style={{
        background: COLORS.bg, border: `1px solid ${COLORS.borderStructural}`, borderRadius: 10,
        padding: 20, minWidth: 320, maxWidth: 460,
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Forced Deal</h3>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 }}>
            {!takeCard ? '1. Pick a card to take from opponent:' : '2. Pick a card to give in exchange:'}
          </div>

          {!takeCard && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {oppCards.length === 0 && (
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>No stealable properties</span>
              )}
              {oppCards.map(({ card, color }) => (
                <button key={card.id} onClick={() => setTakeCard({ id: card.id, color })}>
                  {labelFor(card, color)}
                </button>
              ))}
            </div>
          )}

          {takeCard && (
            <>
              <div style={{
                fontSize: 11, color: COLORS.blue, marginBottom: 8, padding: '4px 8px',
                background: 'rgba(96,165,250,0.08)', borderRadius: 4,
              }}>
                Taking: {labelFor(
                  oppCards.find(c => c.card.id === takeCard.id)?.card ?? {} as Card,
                  takeCard.color
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {myCards.length === 0 && (
                  <span style={{ fontSize: 11, color: COLORS.textSecondary }}>No properties to offer</span>
                )}
                {myCards.map(({ card, color }) => (
                  <button
                    key={card.id}
                    onClick={() =>
                      onAction({
                        type: 'playAction',
                        cardId,
                        targetPlayer: 1,
                        targetColor: takeCard.color,
                        targetCardId: takeCard.id,
                        offeredCardId: card.id,
                      })
                    }
                  >
                    {labelFor(card, color)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {takeCard && <button onClick={() => setTakeCard(null)}>Back</button>}
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function ActionButtons({ state, selectedCardId, onAction }: ActionButtonsProps) {
  const [showForcedDeal, setShowForcedDeal] = useState(false)
  const { phase, currentPlayer, actionsRemaining, pendingAction, players } = state
  const player = players[0]

  // Discard phase
  if (phase === 'discard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: COLORS.pink, fontSize: 12, fontWeight: 600 }}>
          Too many cards! Discard down to 7.
        </div>
        {selectedCardId && (
          <button onClick={() => onAction({ type: 'discard', cardId: selectedCardId })}>
            Discard Selected
          </button>
        )}
      </div>
    )
  }

  // Respond phase
  if (phase === 'respond' && pendingAction?.targetPlayer === 0) {
    return <RespondPanel state={state} onAction={onAction} />
  }

  // Action phase, player 0's turn
  if (phase === 'action' && currentPlayer === 0) {
    const selectedCard = selectedCardId
      ? player.hand.find(c => c.id === selectedCardId) ?? null
      : null

    const buttons: React.ReactNode[] = []

    // End turn always
    buttons.push(
      <button key="endTurn" onClick={() => onAction({ type: 'pass' })}>
        End Turn ({actionsRemaining} left)
      </button>
    )

    if (selectedCard) {
      // Action cards
      if (selectedCard.type === 'action') {
        const name = selectedCard.name
        if (name === 'passGo') {
          buttons.push(
            <button key="passGo" onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id })}>
              Play Pass Go
            </button>
          )
        } else if (name === 'debtCollector') {
          buttons.push(
            <button key="debtCollector" onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id, targetPlayer: 1 })}>
              Debt Collector (target AI)
            </button>
          )
        } else if (name === 'itsMyBirthday') {
          buttons.push(
            <button key="birthday" onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id })}>
              It's My Birthday!
            </button>
          )
        } else if (name === 'dealBreaker') {
          players[1].properties.forEach(set => {
            if (set.cards.length >= SET_SIZES[set.color]) {
              buttons.push(
                <button key={`db-${set.color}`} onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id, targetPlayer: 1, targetColor: set.color })}>
                  Deal Breaker: AI's {COLOR_DISPLAY[set.color].label}
                </button>
              )
            }
          })
        } else if (name === 'slyDeal') {
          players[1].properties.forEach(set => {
            if (set.cards.length < SET_SIZES[set.color]) {
              set.cards.forEach(card => {
                buttons.push(
                  <button key={`sly-${card.id}`} onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id, targetPlayer: 1, targetColor: set.color, targetCardId: card.id })}>
                    Sly Deal: {card.type === 'property' ? card.name : `${COLOR_DISPLAY[set.color].label} wild`}
                  </button>
                )
              })
            }
          })
        } else if (name === 'forcedDeal') {
          buttons.push(
            <button key="forcedDeal" onClick={() => setShowForcedDeal(true)}>
              Play Forced Deal
            </button>
          )
        } else if (name === 'house') {
          player.properties.forEach(set => {
            const isComplete = set.cards.length >= SET_SIZES[set.color] && set.cards.some(c => c.type === 'property')
            if (isComplete && !set.hasHouse) {
              buttons.push(
                <button key={`house-${set.color}`} onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id, targetColor: set.color })}>
                  House on {COLOR_DISPLAY[set.color].label}
                </button>
              )
            }
          })
        } else if (name === 'hotel') {
          player.properties.forEach(set => {
            const isComplete = set.cards.length >= SET_SIZES[set.color] && set.cards.some(c => c.type === 'property')
            if (isComplete && set.hasHouse && !set.hasHotel) {
              buttons.push(
                <button key={`hotel-${set.color}`} onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id, targetColor: set.color })}>
                  Hotel on {COLOR_DISPLAY[set.color].label}
                </button>
              )
            }
          })
        } else if (name === 'doubleRent') {
          const rentCards = player.hand.filter(c => c.type === 'rent')
          if (rentCards.length > 0 && actionsRemaining >= 2) {
            const playerColors = new Set(player.properties.map(s => s.color))
            rentCards.forEach(rentCard => {
              if (rentCard.type !== 'rent') return
              rentCard.colors
                .filter(color => playerColors.has(color))
                .forEach(color => {
                  buttons.push(
                    <button
                      key={`dr-${rentCard.id}-${color}`}
                      onClick={() => onAction({ type: 'playAction', cardId: rentCard.id, targetColor: color, doubleRentCardId: selectedCard.id })}
                      style={{ background: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)', color: COLORS.red }}
                    >
                      Double Rent: {COLOR_DISPLAY[color].label}
                    </button>
                  )
                })
            })
          } else {
            buttons.push(
              <span key="dr-info" style={{ fontSize: 11, color: COLORS.textSecondary, alignSelf: 'center' }}>
                {actionsRemaining < 2 ? 'Need 2 actions for Double Rent' : 'No rent cards to combine with'}
              </span>
            )
          }
        }
      } else if (selectedCard.type === 'rent') {
        const playerColors = new Set(player.properties.map(s => s.color))
        const doubleRentCard = player.hand.find(
          c => c.type === 'action' && c.name === 'doubleRent' && c.id !== selectedCard.id
        )
        const canDouble = doubleRentCard && actionsRemaining >= 2

        selectedCard.colors
          .filter(color => playerColors.has(color))
          .forEach(color => {
            buttons.push(
              <button key={`rent-${color}`} onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id, targetColor: color })}>
                Charge Rent: {COLOR_DISPLAY[color].label}
              </button>
            )
            if (canDouble) {
              buttons.push(
                <button
                  key={`rent-d-${color}`}
                  onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id, targetColor: color, doubleRentCardId: doubleRentCard.id })}
                  style={{ background: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)', color: COLORS.red }}
                >
                  Double Rent: {COLOR_DISPLAY[color].label}
                </button>
              )
            }
          })
      }
      // Property and wild_property placement is now handled by PropertyArea "+" slots
      // Bank is now handled by Bank "+" button
    }

    const handleForcedDealAction = (action: Action) => {
      setShowForcedDeal(false)
      onAction(action)
    }

    return (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {buttons}
        </div>
        {showForcedDeal && selectedCard && (
          <ForcedDealModal
            state={state}
            cardId={selectedCard.id}
            onAction={handleForcedDealAction}
            onCancel={() => setShowForcedDeal(false)}
          />
        )}
      </>
    )
  }

  return null
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: all 75 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/ActionButtons.tsx
git commit -m "feat: simplify ActionButtons, move property/bank placement to dedicated components"
```

---

### Task 11: Polish Game Over Screen

**Files:**
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Update App.tsx**

```tsx
import { useGame } from '../hooks/useGame'
import { COLORS } from './theme'
import Board from './Board'

export function App() {
  const { state, playerAction, newGame } = useGame()

  if (state.phase === 'gameOver') {
    const won = state.winner === 0
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: COLORS.bg, color: COLORS.textPrimary, gap: 16,
      }}>
        <div style={{
          fontSize: 14,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color: COLORS.textSecondary,
        }}>Game Over</div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: won ? COLORS.green : COLORS.pink,
        }}>{won ? 'You Win!' : 'AI Wins!'}</h1>
        <button
          onClick={newGame}
          style={{ padding: '10px 28px', fontSize: 13 }}
        >
          Play Again
        </button>
      </div>
    )
  }

  return <Board state={state} onAction={playerAction} />
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/App.tsx
git commit -m "style: polish game-over screen"
```

---

### Task 12: Final Integration Test

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: all 75 tests pass

- [ ] **Step 2: Run production build**

Run: `npx vite build`
Expected: build succeeds with no errors

- [ ] **Step 3: Run dev server and visually verify**

Run: `npx vite dev`
Verify in browser:
- Cards show flat style with colored borders
- Dual-color cards have split borders (left/right, not gradient)
- Hovering shows tooltip above card
- Selecting a property/wild card shows "+" slots on valid sets and "new set" zones
- Selecting any card shows "+" bank button with amount
- Bank shows grouped denominations with counts
- Opponent zone mirrors player zone
- Deck/discard in top-right
- Action log auto-scrolls

- [ ] **Step 4: Commit any fixes if needed**
