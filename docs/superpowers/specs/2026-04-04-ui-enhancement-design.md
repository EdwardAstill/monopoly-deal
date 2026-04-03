# UI Enhancement Design

## Aesthetic

Clean modern, flat & minimal. Deep navy background, muted typography, color used sparingly via card borders and accents.

### Color Palette

- Background: `#0f172a`
- Card surface: `#1e293b`
- Text primary: `#e2e8f0`
- Text secondary: `rgba(255,255,255,0.35)`
- Labels/muted: `rgba(255,255,255,0.25)`
- Green accent (money/bank): `#4ade80`
- Blue accent (your turn): `#60a5fa`
- Pink accent (AI): `#f472b6`
- Borders: `rgba(255,255,255,0.06)` for structural, card's identity color for cards

### Typography

- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- Card type labels: 8px uppercase, letter-spacing 1px, `rgba(255,255,255,0.35)`
- Card names: 11px, weight 600
- Section labels: 9-10px uppercase, letter-spacing 1.5px, very muted
- No emoji icons anywhere — text-only card design

## Cards

### Standard Cards (property, money, action)

- Flat `#1e293b` background, rounded corners (8px)
- **Border color = card's identity color** at ~0.4 opacity, 1.5px
- Thin 3px color stripe at very top inside card (same color)
- Layout top-to-bottom: type label (uppercase), name (bold), subtitle, value (bottom-right)
- Size: 80x110px normal, 50x70px small

### Dual-Color Cards (rent, wild property)

- **Split colors, not gradient**: left half of border is one color, right half is the other
- Top stripe also split: left half one color, right half the other
- Achieved via `border-left`/`border-right` with different colors, and a flex container for the stripe

### Card States

- **Default**: no transform
- **Hover**: `translateY(-2px)`, subtle box-shadow
- **Selected**: `translateY(-8px)`, stronger box-shadow, border brightens to ~0.6-0.7 opacity, border widens to 2px

### Tooltips

- Dark floating panel (`#1e293b`, 1px border `rgba(255,255,255,0.1)`)
- Appears on hover after ~200ms delay
- Positioned above card with downward-pointing arrow
- Content: card effect description (e.g., "Collect $5M from any player", "Play as Blue or Green property")
- 10px font, `rgba(255,255,255,0.6)`

### Face-Down Cards

- Same card dimensions, `#1e293b` background
- Very subtle border `rgba(255,255,255,0.06)`
- Centered "MD" text in `rgba(255,255,255,0.1)`, 8px, bold

## Layout

Same structure as current (opponent top, player bottom, log right), polished.

### Top Bar

- Left: turn indicator ("Your Turn" in `#60a5fa` / "AI's Turn" in `#f472b6`) + "2 actions remaining" muted text
- Right: deck and discard pile info — small card icon + label + count stacked vertically
- Thin bottom border `rgba(255,255,255,0.06)`

### Opponent Zone

- Mirrors player zone exactly, same layout order: label, hand (face-down), properties, bank
- Uses small card sizes (50x70)
- Separated from player area by a thin divider

### Player Zone

- Label, properties, bank, action buttons, hand
- Properties and bank have section labels (9px uppercase muted)

### Action Log (right sidebar)

- 210px wide, left border
- Title: "Activity" (9px uppercase)
- Entries: 10px, player name colored (blue for you, pink for AI), message in muted text
- Auto-scrolls to bottom

## Bank Display

### Grouped by Denomination

- Each unique denomination shown as a small card (44x28px, rounded, `#1e293b` background, green border)
- Value displayed inside: "$1M", "$2M", etc.
- Quantity below: "x1", "x2", etc. in 9px muted text
- Total shown at the right: label "Total" + value in green

### Bank Action (when card selected)

- A dashed-border "+" button appears in the bank row
- Shows "+" icon and the card's value (e.g., "$3M")
- Same 44x28px size as bank cards
- Blue accent color for the dashed border
- Clicking it banks the selected card

## Interactive Property Placement

When a card is selected from hand that can be played as property:

### "+" Buttons on Existing Sets

- A 50x70px dashed-border slot appears at the end of each valid set's card row
- Large "+" in the center, blue accent color
- Hover brightens the border and background
- Clicking plays the card to that set

### "New Set" Option

- A wider dashed-border zone appears in the property row
- "+" icon + "New [color] set" text
- One per valid new color the card could start
- Clicking plays the card as a new set of that color

### When No Card Selected

- No "+" buttons shown — clean property display only

## Action Buttons

- Minimal row between bank and hand
- "End Turn (X left)" always visible during action phase
- Other contextual buttons appear based on selected card type (e.g., "Play Pass Go", "Charge Rent: Red")
- Style: `rgba(255,255,255,0.04)` background, subtle border, 11px text
- Hover: slightly brighter background

## Transitions

- Card hover/select: 0.15s ease transform + box-shadow
- Turn change: status text updates (no animation beyond the text change)
- No toast notifications — status bar only

## Files to Modify

- `src/index.css` — update global styles (background, button defaults)
- `src/components/CardView.tsx` — complete rewrite: flat style, colored borders, split colors, stripe, tooltip
- `src/components/PropertyArea.tsx` — add "+" placement slots, section label
- `src/components/Bank.tsx` — rewrite: grouped denominations with counts, bank-add button
- `src/components/Hand.tsx` — minor: gap/layout adjustments
- `src/components/Board.tsx` — new top bar with deck/discard, restructure zones, pass bank-add handler
- `src/components/OpponentView.tsx` — mirror player zone layout, use same Bank component
- `src/components/ActionButtons.tsx` — simplify (property placement moves to PropertyArea "+" buttons), cleaner button styling
- `src/components/ActionLog.tsx` — restyle: "Activity" title, entry styling
- `src/components/App.tsx` — polish game-over screen
