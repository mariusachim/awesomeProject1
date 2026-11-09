import { act, fireEvent, render as renderReady, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

// A new page waits for the first key. `render` presses a key that keeps the heading, so the
// game runs; `renderReady` shows the page as the player first sees it.
const startKey = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const render = (ui: ReactElement) => {
  const view = renderReady(ui)
  startKey()
  return view
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const head = () => screen.getByTestId('head').getAttribute('data-pos')
const tick = (n = 1) => act(() => vi.advanceTimersByTime(200 * n))

const hidePage = () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  fireEvent(document, new Event('visibilitychange'))
}

test('hiding the page pauses a running game and offers Resume', () => {
  // given
  render(<App />)

  // when
  hidePage()

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy()
})

test('losing window focus pauses a running game', () => {
  // given
  render(<App />)

  // when
  fireEvent.blur(window)

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
})

test('a game paused by a hidden page stays paused until Resume', () => {
  // given
  render(<App />)
  hidePage()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)

  // when
  fireEvent.focus(window)
  fireEvent(document, new Event('visibilitychange'))
  tick(3)

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
  expect(screen.queryByText('Paused')).toBeNull()
})

test('hiding the page keeps a game that waits for the first key in ready', () => {
  // given
  renderReady(<App />)

  // when
  hidePage()

  // then
  expect(screen.getByText('Press an arrow key or WASD to start')).toBeTruthy()
  expect(screen.queryByText('Paused')).toBeNull()
})

test('hiding the page keeps a paused game paused with Resume shown', () => {
  // given
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }))

  // when
  hidePage()

  // then
  expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy()
})

test('hiding the page does not change the game over message', () => {
  // given
  render(<App />)
  tick(10)
  expect(screen.getByText('Game over')).toBeTruthy()

  // when
  hidePage()

  // then
  expect(screen.getByText('Game over')).toBeTruthy()
  expect(screen.queryByText('Paused')).toBeNull()
})

test('shows the title, the board, a snake, one food and a score of 0', () => {
  // when
  render(<App />)

  // then
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Snake')
  expect(screen.getByText('Score: 0')).toBeTruthy()
  expect(screen.getAllByTestId('head').length + screen.getAllByTestId('snake').length).toBe(3)
  expect(screen.getAllByTestId('food').length).toBe(1)
})

test('the food is a circle and the snake cells are squares', () => {
  // given
  renderReady(<App />)

  // when
  const food = screen.getByTestId('food')

  // then
  expect(food.style.borderRadius).toBe('50%')
  expect(screen.getByTestId('head').style.borderRadius).not.toBe('50%')
  screen.getAllByTestId('snake').forEach((c) => expect(c.style.borderRadius).not.toBe('50%'))
})

test('the head has an outline that the body cells do not have', () => {
  // given
  renderReady(<App />)

  // when
  const headOutline = screen.getByTestId('head').style.outline

  // then
  expect(headOutline).not.toBe('')
  screen.getAllByTestId('snake').forEach((c) => expect(c.style.outline).toBe(''))
})

test('the food carries the pulse class so it can animate when it appears', () => {
  // when
  renderReady(<App />)

  // then
  expect(screen.getByTestId('food').classList.contains('pulse')).toBe(true)
})

test('the snake moves right on a timer without input', () => {
  // given
  render(<App />)
  const before = head()

  // when
  tick()

  // then
  expect(head()).not.toBe(before)
  expect(head()).toBe('8,7')
})

test.each([
  ['ArrowUp', '7,6'],
  ['w', '7,6'],
  ['ArrowDown', '7,8'],
  ['s', '7,8'],
])('key %s turns the snake', (key, pos) => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key })
  tick()

  // then
  expect(head()).toBe(pos)
})

test('a turn back into the snake is ignored', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'a' })
  tick()

  // then
  expect(head()).toBe('8,7')
})

test('hitting the wall shows Game over with the score', () => {
  // given
  render(<App />)

  // when
  tick(10)

  // then
  expect(screen.getByText('Game over')).toBeTruthy()
  expect(screen.getByText('Final score: 0')).toBeTruthy()
})

test('the Pause button stays in the control row, disabled, after game over', () => {
  // given
  render(<App />)

  // when
  tick(10)

  // then
  const pause = screen.getByRole('button', { name: 'Pause' }) as HTMLButtonElement
  expect(pause.disabled).toBe(true)
})

