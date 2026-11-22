import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('the last snake cell is small and round, the other body cells are not', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  const body = screen.getAllByTestId('snake') as HTMLElement[]

  // then
  const tail = body[body.length - 1]
  expect(tail.style.transform).toBe('scale(0.72)')
  expect(tail.style.borderRadius).toBe('50%')
  expect(body[0].style.transform).toBe('')
  expect(body[0].style.borderRadius).toBe('30%')
})
