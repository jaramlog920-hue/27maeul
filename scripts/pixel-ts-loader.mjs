import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'

// 옛 내보내기 스크립트도 앱과 같은 TS·JSON 원본을 읽을 수 있게 한다.
registerHooks({
 resolve(specifier,context,next){return next(specifier.startsWith('.')&&!path.extname(specifier)?`${specifier}.ts`:specifier,context)},
 load(url,context,next){
  if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}
  return next(url,context)
 },
})
