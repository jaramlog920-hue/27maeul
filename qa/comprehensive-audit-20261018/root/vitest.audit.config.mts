import {defineConfig} from 'vitest/config'
import {fileURLToPath} from 'node:url'
export default defineConfig({root:fileURLToPath(new URL('../../../',import.meta.url)),test:{environment:'jsdom',globals:true,setupFiles:['./src/setupTests.ts'],include:['qa/comprehensive-audit-20261018/root/*.audit.test.tsx'],maxWorkers:1,testTimeout:30000}})
