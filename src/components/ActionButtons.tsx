import { useState } from 'react'
import type { GameState, Action, Card, Color } from '../game/types'
import { SET_SIZES } from '../game/constants'

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
      <div style={{ color: '#f8c', fontWeight: 'bold' }}>
        Respond to {pending.type}
        {pending.amount != null ? ` ($${pending.amount})` : ''}
      </div>
      <div style={{ fontSize: 11, color: '#aaa' }}>Select cards to pay:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {paymentCards.map(card => (
          <button
            key={card.id}
            onClick={() => toggleCard(card.id)}
            style={{
              padding: '2px 6px',
              fontSize: 11,
              background: selectedPayment.includes(card.id) ? '#555' : '#333',
              color: '#eee',
              border: selectedPayment.includes(card.id) ? '1px solid #8cf' : '1px solid #555',
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
      <div style={{ fontSize: 11, color: '#aaa' }}>Pay total: ${payTotal}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() =>
            onAction({ type: 'respond', accept: true, paymentCardIds: selectedPayment })
          }
          style={btnStyle}
        >
          Pay
        </button>
        {hasJustSayNo && (
          <button
            onClick={() => onAction({ type: 'respond', accept: false })}
            style={{ ...btnStyle, background: '#8B0000' }}
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

  const labelFor = (card: Card, color: string) =>
    card.type === 'property' ? card.name : `${color} Wild`

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onCancel}>
      <div style={{
        background: '#1e1e3a', border: '1px solid #555', borderRadius: 10,
        padding: 20, minWidth: 320, maxWidth: 460,
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Forced Deal</h3>

        {/* Step 1: Pick what to take */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
            {!takeCard ? '1. Pick a card to take from opponent:' : '2. Pick a card to give in exchange:'}
          </div>

          {!takeCard && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {oppCards.length === 0 && (
                <span style={{ fontSize: 11, color: '#888' }}>No stealable properties</span>
              )}
              {oppCards.map(({ card, color }) => (
                <button
                  key={card.id}
                  onClick={() => setTakeCard({ id: card.id, color })}
                  style={{
                    padding: '6px 10px', fontSize: 11, background: '#2a2a4a',
                    color: '#eee', border: '1px solid #666', borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  {labelFor(card, color)}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Pick what to give */}
          {takeCard && (
            <>
              <div style={{
                fontSize: 12, color: '#8cf', marginBottom: 8, padding: '4px 8px',
                background: 'rgba(136,204,255,0.1)', borderRadius: 4,
              }}>
                Taking: {labelFor(
                  oppCards.find(c => c.card.id === takeCard.id)?.card ?? {} as Card,
                  takeCard.color
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {myCards.length === 0 && (
                  <span style={{ fontSize: 11, color: '#888' }}>You have no properties to offer</span>
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
                    style={{
                      padding: '6px 10px', fontSize: 11, background: '#2a2a4a',
                      color: '#eee', border: '1px solid #666', borderRadius: 4, cursor: 'pointer',
                    }}
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
            <button onClick={() => setTakeCard(null)} style={{
              padding: '6px 12px', fontSize: 12, background: '#333',
              color: '#eee', border: '1px solid #555', borderRadius: 4, cursor: 'pointer',
            }}>
              Back
            </button>
          )}
          <button onClick={onCancel} style={{
            padding: '6px 12px', fontSize: 12, background: '#333',
            color: '#eee', border: '1px solid #555', borderRadius: 4, cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  background: '#333',
  color: '#eee',
  border: '1px solid #555',
  borderRadius: 4,
  cursor: 'pointer',
}

export default function ActionButtons({ state, selectedCardId, onAction }: ActionButtonsProps) {
  const [showForcedDeal, setShowForcedDeal] = useState(false)
  const { phase, currentPlayer, actionsRemaining, pendingAction, players } = state
  const player = players[0]

  // Discard phase
  if (phase === 'discard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: '#f8c', fontSize: 12 }}>
          Too many cards! Discard down to 7.
        </div>
        {selectedCardId && (
          <button
            onClick={() => onAction({ type: 'discard', cardId: selectedCardId })}
            style={btnStyle}
          >
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

    // Always: Bank + End Turn
    if (selectedCard) {
      buttons.push(
        <button
          key="bank"
          onClick={() => onAction({ type: 'bankCard', cardId: selectedCard.id })}
          style={btnStyle}
        >
          Bank (${selectedCard.value})
        </button>
      )
    }

    buttons.push(
      <button
        key="endTurn"
        onClick={() => onAction({ type: 'pass' })}
        style={btnStyle}
      >
        End Turn ({actionsRemaining} remaining)
      </button>
    )

    if (selectedCard) {
      if (selectedCard.type === 'property') {
        buttons.push(
          <button
            key="play-prop"
            onClick={() =>
              onAction({
                type: 'playProperty',
                cardId: selectedCard.id,
                targetColor: selectedCard.color,
              })
            }
            style={btnStyle}
          >
            Play as Property ({selectedCard.color})
          </button>
        )
      } else if (selectedCard.type === 'wild_property') {
        const existingColors = player.properties.map(s => s.color)
        const available = selectedCard.colors
        // Show existing set colors first, then remaining
        const inSets = available.filter(c => existingColors.includes(c))
        const newColors = available.filter(c => !existingColors.includes(c))

        if (inSets.length > 0) {
          inSets.forEach(color => {
            const set = player.properties.find(s => s.color === color)
            const count = set ? set.cards.length : 0
            const needed = SET_SIZES[color]
            buttons.push(
              <button
                key={`play-wild-${color}`}
                onClick={() =>
                  onAction({
                    type: 'playProperty',
                    cardId: selectedCard.id,
                    targetColor: color,
                  })
                }
                style={{
                  ...btnStyle,
                  background: count + 1 >= needed ? '#2a6a2a' : '#333',
                  border: count + 1 >= needed ? '1px solid #4f4' : '1px solid #555',
                }}
              >
                Add to {color} ({count}/{needed})
              </button>
            )
          })
        }
        newColors.forEach(color => {
          buttons.push(
            <button
              key={`play-wild-${color}`}
              onClick={() =>
                onAction({
                  type: 'playProperty',
                  cardId: selectedCard.id,
                  targetColor: color,
                })
              }
              style={btnStyle}
            >
              Start new {color}
            </button>
          )
        })
      } else if (selectedCard.type === 'action') {
        const name = selectedCard.name
        if (name === 'passGo') {
          buttons.push(
            <button
              key="passGo"
              onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id })}
              style={btnStyle}
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
              style={btnStyle}
            >
              Debt Collector (target AI)
            </button>
          )
        } else if (name === 'itsMyBirthday') {
          buttons.push(
            <button
              key="birthday"
              onClick={() => onAction({ type: 'playAction', cardId: selectedCard.id })}
              style={btnStyle}
            >
              It's My Birthday!
            </button>
          )
        } else if (name === 'dealBreaker') {
          // Buttons per opponent complete set
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
                  style={btnStyle}
                >
                  Deal Breaker: AI's {set.color} set
                </button>
              )
            }
          })
        } else if (name === 'slyDeal') {
          // Buttons per opponent incomplete set card
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
                    style={btnStyle}
                  >
                    Sly Deal:{' '}
                    {card.type === 'property' ? card.name : `${set.color} wild`}
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
              style={btnStyle}
            >
              Play Forced Deal
            </button>
          )
        } else if (name === 'doubleRent') {
          // When Double Rent is selected, show which rent cards it can combine with
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
                      style={{ ...btnStyle, background: '#8B0000', border: '1px solid #f44' }}
                    >
                      ⚡ Double Rent: {color}
                    </button>
                  )
                })
            })
          }
          if (rentCards.length === 0 || actionsRemaining < 2) {
            buttons.push(
              <span key="dr-info" style={{ fontSize: 11, color: '#888', alignSelf: 'center' }}>
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
                style={btnStyle}
              >
                Charge Rent: {color}
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
                  style={{ ...btnStyle, background: '#8B0000', border: '1px solid #f44' }}
                >
                  ⚡ Double Rent: {color}
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
