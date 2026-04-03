import { useState } from 'react'
import type { GameState, Action, Color } from '../game/types'
import { SET_SIZES, COLOR_DISPLAY } from '../game/constants'
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

  // Determine valid property placements for selected hand card
  const selectedCard = selectedCardId ? player.hand.find(c => c.id === selectedCardId) ?? null : null
  let validPlacements: Color[] = []
  if (isPlayerAction && selectedCard) {
    if (selectedCard.type === 'property') {
      validPlacements = [selectedCard.color]
    } else if (selectedCard.type === 'wild_property') {
      validPlacements = selectedCard.colors
    }
  }

  // Move-wild colors
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
      display: 'flex', height: '100vh', background: COLORS.bg,
      color: COLORS.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 20px', borderBottom: `1px solid ${COLORS.borderStructural}`,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 12, fontWeight: 600,
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
            fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: COLORS.textMuted,
          }}>You</div>

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
              {moveWildColors.map(color => {
                const existing = player.properties.find(s => s.color === color)
                return (
                  <button key={color} onClick={() => handleMoveWild(color)}>
                    {existing
                      ? `${COLOR_DISPLAY[color].label} (${existing.cards.length}/${SET_SIZES[color]})`
                      : `New ${COLOR_DISPLAY[color].label}`}
                  </button>
                )
              })}
              <button onClick={() => setSelectedWildId(null)}>Cancel</button>
            </div>
          )}

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
            fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 1.5,
            color: COLORS.textFaint, marginBottom: 6,
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
