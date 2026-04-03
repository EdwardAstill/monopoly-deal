import { useState } from 'react'
import type { GameState, Action, Card, Color } from '../game/types'
import { SET_SIZES, COLOR_DISPLAY } from '../game/constants'
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
      <div style={{ color: COLORS.pink, fontWeight: 'bold' }}>
        Respond to {pending.type}
        {pending.amount != null ? ` ($${pending.amount})` : ''}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Select cards to pay:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {paymentCards.map(card => (
          <button
            key={card.id}
            onClick={() => toggleCard(card.id)}
            style={{
              padding: '2px 6px',
              fontSize: 11,
              background: selectedPayment.includes(card.id) ? 'rgba(96,165,250,0.15)' : 'transparent',
              color: COLORS.textSecondary,
              border: selectedPayment.includes(card.id)
                ? `1px solid ${COLORS.blue}`
                : `1px solid ${COLORS.borderStructural}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            ${card.value}{' '}
            {card.type === 'property'
              ? card.name
              : card.type === 'wild_property'
              ? 'Wild'
              : `$${card.value}`}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Pay total: ${payTotal}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() =>
            onAction({ type: 'respond', accept: true, paymentCardIds: selectedPayment })
          }
        >
          Pay
        </button>
        {hasJustSayNo && (
          <button
            onClick={() => onAction({ type: 'respond', accept: false })}
            style={{
              background: 'rgba(244,63,94,0.15)',
              borderColor: 'rgba(244,63,94,0.3)',
              color: COLORS.red,
            }}
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
        background: COLORS.bg,
        border: `1px solid ${COLORS.borderStructural}`,
        borderRadius: 10,
        padding: 20, minWidth: 320, maxWidth: 460,
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Forced Deal</h3>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 }}>
            {!takeCard ? '1. Pick a card to take from opponent:' : '2. Pick a card to give in exchange:'}
          </div>

          {!takeCard && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {oppCards.length === 0 && (
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>No stealable properties</span>
              )}
              {oppCards.map(({ card, color }) => (
                <button
                  key={card.id}
                  onClick={() => setTakeCard({ id: card.id, color })}
                >
                  {labelFor(card, color)}
                </button>
              ))}
            </div>
          )}

          {takeCard && (
            <>
              <div style={{
                fontSize: 12, color: COLORS.blue, marginBottom: 8, padding: '4px 8px',
                background: 'rgba(96,165,250,0.1)', borderRadius: 4,
              }}>
                Taking: {labelFor(
                  oppCards.find(c => c.card.id === takeCard.id)?.card ?? {} as Card,
                  takeCard.color
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {myCards.length === 0 && (
                  <span style={{ fontSize: 11, color: COLORS.textSecondary }}>You have no properties to offer</span>
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
          {takeCard && (
            <button onClick={() => setTakeCard(null)}>
              Back
            </button>
          )}
          <button onClick={onCancel}>
            Cancel
          </button>
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
        <div style={{ color: COLORS.pink, fontSize: 12 }}>
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

  // Respond phase targeting player 0
  if (phase === 'respond' && pendingAction?.targetPlayer === 0) {
    return <RespondPanel state={state} onAction={onAction} />
  }

  // Action phase, player 0's turn
  if (phase === 'action' && currentPlayer === 0) {
    const selectedCard = selectedCardId
      ? player.hand.find(c => c.id === selectedCardId) ?? null
      : null

    const buttons: React.ReactNode[] = []

    // Always: End Turn
    buttons.push(
      <button
        key="endTurn"
        onClick={() => onAction({ type: 'pass' })}
      >
        End Turn ({actionsRemaining} remaining)
      </button>
    )

    if (selectedCard) {
      if (selectedCard.type === 'action') {
        const name = selectedCard.name
        if (name === 'passGo') {
          buttons.push(
            <button
              key="passGo"
              onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id })}
            >
              Play Pass Go
            </button>
          )
        } else if (name === 'debtCollector') {
          buttons.push(
            <button
              key="debtCollector"
              onClick={() =>
                onAction({
                  type: 'playAction',
                  cardId: selectedCard.id,
                  targetPlayer: 1,
                })
              }
            >
              Debt Collector (target AI)
            </button>
          )
        } else if (name === 'itsMyBirthday') {
          buttons.push(
            <button
              key="birthday"
              onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id })}
            >
              It&apos;s My Birthday!
            </button>
          )
        } else if (name === 'dealBreaker') {
          players[1].properties.forEach(set => {
            const isComplete = set.cards.length >= SET_SIZES[set.color]
            if (isComplete) {
              buttons.push(
                <button
                  key={`dealBreaker-${set.color}`}
                  onClick={() =>
                    onAction({
                      type: 'playAction',
                      cardId: selectedCard.id,
                      targetPlayer: 1,
                      targetColor: set.color,
                    })
                  }
                >
                  Deal Breaker: AI&apos;s {COLOR_DISPLAY[set.color].label} set
                </button>
              )
            }
          })
        } else if (name === 'slyDeal') {
          players[1].properties.forEach(set => {
            const isComplete = set.cards.length >= SET_SIZES[set.color]
            if (!isComplete) {
              set.cards.forEach(card => {
                buttons.push(
                  <button
                    key={`slyDeal-${card.id}`}
                    onClick={() =>
                      onAction({
                        type: 'playAction',
                        cardId: selectedCard.id,
                        targetPlayer: 1,
                        targetColor: set.color,
                        targetCardId: card.id,
                      })
                    }
                  >
                    Sly Deal:{' '}
                    {card.type === 'property' ? card.name : `${COLOR_DISPLAY[set.color].label} Wild`}
                  </button>
                )
              })
            }
          })
        } else if (name === 'forcedDeal') {
          buttons.push(
            <button
              key="forcedDeal"
              onClick={() => setShowForcedDeal(true)}
            >
              Play Forced Deal
            </button>
          )
        } else if (name === 'house') {
          // One button per complete set without a house
          player.properties.forEach(set => {
            const isComplete = set.cards.length >= SET_SIZES[set.color]
            const hasHouse = set.cards.some(c => c.type === 'action' && c.name === 'house')
            if (isComplete && !hasHouse) {
              buttons.push(
                <button
                  key={`house-${set.color}`}
                  onClick={() =>
                    onAction({
                      type: 'playAction',
                      cardId: selectedCard.id,
                      targetColor: set.color,
                    })
                  }
                >
                  Add House to {COLOR_DISPLAY[set.color].label}
                </button>
              )
            }
          })
          if (!player.properties.some(set =>
            set.cards.length >= SET_SIZES[set.color] &&
            !set.cards.some(c => c.type === 'action' && c.name === 'house')
          )) {
            buttons.push(
              <span key="house-info" style={{ fontSize: 11, color: COLORS.textSecondary, alignSelf: 'center' }}>
                No eligible sets for house
              </span>
            )
          }
        } else if (name === 'hotel') {
          // One button per complete set with a house but no hotel
          player.properties.forEach(set => {
            const isComplete = set.cards.length >= SET_SIZES[set.color]
            const hasHouse = set.cards.some(c => c.type === 'action' && c.name === 'house')
            const hasHotel = set.cards.some(c => c.type === 'action' && c.name === 'hotel')
            if (isComplete && hasHouse && !hasHotel) {
              buttons.push(
                <button
                  key={`hotel-${set.color}`}
                  onClick={() =>
                    onAction({
                      type: 'playAction',
                      cardId: selectedCard.id,
                      targetColor: set.color,
                    })
                  }
                >
                  Add Hotel to {COLOR_DISPLAY[set.color].label}
                </button>
              )
            }
          })
          if (!player.properties.some(set =>
            set.cards.length >= SET_SIZES[set.color] &&
            set.cards.some(c => c.type === 'action' && c.name === 'house') &&
            !set.cards.some(c => c.type === 'action' && c.name === 'hotel')
          )) {
            buttons.push(
              <span key="hotel-info" style={{ fontSize: 11, color: COLORS.textSecondary, alignSelf: 'center' }}>
                No eligible sets for hotel
              </span>
            )
          }
        } else if (name === 'doubleRent') {
          const rentCards = player.hand.filter(c => c.type === 'rent')
          if (rentCards.length > 0 && actionsRemaining >= 2) {
            const playerColors2 = new Set(player.properties.map(s => s.color))
            rentCards.forEach(rentCard => {
              if (rentCard.type !== 'rent') return
              rentCard.colors
                .filter(color => playerColors2.has(color))
                .forEach(color => {
                  buttons.push(
                    <button
                      key={`dr-${rentCard.id}-${color}`}
                      onClick={() =>
                        onAction({
                          type: 'playAction',
                          cardId: rentCard.id,
                          targetColor: color,
                          doubleRentCardId: selectedCard.id,
                        })
                      }
                      style={{
                        background: 'rgba(244,63,94,0.15)',
                        borderColor: 'rgba(244,63,94,0.3)',
                        color: COLORS.red,
                      }}
                    >
                      Double Rent: {COLOR_DISPLAY[color].label}
                    </button>
                  )
                })
            })
          }
          if (rentCards.length === 0 || actionsRemaining < 2) {
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
              <button
                key={`rent-${color}`}
                onClick={() =>
                  onAction({
                    type: 'playAction',
                    cardId: selectedCard.id,
                    targetColor: color,
                  })
                }
              >
                Charge Rent: {COLOR_DISPLAY[color].label}
              </button>
            )
            if (canDouble) {
              buttons.push(
                <button
                  key={`rent-double-${color}`}
                  onClick={() =>
                    onAction({
                      type: 'playAction',
                      cardId: selectedCard.id,
                      targetColor: color,
                      doubleRentCardId: doubleRentCard.id,
                    })
                  }
                  style={{
                    background: 'rgba(244,63,94,0.15)',
                    borderColor: 'rgba(244,63,94,0.3)',
                    color: COLORS.red,
                  }}
                >
                  Double Rent: {COLOR_DISPLAY[color].label}
                </button>
              )
            }
          })
      }
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
