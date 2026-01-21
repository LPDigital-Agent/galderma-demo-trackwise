// ============================================
// Galderma TrackWise AI Autopilot Demo
// Language Store - UI Language State
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Language } from '@/types'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'AUTO',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'trackwise-language',
    }
  )
)

// Helper to get display text based on language
export function getLanguageLabel(lang: Language): string {
  switch (lang) {
    case 'AUTO':
      return 'Auto'
    case 'PT':
      return 'Portugues'
    case 'EN':
      return 'English'
    case 'ES':
      return 'Espanol'
    case 'FR':
      return 'Francais'
  }
}

export function getLanguageFlag(lang: Language): string {
  switch (lang) {
    case 'AUTO':
      return 'AUTO'
    case 'PT':
      return 'BR'
    case 'EN':
      return 'US'
    case 'ES':
      return 'ES'
    case 'FR':
      return 'FR'
  }
}
