import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {drawRudyProposal}=await import('../../src/render/rudy-proposal-art.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const ns=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'));
const actor=n=>({avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite});
const dexter=actor(ns.find(n=>n.id==='rudy')),guests=ns.filter(n=>n.id!=='rudy').map(actor);
const parent=withLookDefaults({name:'기록자',look:'m'}),spouse=withLookDefaults({name:'배우자',look:'f',hairFront:3,hairBack:3,top:4})
const {spriteRows}=await import('../../src/render/sprites.ts');console.log(spriteRows('merchant','left',{frame:0,blink:false}).join('\n'));console.log(spriteRows('writer','down',{avatar:withLookDefaults({name:'test',look:'m',top:4}),frame:0,blink:false}).join('\n'));
