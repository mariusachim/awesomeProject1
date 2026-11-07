import { type KeyboardEvent as ReactKeyEvent, useEffect, useRef, useState } from 'react'
import { loadHighScore, saveHighScore } from './highScore.ts'
import { loadMuted, play, saveMuted } from './sound.ts'
import { type GameState, SIZE, keyToDir, newGame, step, tickMs, togglePause, turn } from './game.ts'

const CELL_PX = 24

function onKeyPress(g: GameState, key: string): GameState {
  const dir = keyToDir(key)
  if (dir) return turn(g, dir)
  if (key === ' ' || key.toLowerCase() === 'p') return togglePause(g)
  if (key === 'Enter' && g.status === 'over') return newGame(Math.random, g.wrap)
  return g
}

export default function App() {
  const [game, setGame] = useState(() => newGame(Math.random, false, 'ready'))
  const [best, setBest] = useState(loadHighScore)
  const [muted, setMuted] = useState(loadMuted)
  const highScore = Math.max(best, game.score)
  const over = game.status === 'over'
  const paused = game.status === 'paused'
  const ready = game.status === 'ready'

  useEffect(() => {
    const id = setInterval(() => setGame((g) => step(g, Math.random)), tickMs(game.score))
    return () => clearInterval(id)
  }, [game.score])

  if (highScore > best) setBest(highScore)

  const prev = useRef({ score: game.score, over })
  useEffect(() => {
    const was = prev.current
    prev.current = { score: game.score, over }
    if (muted) return
    if (over && !was.over) play('over')
    else if (game.score > was.score) play('eat')
  }, [game.score, over, muted])

  useEffect(() => saveMuted(muted), [muted])

  useEffect(() => {
    if (best > 0) saveHighScore(best)
  }, [best])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => setGame((g) => onKeyPress(g, e.key))
    // Space is the pause key, so it must not also click a focused button.
    const noClick = (e: KeyboardEvent) => {
      if (e.key === ' ') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keydown', noClick)
    window.addEventListener('keyup', noClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', noClick)
      window.removeEventListener('keyup', noClick)
    }
  }, [])

  const toggleWalls = () => setGame(newGame(Math.random, !game.wrap, 'ready'))
  // Space and Enter belong to this button: keep the window handler from pausing or restarting.
  const onModeKey = (e: ReactKeyEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    e.stopPropagation()
    if (e.key === ' ') {
      e.preventDefault()
      toggleWalls()
    }
  }

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
      <p>High score: {highScore}</p>
      <div className="controls">
        <button className="pause" disabled={over || ready} onClick={() => setGame(togglePause)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={toggleWalls} onKeyDown={onModeKey}>
          Walls: {game.wrap ? 'wrap' : 'solid'}
        </button>
        <button onClick={() => setMuted((m) => !m)}>{muted ? 'Unmute' : 'Mute'}</button>
      </div>
      <div style={{ position: 'relative', width: SIZE * CELL_PX, height: SIZE * CELL_PX, background: '#222' }}>
        {game.snake.map((c, i) =>
          i === 0 ? cell(c.x, c.y, '#4c4', 'head') : cell(c.x, c.y, '#2a2', 'snake'),
        )}
        {cell(game.food.x, game.food.y, '#e44', 'food')}
      </div>
      <div className="messages">
        {ready && <p role="status">Press an arrow key or WASD to start</p>}
        {paused && <p role="status">Paused</p>}
        {over && (
          <div role="alert">
            <p>Game over</p>
            <p>Final score: {game.score}</p>
            <button onClick={() => setGame(newGame(Math.random, game.wrap))}>Restart</button>
          </div>
        )}
      </div>
    </main>
  )
}
