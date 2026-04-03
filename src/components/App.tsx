import { useGame } from '../hooks/useGame'
import { COLORS } from './theme'
import Board from './Board'

export function App() {
  const { state, playerAction, newGame } = useGame()

  if (state.phase === 'gameOver') {
    const won = state.winner === 0
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: COLORS.bg, color: COLORS.textPrimary, gap: 16,
      }}>
        <div style={{
          fontSize: 14,
          textTransform: 'uppercase' as const,
          letterSpacing: 2,
          color: COLORS.textSecondary,
        }}>Game Over</div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: won ? COLORS.green : COLORS.pink,
        }}>{won ? 'You Win!' : 'AI Wins!'}</h1>
        <button
          onClick={newGame}
          style={{ padding: '10px 28px', fontSize: 13 }}
        >
          Play Again
        </button>
      </div>
    )
  }

  return <Board state={state} onAction={playerAction} />
}
