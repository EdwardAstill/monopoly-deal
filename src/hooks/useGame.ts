import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { GameState, Action } from '../game/types'
import { createGame, applyAction, performDraw } from '../game/engine'
import { chooseAction, chooseResponse, chooseDiscards } from '../game/ai'

type GameAction =
  | { type: 'PLAYER_ACTION'; action: Action }
  | { type: 'AI_STEP' }
  | { type: 'NEW_GAME' }
  | { type: 'DRAW' }

function gameReducer(state: GameState, gameAction: GameAction): GameState {
  switch (gameAction.type) {
    case 'NEW_GAME':
      return createGame()
    case 'DRAW':
      return state.phase === 'draw' ? performDraw(state) : state
    case 'PLAYER_ACTION':
      return applyAction(state, gameAction.action)
    case 'AI_STEP': {
      if (state.phase === 'draw' && state.currentPlayer === 1) {
        return performDraw(state)
      }
      if (state.phase === 'action' && state.currentPlayer === 1) {
        const action = chooseAction(state)
        return applyAction(state, action)
      }
      if (state.phase === 'respond' && state.pendingAction?.targetPlayer === 1) {
        const response = chooseResponse(state)
        return applyAction(state, response)
      }
      if (state.phase === 'discard' && state.currentPlayer === 1) {
        const discards = chooseDiscards(state)
        if (discards.length > 0) {
          return applyAction(state, { type: 'discard', cardId: discards[0] })
        }
      }
      return state
    }
    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, null, createGame)
  const aiTimerRef = useRef<number | null>(null)

  const playerAction = useCallback((action: Action) => {
    dispatch({ type: 'PLAYER_ACTION', action })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  // Auto-draw for human player at start of turn
  useEffect(() => {
    if (state.phase === 'draw' && state.currentPlayer === 0) {
      dispatch({ type: 'DRAW' })
    }
  }, [state.phase, state.currentPlayer])

  // AI turn automation with delay
  useEffect(() => {
    const isAiTurn = state.currentPlayer === 1 && state.phase !== 'gameOver'
    const isAiResponding = state.phase === 'respond' && state.pendingAction?.targetPlayer === 1

    if (isAiTurn || isAiResponding) {
      aiTimerRef.current = window.setTimeout(() => {
        dispatch({ type: 'AI_STEP' })
      }, 500)
    }

    return () => {
      if (aiTimerRef.current !== null) {
        clearTimeout(aiTimerRef.current)
      }
    }
  }, [state])

  return { state, playerAction, newGame }
}
