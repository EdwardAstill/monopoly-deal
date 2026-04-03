import type { Card, Color, MoneyCard, PropertyCard, WildPropertyCard, ActionCard, RentCard } from './types'

export const CARD_COLORS: Color[] = [
  'brown', 'lightBlue', 'pink', 'orange', 'red',
  'yellow', 'green', 'blue', 'railroad', 'utility',
]

export const SET_SIZES: Record<Color, number> = {
  brown: 2, lightBlue: 3, pink: 3, orange: 3, red: 3,
  yellow: 3, green: 3, blue: 2, railroad: 4, utility: 2,
}

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
  for (let i = 0; i < 3; i++) {
    cards.push({ id: nextId(), type: 'rent', colors: allColors, value: 3 })
  }
  return cards
}

cardId = 0
export const ALL_CARDS: Card[] = [
  ...moneyCards(),
  ...propertyCards(),
  ...wildPropertyCards(),
  ...actionCards(),
  ...rentCards(),
]