test('the Restart button starts a new game', () => {
  // given
  render(<App />)
  tick(10)

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(screen.queryByText('Game over')).toBeNull()
  expect(head()).toBe('7,7')
})

test('Enter restarts a finished game', () => {
  // given
  render(<App />)
  tick(10)

  // when
  fireEvent.keyDown(window, { key: 'Enter' })

  // then
  expect(screen.queryByText('Game over')).toBeNull()
  expect(head()).toBe('7,7')
})

test.each([' ', 'p'])('key "%s" pauses and resumes the game', (key) => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key })
  tick(3)

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
  expect(head()).toBe('7,7')

  // when
  fireEvent.keyDown(window, { key })
  tick()

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(head()).toBe('8,7')
})

test('the Pause button pauses and the Resume button resumes', () => {
  // given
  render(<App />)

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
  tick(2)

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
  expect(head()).toBe('7,7')

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
  tick()

  // then
  expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull()
  expect(head()).toBe('8,7')
})

test('a turn key while paused does not turn the snake', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'p' })

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  fireEvent.keyDown(window, { key: 'p' })
  tick()

  // then
  expect(head()).toBe('8,7')
})

test('Space and P do nothing after game over', () => {
  // given
  render(<App />)
  tick(10)

  // when
  fireEvent.keyDown(window, { key: ' ' })
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(screen.getByText('Game over')).toBeTruthy()
})

// A browser clicks a focused button on Space keyup, unless keydown or keyup was cancelled.
function pressSpaceOn(el: HTMLElement) {
  const down = fireEvent.keyDown(el, { key: ' ' })
  const up = fireEvent.keyUp(el, { key: ' ' })
  if (down && up) fireEvent.click(el)
}

test('Space on a focused Pause or Resume button toggles the pause once', () => {
  // given
  render(<App />)

  // when
  pressSpaceOn(screen.getByRole('button', { name: 'Pause' }))

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy()

  // when
  pressSpaceOn(screen.getByRole('button', { name: 'Resume' }))

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
})

test('a new game after pausing and game over is running', () => {
  // given
  render(<App />)
  tick(10)
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // when
  tick()

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(head()).toBe('8,7')
})

test('Enter does nothing while the game runs', () => {
  // given
  render(<App />)
  tick()

  // when
  fireEvent.keyDown(window, { key: 'Enter' })

  // then
  expect(head()).toBe('8,7')
})

// High score: with Math.random = 0 the food sits at 0,0; the snake starts at 7,7 heading right.
const eatFood = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick(7)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick(7)
}
const gameOver = () => tick(30)

test('shows a high score of 0 on the first visit', () => {
  // given
  localStorage.clear()

  // when
  render(<App />)

  // then
  expect(screen.getByText('High score: 0')).toBeTruthy()
})

test('the high score follows the score at once and survives a restart and a reload', () => {
  // given
  localStorage.clear()
  const first = render(<App />)

  // when
  eatFood()

  // then
  expect(screen.getByText('Score: 1')).toBeTruthy()
  expect(screen.getByText('High score: 1')).toBeTruthy()

  // when
  gameOver()
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(screen.getByText('Score: 0')).toBeTruthy()
  expect(screen.getByText('High score: 1')).toBeTruthy()

  // when
  first.unmount()
  render(<App />)

  // then
  expect(screen.getByText('High score: 1')).toBeTruthy()
})

test('a lower score does not change the high score', () => {
  // given
  localStorage.setItem('snake.highScore', '5')
  render(<App />)

  // when
  eatFood()
  gameOver()

  // then
  expect(screen.getByText('High score: 5')).toBeTruthy()
  expect(localStorage.getItem('snake.highScore')).toBe('5')
})

// Speed: after eatFood the head sits at 0,0 and the score is 1.
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

test('after eating the snake moves every 190 ms', () => {
  // given
  localStorage.clear()
  render(<App />)
  eatFood()
  fireEvent.keyDown(window, { key: 'ArrowDown' })

  // when
  advance(189)

  // then
  expect(head()).toBe('0,0')

  // when
  advance(1)

  // then
  expect(head()).toBe('0,1')
})

