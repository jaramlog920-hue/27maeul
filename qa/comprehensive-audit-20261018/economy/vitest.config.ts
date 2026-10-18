import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', globals: true,
    include: ['qa/comprehensive-audit-20261018/economy/**/*.test.ts'],
    setupFiles: ['./src/setupTests.ts'],
    testTimeout: 30000,
    maxWorkers: 1,
  },
})
