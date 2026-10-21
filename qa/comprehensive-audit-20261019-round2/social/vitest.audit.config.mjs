import { defineConfig } from 'vitest/config'
export default defineConfig({test:{environment:'jsdom',globals:true,setupFiles:['./src/setupTests.ts'],include:['qa/comprehensive-audit-20261019-round2/social/*.audit.ts'],testTimeout:30000,pool:'forks',maxWorkers:1}})
