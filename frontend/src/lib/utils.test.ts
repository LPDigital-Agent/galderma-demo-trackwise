// ============================================
// Galderma TrackWise AI Autopilot Demo
// Utility Functions - Tests
// ============================================

import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should resolve Tailwind conflicts', () => {
    // tailwind-merge should pick the last conflicting class
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})