test('pausing and resuming keeps the speed of the score', () => {
  // given
  localStorage.clear()
  render(<App />)
  eatFood()
  fireEvent.keyDown(window, { key: 'ArrowDown' })
  fireEvent.keyDown(window, { key: 'p' })
  advance(1000)

  // when
  fireEvent.keyDown(window, { key: 'p' })
  advance(190)

  // then
  expect(head()).toBe('0,1')
})

test('a restart after eating goes back to 200 ms', () => {
  // given
  localStorage.clear()
  render(<App />)
  eatFood()
  gameOver()
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // when
  advance(199)

  // then
  expect(head()).toBe('7,7')

  // when
  advance(1)

  // then
  expect(head()).toBe('8,7')
})

test('a bad stored high score shows 0', () => {
  // given
  localStorage.setItem('snake.highScore', '-4')

  // when
  render(<App />)

  // then
  expect(screen.getByText('High score: 0')).toBeTruthy()
})

const modeButton = (label: string) => screen.getByRole('button', { name: `Walls: ${label}` })

test('the default mode is solid and a wall ends the game', () => {
  // given
  render(<App />)

  // when
  tick(8)

  // then
  expect(modeButton('solid')).toBeTruthy()
  expect(screen.getByText('Game over')).toBeTruthy()
})

test('the mode button switches to wrap, starts a new game and wraps at the wall', () => {
  // given
  render(<App />)
  tick(3)

  // when
  fireEvent.click(modeButton('solid'))

  // then
  expect(modeButton('wrap')).toBeTruthy()
  expect(screen.getByText('Score: 0')).toBeTruthy()
  expect(head()).toBe('7,7')

  // when
  startKey()
  tick(8)

  // then
  expect(head()).toBe('0,7')
  expect(screen.queryByText('Game over')).toBeNull()
})

test('the mode button switches back to solid', () => {
  // given
  render(<App />)
  fireEvent.click(modeButton('solid'))

  // when
  fireEvent.click(modeButton('wrap'))

  // then
  expect(modeButton('solid')).toBeTruthy()
})

test('Space and Enter on the focused mode button toggle the mode once without pausing', () => {
  // given
  render(<App />)

  // when
  pressSpaceOn(modeButton('solid'))

  // then
  expect(modeButton('wrap')).toBeTruthy()
  expect(screen.queryByText('Paused')).toBeNull()

  // when
  fireEvent.keyDown(modeButton('wrap'), { key: 'Enter' })
  fireEvent.click(modeButton('wrap'))

  // then
  expect(modeButton('solid')).toBeTruthy()
})

test('restart keeps the chosen mode', () => {
  // given: in wrap mode the snake eats two foods in a row, then bites itself
  const rand = vi.spyOn(Math, 'random')
  render(<App />)
  rand.mockReturnValueOnce(110.5 / 222)
  fireEvent.click(modeButton('solid'))
  startKey()
  rand.mockReturnValueOnce(110.5 / 221)
  tick(2)
  expect(screen.getByText('Score: 2')).toBeTruthy()
  for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowDown']) {
    fireEvent.keyDown(window, { key })
    tick()
  }
  expect(screen.getByText('Game over')).toBeTruthy()

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(modeButton('wrap')).toBeTruthy()
})

test('a new page shows the board and a start message, and the snake waits', () => {
  // given
  renderReady(<App />)

  // when
  tick(5)

  // then
  expect(screen.getByText('Press an arrow key or WASD to start')).toBeTruthy()
  expect(screen.getAllByTestId('head').length + screen.getAllByTestId('snake').length).toBe(3)
  expect(screen.getAllByTestId('food').length).toBe(1)
  expect(head()).toBe('7,7')
  expect(screen.getByText('Score: 0')).toBeTruthy()
})

test.each([
  ['ArrowUp', '7,6'],
  ['d', '8,7'],
  ['ArrowLeft', '8,7'],
])('key %s starts a ready game, hides the message and moves on the next tick', (key, pos) => {
  // given
  renderReady(<App />)

  // when
  fireEvent.keyDown(window, { key })

  // then
  expect(screen.queryByText('Press an arrow key or WASD to start')).toBeNull()
  expect(head()).toBe('7,7')

  // when
  tick()

  // then
  expect(head()).toBe(pos)
})

