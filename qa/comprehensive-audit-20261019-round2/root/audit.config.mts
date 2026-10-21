import config from '../../../vite.config'
import {fileURLToPath} from 'node:url'
export default {...config,root:fileURLToPath(new URL('../../../',import.meta.url)),cacheDir:fileURLToPath(new URL('./cache/',import.meta.url)),test:{...config.test,include:['qa/comprehensive-audit-20261019-round2/root/*.audit.test.tsx'],exclude:[],maxWorkers:1,testTimeout:120000}}
