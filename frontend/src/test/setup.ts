// ============================================
// Galderma TrackWise AI Autopilot Demo
// Vitest Test Setup
// ============================================

import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// Run cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
} as unknown as typeof IntersectionObserver

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})

// Mock WebSocket for real-time tests
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.OPEN
  url: string
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null

  constructor(url: string) {
    this.url = url
    // Simulate connection
    setTimeout(() => {
      if (this.onopen) this.onopen()
    }, 0)
  }

  send(_data: string) {}
  close() {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) this.onclose()
  }
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket

// Console error handling for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React 18 warning about act()
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