test.each([' ', 'p'])('key "%s" leaves a ready game ready', (key) => {
  // given
  renderReady(<App />)

  // when
  fireEvent.keyDown(window, { key })
  tick()

  // then
  expect(screen.getByText('Press an arrow key or WASD to start')).toBeTruthy()
  expect(head()).toBe('7,7')
})

test('the Pause button is disabled while the game is ready', () => {
  // when
  renderReady(<App />)

  // then
  expect((screen.getByRole('button', { name: 'Pause' }) as HTMLButtonElement).disabled).toBe(true)
})

test('changing the walls mode puts the new game in the ready state', () => {
  // given
  render(<App />)
  tick()

  // when
  fireEvent.click(modeButton('solid'))
  tick(3)

  // then
  expect(screen.getByText('Press an arrow key or WASD to start')).toBeTruthy()
  expect(head()).toBe('7,7')
})

const NEW_BEST = 'New high score!'

test('a final score above the stored high score shows the new high score message', () => {
  // given
  localStorage.setItem('snake.highScore', '0')
  render(<App />)

  // when
  eatFood()
  gameOver()

  // then
  expect(screen.getByText(NEW_BEST)).toBeTruthy()
})

test.each(['5', '1'])('a final score of 1 against a stored %s shows no message', (stored) => {
  // given
  localStorage.setItem('snake.highScore', stored)
  render(<App />)

  // when
  eatFood()
  gameOver()

  // then
  expect(screen.queryByText(NEW_BEST)).toBeNull()
})

test('a final score of 0 with no stored high score shows no message', () => {
  // given
  localStorage.clear()
  render(<App />)

  // when
  gameOver()

  // then
  expect(screen.getByText('Final score: 0')).toBeTruthy()
  expect(screen.queryByText(NEW_BEST)).toBeNull()
})

test('the new high score message is gone after a restart', () => {
  // given
  localStorage.clear()
  render(<App />)
  eatFood()
  gameOver()
  expect(screen.getByText(NEW_BEST)).toBeTruthy()

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(screen.queryByText(NEW_BEST)).toBeNull()
})

test('Space and Enter on the focused Mute button toggle the sound once after game over', () => {
  // given
  render(<App />)
  tick(10)

  // when
  pressSpaceOn(screen.getByRole('button', { name: 'Mute' }))

  // then
  expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()

  // when
  const enter = fireEvent.keyDown(screen.getByRole('button', { name: 'Unmute' }), { key: 'Enter' })
  if (enter) fireEvent.click(screen.getByRole('button', { name: 'Unmute' }))

  // then
  expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
  expect(screen.getByText('Game over')).toBeTruthy()
})

test('Space on the focused Mute button does not pause a running game', () => {
  // given
  render(<App />)

  // when
  pressSpaceOn(screen.getByRole('button', { name: 'Mute' }))

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()
})

test('the speed level shows before the first key and follows the score', () => {
  // given
  localStorage.clear()
  renderReady(<App />)

  // then
  expect(screen.getByText('Speed 1')).toBeTruthy()

  // when
  startKey()
  eatFood()

  // then
  expect(screen.getByText('Speed 2')).toBeTruthy()
})

test('the score, the speed and the high score sit in one labelled stats group', () => {
  // given
  localStorage.clear()

  // when
  renderReady(<App />)

  // then
  const stats = within(screen.getByRole('group', { name: 'Game stats' }))
  expect(stats.getByText('Score: 0')).toBeTruthy()
  expect(stats.getByText('Speed 1')).toBeTruthy()
  expect(stats.getByText('High score: 0')).toBeTruthy()
})

test('the speed level goes back to 1 on restart', () => {
  // given
  localStorage.clear()
  render(<App />)
  eatFood()
  gameOver()

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(screen.getByText('Speed 1')).toBeTruthy()
})

test('the length starts at 1, grows by 1 per food and goes back to 1 on restart', () => {
  // given
  localStorage.clear()
  render(<App />)

  // then
  expect(screen.getByText('Length 1')).toBeTruthy()

  // when
  eatFood()

  // then
  expect(screen.getByText('Length 2')).toBeTruthy()

  // when
  gameOver()
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(screen.getByText('Length 1')).toBeTruthy()
})

