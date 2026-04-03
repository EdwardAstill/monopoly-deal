import { useState } from 'react'
import type { GameState, Action } from '../game/types'
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

  const handleAction = (action: Action) => {
    setSelectedCardId(null)
    onAction(action)
  }

  const player = state.players[0]

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        color: '#eee',
        background: '#1a1a2e',
      }}
    >
      {/* Left column */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top: Opponent */}
        <div style={{ padding: 8 }}>
          <OpponentView player={state.players[1]} />
        </div>

        {/* Middle: Game info */}
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            fontSize: 13,
            color: '#aaa',
            borderTop: '1px solid #333',
            borderBottom: '1px solid #333',
          }}
        >
          <span>Deck: {state.deck.length}</span>
          <span>Discard: {state.discardPile.length}</span>
          <span
            style={{
              fontWeight: 'bold',
              color: state.currentPlayer === 0 ? '#8cf' : '#f8c',
            }}
          >
            {state.currentPlayer === 0 ? 'Your Turn' : "AI's Turn"}
          </span>
          <span>Actions: {state.actionsRemaining}</span>
        </div>

        {/* Bottom: Player area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 8,
            gap: 8,
            overflow: 'hidden',
          }}
        >
          <PropertyArea properties={player.properties} />
          <Bank cards={player.bank} />
          <ActionButtons
            state={state}
            selectedCardId={selectedCardId}
            onAction={handleAction}
          />
          <Hand
            cards={player.hand}
            selectedCardId={selectedCardId}
            onSelectCard={(id) =>
              setSelectedCardId(prev => (prev === id ? null : id))
            }
          />
        </div>
      </div>

      {/* Right: Action log */}
      <ActionLog log={state.log} />
    </div>
  )
}
