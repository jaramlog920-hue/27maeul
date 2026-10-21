import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins:[react()],
  test:{
    environment:'jsdom',globals:true,setupFiles:['./src/setupTests.ts'],
    include:['qa/comprehensive-audit-20261018/ui/cold-moods.test.ts','qa/comprehensive-audit-20261018/ui/current-state.test.tsx','qa/comprehensive-audit-20261018/ui/current-story-smoke.test.ts'],exclude:[],
    maxWorkers:1,testTimeout:120000,
  },
})
