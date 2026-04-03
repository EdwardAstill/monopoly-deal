import { describe, it, expect } from 'vitest'
import { createGame, applyAction, performDraw, checkWin, getValidActions } from '../../src/game/engine'
import { chooseAction, chooseResponse, chooseDiscards } from '../../src/game/ai'
import type { GameState } from '../../src/game/types'

describe('full game simulation', () => {
  it('can play a complete game without crashing', () => {
    let state = createGame()
    let steps = 0
    const maxSteps = 1000

    while (state.phase !== 'gameOver' && steps < maxSteps) {
      steps++

      if (state.phase === 'draw') {
        state = performDraw(state)
        continue
      }

      if (state.phase === 'action') {
        const action = chooseAction(state)
        state = applyAction(state, action)
        continue
      }

      if (state.phase === 'respond') {
        const response = chooseResponse(state)
        state = applyAction(state, response)
        continue
      }

      if (state.phase === 'discard') {
        const discards = chooseDiscards(state)
        if (discards.length > 0) {
          state = applyAction(state, { type: 'discard', cardId: discards[0] })
        } else {
          break
        }
        continue
      }
    }

    expect(steps).toBeLessThan(maxSteps)
    expect(state.players[0].hand.length).toBeGreaterThanOrEqual(0)
    expect(state.players[1].hand.length).toBeGreaterThanOrEqual(0)
  })

  it('getValidActions never returns empty during action phase', () => {
    let state = createGame()
    state = performDraw(state)
    const actions = getValidActions(state)
    expect(actions.length).toBeGreaterThan(0)
  })
})
