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
  colors: Color[]
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
  colors: Color[]
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
  amount?: number
  targetColor?: Color
  targetCardId?: string
  offeredCardId?: string
  respondingTo?: PendingAction
}

export interface PlayPropertyAction {
  type: 'playProperty'
  cardId: string
  targetColor: Color
}

export interface PlayActionAction {
  type: 'playAction'
  cardId: string
  targetPlayer?: PlayerIndex
  targetColor?: Color
  targetCardId?: string
  offeredCardId?: string
  doubleRentCardId?: string
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
  accept: boolean
  paymentCardIds?: string[]
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
