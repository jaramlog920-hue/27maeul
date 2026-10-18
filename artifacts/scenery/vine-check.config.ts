import original from '../../vite.config.ts'
export default {...original,resolve:{...original.resolve,preserveSymlinks:true},test:{...original.test,pool:'threads'}}

