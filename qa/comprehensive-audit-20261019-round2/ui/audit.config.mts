import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({plugins:[react()],test:{environment:'jsdom',globals:true,setupFiles:['./src/setupTests.ts'],include:['qa/comprehensive-audit-20261019-round2/ui/*.test.{ts,tsx}'],exclude:[],maxWorkers:1,testTimeout:120000}})
