// ============================================
// Galderma TrackWise AI Autopilot Demo
// Utility Functions - className Merging & Helpers
// ============================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with proper conflict resolution
 * Uses clsx for conditional classes + tailwind-merge for deduplication
 *
 * @example
 * cn('px-4 py-2', 'px-6') // => 'py-2 px-6' (px-6 overrides px-4)
 * cn('text-red-500', condition && 'text-blue-500') // conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
