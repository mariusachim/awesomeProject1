import { type CSSProperties, type KeyboardEvent as ReactKeyEvent, type TouchEvent, useEffect, useRef, useState } from 'react'
import { isNewHighScore, loadHighScore, saveHighScore } from './highScore.ts'
import { loadMuted, play, saveMuted } from './sound.ts'
import { type GameState, SIZE, keyToDir, newGame, pauseIfRunning, speedLevel, step, swipeDir, tickMs, togglePause, turn } from './game.ts'

const CELL_PX = 24
// Shape and outline tell the cells apart without colour: round food, outlined head, inset body.
const HEAD_LOOK: CSSProperties = { background: '#7e7', outline: '2px solid #efe', outlineOffset: -2, boxSizing: 'border-box' }
const BODY_LOOK: CSSProperties = { background: '#2a2', boxSizing: 'border-box', border: '2px solid #222' }
const FOOD_LOOK: CSSProperties = { background: '#e44', borderRadius: '50%' }

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
  // The record before this run: it is refreshed while the score is 0, and frozen once the run scores.
  const [record, setRecord] = useState(best)
  if (game.score === 0 && record !== highScore) setRecord(highScore)

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

  useEffect(() => {
    const onHide = () => setGame(pauseIfRunning)
    const onVisibility = () => {
      if (document.hidden) onHide()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onHide)
    }
  }, [])

  const toggleWalls = () => setGame(newGame(Math.random, !game.wrap, 'ready'))
  // Space and Enter belong to a focused button: keep the window handler from pausing or restarting.
  // Enter clicks the button itself; Space is cancelled by the window handler, so run the action here.
  const ownKeys = (action: () => void) => (e: ReactKeyEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    e.stopPropagation()
    if (e.key === ' ') {
      e.preventDefault()
      action()
    }
  }
  const toggleMute = () => setMuted((m) => !m)

  const swipeFrom = useRef<{ x: number; y: number } | null>(null)
  const onSwipeStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0]
    swipeFrom.current = { x: t.clientX, y: t.clientY }
  }
  const onSwipeEnd = (e: TouchEvent<HTMLDivElement>) => {
    const from = swipeFrom.current
    swipeFrom.current = null
    if (!from) return
    const t = e.changedTouches[0]
    const dir = swipeDir(t.clientX - from.x, t.clientY - from.y)
    if (dir) setGame((g) => turn(g, dir))
  }

  const cell = (x: number, y: number, id: string, look: CSSProperties, className?: string) => (
    <div
      key={`${id}${x},${y}`}
      data-testid={id}
      data-pos={`${x},${y}`}
      className={className}
      style={{ position: 'absolute', left: x * CELL_PX, top: y * CELL_PX, width: CELL_PX, height: CELL_PX, ...look }}
    />
  )

  return (
    <main>
      <h1>Snake</h1>
      <p>Score: {game.score}</p>
      <p>Speed {speedLevel(game.score)}</p>
      <p>High score: {highScore}</p>
      <div className="controls">
        <button className="pause" disabled={over || ready} onClick={() => setGame(togglePause)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={toggleWalls} onKeyDown={ownKeys(toggleWalls)}>
          Walls: {game.wrap ? 'wrap' : 'solid'}
        </button>
        <button onClick={toggleMute} onKeyDown={ownKeys(toggleMute)}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>
      <div
        className="board"
        style={{ position: 'relative', width: SIZE * CELL_PX, height: SIZE * CELL_PX, background: '#222', touchAction: 'none' }}
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        {game.snake.map((c, i) =>
          i === 0 ? cell(c.x, c.y, 'head', HEAD_LOOK) : cell(c.x, c.y, 'snake', BODY_LOOK),
        )}
        {cell(game.food.x, game.food.y, 'food', FOOD_LOOK, 'pulse')}
      </div>
      <div className="messages">
        {ready && (
          <p role="status">
            <span className="hint-keys">Press an arrow key or WASD to start</span>
            <span className="hint-touch">Swipe on the board to start</span>
          </p>
        )}
        {paused && <p role="status">Paused</p>}
        {over && (
          <div role="alert">
            <p>Game over</p>
            <p>Final score: {game.score}</p>
            {isNewHighScore(record, game.score) && <p>New high score!</p>}
            <button onClick={() => setGame(newGame(Math.random, game.wrap))}>Restart</button>
          </div>
        )}
      </div>
    </main>
  )
}
