import { useGame } from '../hooks/useGame'
import Board from './Board'

export function App() {
  const { state, playerAction, newGame } = useGame()

  if (state.phase === 'gameOver') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'system-ui', color: '#eee', backgroundColor: '#1a1a2e',
        gap: 20,
      }}>
        <h1>{state.winner === 0 ? 'You Win!' : 'AI Wins!'}</h1>
        <button
          onClick={newGame}
          style={{ padding: '12px 32px', fontSize: 18, cursor: 'pointer', borderRadius: 8 }}
        >
          Play Again
        </button>
      </div>
    )
  }

  return <Board state={state} onAction={playerAction} />
}
