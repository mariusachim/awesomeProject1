import { useEffect, useState } from 'react'
import { SIZE, keyToDir, newGame, step, turn } from './game.ts'

const TICK_MS = 200
const CELL_PX = 24

export default function App() {
  const [game, setGame] = useState(() => newGame(Math.random))
  const over = game.status === 'over'

  useEffect(() => {
    const id = setInterval(() => setGame((g) => step(g, Math.random)), TICK_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = keyToDir(e.key)
      if (dir) setGame((g) => turn(g, dir))
      else if (e.key === 'Enter') setGame((g) => (g.status === 'over' ? newGame(Math.random) : g))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const cell = (x: number, y: number, color: string, id: string) => (
    <div
      key={`${id}${x},${y}`}
      data-testid={id}
      data-pos={`${x},${y}`}
      style={{ position: 'absolute', left: x * CELL_PX, top: y * CELL_PX, width: CELL_PX, height: CELL_PX, background: color }}
    />
  )

  return (
    <main>
      <h1>Snake</h1>
      <p>Score: {game.score}</p>
      <div style={{ position: 'relative', width: SIZE * CELL_PX, height: SIZE * CELL_PX, background: '#222' }}>
        {game.snake.map((c, i) =>
          i === 0 ? cell(c.x, c.y, '#4c4', 'head') : cell(c.x, c.y, '#2a2', 'snake'),
        )}
        {cell(game.food.x, game.food.y, '#e44', 'food')}
      </div>
      {over && (
        <div role="alert">
          <p>Game over</p>
          <p>Final score: {game.score}</p>
          <button onClick={() => setGame(newGame(Math.random))}>Restart</button>
        </div>
      )}
    </main>
  )
}
