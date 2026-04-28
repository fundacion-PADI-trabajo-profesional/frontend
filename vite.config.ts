import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    env: {
      VITE_API_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      include: ['src/api/**/*.ts', 'src/utils/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      all: true,
    },
  },
})