test('a second game that only ties the new record shows no message', () => {
  // given
  localStorage.clear()
  render(<App />)
  eatFood()
  gameOver()
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // when
  eatFood()
  gameOver()

  // then
  expect(screen.queryByText(NEW_BEST)).toBeNull()
})

test('the 5th food brings a bonus food with a screen reader label, a diamond shape and a gold colour', () => {
  // given: each food sits right in front of the snake, on row 7, and the bonus food falls on 0,0
  const rand = vi.spyOn(Math, 'random')
  rand.mockReturnValueOnce(111.5 / 222)
  for (const free of [221, 220, 219, 218, 217]) rand.mockReturnValueOnce(111.5 / free)
  renderReady(<App />)
  startKey()
  expect(screen.queryByTestId('bonus')).toBeNull()

  // when
  for (let i = 0; i < 12 && !screen.queryByTestId('bonus'); i++) tick()

  // then
  expect(screen.getByText('Score: 5')).toBeTruthy()
  const bonus = screen.getByRole('img', { name: 'Bonus food, 15 moves left' })
  expect(bonus).toBe(screen.getByTestId('bonus'))
  expect(bonus.style.clipPath).toContain('polygon')
  expect(bonus.style.background).not.toBe(screen.getByTestId('food').style.background)
  expect(screen.getByTestId('food').textContent).toBe('')
})

test('the bonus food shows its moves left, one lower after each move', () => {
  // given
  const rand = vi.spyOn(Math, 'random')
  rand.mockReturnValueOnce(111.5 / 222)
  for (const free of [221, 220, 219, 218, 217]) rand.mockReturnValueOnce(111.5 / free)
  renderReady(<App />)
  startKey()
  for (let i = 0; i < 12 && !screen.queryByTestId('bonus'); i++) tick()
  expect(screen.getByTestId('bonus-count').textContent).toBe('15')

  // when
  tick()

  // then
  expect(screen.getByTestId('bonus-count').textContent).toBe('14')
  expect(screen.getByRole('img', { name: 'Bonus food, 14 moves left' })).toBeTruthy()
})

// Score bump: the big score value carries the class "bump" for the CSS animation after a gain.
const scoreValue = () => document.querySelector('.stat-big .stat-value') as HTMLElement

test('the score bumps when the snake eats, not at 0 or after a restart', () => {
  // given
  render(<App />)

  // then
  expect(scoreValue().classList.contains('bump')).toBe(false)

  // when
  eatFood()

  // then
  expect(scoreValue().textContent).toBe('1')
  expect(scoreValue().classList.contains('bump')).toBe(true)

  // when
  gameOver()
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(scoreValue().textContent).toBe('0')
  expect(scoreValue().classList.contains('bump')).toBe(false)
})

test('the head flashes when the snake eats, not at 0, when paused or when over', () => {
  // given
  render(<App />)
  const flashing = () => screen.getByTestId('head').classList.contains('flash')

  // then
  expect(flashing()).toBe(false)

  // when
  eatFood()

  // then
  expect(flashing()).toBe(true)

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(flashing()).toBe(false)

  // when
  fireEvent.keyDown(window, { key: 'p' })
  gameOver()

  // then
  expect(flashing()).toBe(false)
})

test('the board shows 225 silent checkerboard tiles of two shades', () => {
  // given
  render(<App />)

  // when
  const tiles = screen.getAllByTestId('tile')

  // then
  expect(tiles.length).toBe(225)
  expect(new Set(tiles.map((t) => t.style.background)).size).toBe(2)
  tiles.forEach((t) => {
    expect(t.textContent).toBe('')
    expect(t.getAttribute('role')).toBeNull()
    expect(t.getAttribute('aria-hidden')).toBe('true')
  })
})

test('the speed value pulses when the level goes up, not at level 1 or after a restart', () => {
  // given
  render(<App />)
  const speedValue = () => screen.getByText('Speed', { selector: '.stat-label' }).nextElementSibling as HTMLElement

  // then
  expect(speedValue().classList.contains('bump')).toBe(false)

  // when
  eatFood()

  // then
  expect(speedValue().textContent).toBe('2')
  expect(speedValue().classList.contains('bump')).toBe(true)
  expect(screen.getByText('Speed 2')).toBeTruthy()

  // when
  gameOver()
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(speedValue().textContent).toBe('1')
  expect(speedValue().classList.contains('bump')).toBe(false)
})
