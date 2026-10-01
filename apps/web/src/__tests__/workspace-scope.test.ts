import { describe, expect, it } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('workspace scope navigation', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/components/workspace-scope.tsx'),
    'utf8',
  )

  it('makes the current context and its consequence visible', () => {
    expect(source).toContain('aria-label="Workspace context"')
    expect(source).toContain('aria-pressed={active}')
    expect(source).toContain('Only your records')
    expect(source).toContain('Shared with your team')
  })

  it('persists the selected context for navigation', () => {
    expect(source).toContain("const STORAGE_KEY = 'arko:workspace-scope'")
    expect(source).toContain('window.localStorage.setItem(STORAGE_KEY, next)')
  })
})
