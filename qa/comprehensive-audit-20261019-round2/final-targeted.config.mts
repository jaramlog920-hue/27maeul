import config from '../../vite.config'
import {fileURLToPath} from 'node:url'
export default {...config,root:fileURLToPath(new URL('../../',import.meta.url)),cacheDir:fileURLToPath(new URL('./final-cache/',import.meta.url)),test:{...config.test,exclude:[],maxWorkers:3,testTimeout:120000,include:[
 'qa/comprehensive-audit-20261019-round2/root/boundaries.audit.test.tsx',
 'qa/comprehensive-audit-20261019-round2/economy/round2.test.ts',
 'qa/comprehensive-audit-20261019-round2/social/boundaries.audit.ts',
 'qa/comprehensive-audit-20261019-round2/ui/cold-moods.test.ts',
 'qa/comprehensive-audit-20261019-round2/ui/fix-regressions.test.tsx',
 'qa/comprehensive-audit-20261019-round2/ui/hair.test.ts',
 'qa/comprehensive-audit-20261019-round2/ui/renderer-contracts.test.ts',
 'qa/comprehensive-audit-20261019-round2/ui/settings-busy.test.tsx',
 'qa/comprehensive-audit-20261019-round2/ui/story-smoke.test.ts',
]}}
