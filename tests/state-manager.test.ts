import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StateManager } from '../src/lib/state-manager'

// Mock browser globals for Node environment
const mockLocalStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() }

const mockHistory = { replaceState: vi.fn() }

const mockLocation = { hash: '' }

global.localStorage = mockLocalStorage as any
global.history = mockHistory as any
global.location = mockLocation as any

// Mock btoa/atob if not in node
if (typeof btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
}

describe('StateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.hash = ''
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should initialize with initial state when no cache exists', () => {
    const initial = new Map<string, any>([
      ['count', 10],
      ['name', 'test'],
    ])
    const sm = new StateManager(initial, 'test-key')

    expect(sm.get('count')).toBe(10)
    expect(sm.get('name')).toBe('test')
  })

  it('should update state and trigger commit', () => {
    const initial = new Map([['count', 10]])
    const sm = new StateManager(initial, 'test-key')

    const subscriber = vi.fn()
    sm.subscribe(subscriber)

    sm.set('count', 20)

    expect(sm.get('count')).toBe(20)
    expect(subscriber).toHaveBeenCalled()
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('should load state from LocalStorage', () => {
    const initial = new Map([['count', 10]])
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ count: 50 }))

    const sm = new StateManager(initial, 'test-key')
    expect(sm.get('count')).toBe(50)
  })

  it('should restore deep reactive objects', () => {
    const initial = new Map<string, any>([['user', { name: 'Alice', settings: { theme: 'dark' } }]])
    const sm = new StateManager(initial, 'test-key')

    const user = sm.get('user')
    user.settings.theme = 'light'

    // Check if the change was captured by the proxy and triggered a commit
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
    const lastSaved = JSON.parse(
      mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1],
    )
    expect(lastSaved.user.settings.theme).toBe('light')
  })

  it('should encode and decode from URL hash', () => {
    vi.useFakeTimers()
    const initial = new Map<string, any>([
      ['a', 1],
      ['b', 'test'],
    ])
    const sm = new StateManager(initial, 'test-key')

    sm.set('a', 100)

    // Trigger the timeout
    vi.runAllTimers()

    // Check if history.replaceState was called with a hash
    expect(mockHistory.replaceState).toHaveBeenCalled()
    const lastUrl = mockHistory.replaceState.mock.calls[0][2]
    expect(lastUrl).toMatch(/^#/)

    const encodedHash = lastUrl.slice(1)

    // Simulate loading a new instance with that hash
    mockLocation.hash = '#' + encodedHash
    const sm2 = new StateManager(initial, 'test-key')

    expect(sm2.get('a')).toBe(100)
    expect(sm2.get('b')).toBe('test')

    vi.useRealTimers()
  })
})
