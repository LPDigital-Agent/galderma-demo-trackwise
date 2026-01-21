// ============================================
// Galderma TrackWise AI Autopilot Demo
// Vitest Configuration
// ============================================

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test setup
    globals: true,
    setupFiles: ['./src/test/setup.ts'],

    // Include patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },

    // Reporter configuration
    reporters: ['default'],

    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch mode settings
    watch: false,

    // Threading
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },

  // Path aliases (match tsconfig.json)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
