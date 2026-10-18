import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment:'jsdom', globals:true, setupFiles:['./src/setupTests.ts'], include:['qa/comprehensive-audit-20261018/social/*.audit.ts'], testTimeout:30000, pool:'forks', maxWorkers:1 } })
