import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', globals: true,
    include: ['qa/comprehensive-audit-20261019-round2/economy/**/*.test.ts'],
    setupFiles: ['./src/setupTests.ts'], maxWorkers: 1, testTimeout: 30000,
  },
})
