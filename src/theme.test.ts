import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'
import css from './index.css?raw'

describe('theme-color', () => {
  it('matches the body background', () => {
    // given

    // when
    const theme = /<meta name="theme-color" content="([^"]+)"/.exec(html)?.[1]
    const body = /^body\s*\{[^}]*background:\s*([^;]+);/m.exec(css)?.[1]

    // then
    expect(theme).toBeDefined()
    expect(theme).toBe(body)
  })
})
