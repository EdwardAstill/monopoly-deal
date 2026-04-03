import type { Card } from '../game/types'
import { COLOR_DISPLAY } from '../game/constants'

// Color palette
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
}

// Sizing
export const CARD_SIZE = { w: 80, h: 110 }
export const CARD_SIZE_SMALL = { w: 50, h: 70 }
export const BANK_CARD_SIZE = { w: 44, h: 28 }

// Action name color mapping
const ACTION_COLORS: Record<string, string> = {
  justSayNo: COLORS.red,
  dealBreaker: '#ef4444',
  slyDeal: '#f59e0b',
  forcedDeal: '#f59e0b',
  debtCollector: COLORS.purple,
  passGo: COLORS.purple,
  itsMyBirthday: '#ec4899',
  house: '#78716c',
  hotel: '#78716c',
  doubleRent: '#ef4444',
}

export function cardColor(card: Card): string {
  if (card.type === 'property') {
    return COLOR_DISPLAY[card.color].hex
  }
  if (card.type === 'money') {
    return COLORS.green
  }
  if (card.type === 'action') {
    return ACTION_COLORS[card.name] ?? COLORS.textPrimary
  }
  if (card.type === 'wild_property') {
    if (card.colors.length > 2) return '#a78bfa'
    return COLOR_DISPLAY[card.colors[0]].hex
  }
  if (card.type === 'rent') {
    if (card.colors.length > 2) return '#fb923c'
    return COLOR_DISPLAY[card.colors[0]].hex
  }
  return COLORS.textPrimary
}

export function splitColors(card: Card): [string, string] | null {
  if (card.type === 'wild_property' && card.colors.length === 2) {
    return [COLOR_DISPLAY[card.colors[0]].hex, COLOR_DISPLAY[card.colors[1]].hex]
  }
  if (card.type === 'rent' && card.colors.length === 2) {
    return [COLOR_DISPLAY[card.colors[0]].hex, COLOR_DISPLAY[card.colors[1]].hex]
  }
  return null
}

export function cardTooltip(card: Card): string {
  if (card.type === 'property') {
    return `${card.name} — ${COLOR_DISPLAY[card.color].label} property ($${card.value}M)`
  }
  if (card.type === 'money') {
    return `$${card.value}M money card`
  }
  if (card.type === 'wild_property') {
    const labels = card.colors.map(c => COLOR_DISPLAY[c].label).join(', ')
    return `Wild property — can be placed as: ${labels}`
  }
  if (card.type === 'rent') {
    const labels = card.colors.map(c => COLOR_DISPLAY[c].label).join(', ')
    return `Rent card — collect rent for: ${labels}`
  }
  if (card.type === 'action') {
    const descriptions: Record<string, string> = {
      dealBreaker: 'Steal a complete property set from any player',
      justSayNo: 'Cancel any action card played against you',
      slyDeal: 'Steal a single property card from any player',
      forcedDeal: 'Swap a property with any player',
      debtCollector: 'Collect $5M from any player',
      itsMyBirthday: 'Collect $2M from each player',
      passGo: 'Draw 2 extra cards',
      house: 'Add a house to a complete property set',
      hotel: 'Add a hotel to a set that already has a house',
      doubleRent: 'Double the rent value of a rent card played this turn',
    }
    return descriptions[card.name] ?? card.name
  }
  return ''
}

export function cardTypeLabel(card: Card): string {
  if (card.type === 'property') return 'Property'
  if (card.type === 'wild_property') return 'Wild'
  if (card.type === 'money') return 'Money'
  if (card.type === 'rent') return 'Rent'
  if (card.type === 'action') return 'Action'
  return ''
}

const ACTION_DISPLAY_NAMES: Record<string, string> = {
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

export function cardDisplayName(card: Card): string {
  if (card.type === 'property') return card.name
  if (card.type === 'money') return `$${card.value}M`
  if (card.type === 'wild_property') return 'Wild'
  if (card.type === 'rent') return 'Rent'
  if (card.type === 'action') return ACTION_DISPLAY_NAMES[card.name] ?? card.name
  return ''
}

export function cardSubtitle(card: Card): string {
  if (card.type === 'property') {
    return COLOR_DISPLAY[card.color].label
  }
  if (card.type === 'wild_property') {
    if (card.colors.length <= 2) {
      return card.colors.map(c => COLOR_DISPLAY[c].label).join(' / ')
    }
    return 'All Colors'
  }
  if (card.type === 'rent') {
    if (card.colors.length <= 2) {
      return card.colors.map(c => COLOR_DISPLAY[c].label).join(' / ')
    }
    return 'Any Color'
  }
  if (card.type === 'action') {
    const subtitles: Record<string, string> = {
      dealBreaker: 'Steal a full set',
      justSayNo: 'Cancel an action',
      slyDeal: 'Steal a property',
      forcedDeal: 'Swap a property',
      debtCollector: 'Collect $5M',
      itsMyBirthday: 'Collect $2M each',
      passGo: 'Draw 2 cards',
      house: 'Add to full set',
      hotel: 'Upgrade a house',
      doubleRent: 'Double rent value',
    }
    return subtitles[card.name] ?? ''
  }
  return ''
}
