import config from '../../vite.config'
import {fileURLToPath} from 'node:url'
export default {...config,root:fileURLToPath(new URL('../../',import.meta.url)),cacheDir:fileURLToPath(new URL('./cache/',import.meta.url)),test:{...config.test,include:['src/**/*.test.ts','src/**/*.test.tsx','scripts/**/*.test.ts'],maxWorkers:6}}
