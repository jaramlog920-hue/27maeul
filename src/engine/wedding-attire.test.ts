import {CONTENT} from '../content/catalog'
import {ITEM_TEXT} from '../content/text'
import {legacyGame} from './growth-test-support'
import {TRADES,trade,tick} from './game'
import {serialize,deserialize} from './save'
import {WEDDING_ATTIRE,giveWeddingAttire,recordWeddingAttire,chooseWeddingAttire,weddingOutfitsFor,weddingGiftsFor} from './wedding-attire'

const engaged=()=>({...legacyGame(CONTENT),coins:1000,clock:{day:7,minute:900},romance:{partner:'rudy',stage:'engaged' as const,since:1,weddingDay:14,marriedDay:null}})
it.each(WEDDING_ATTIRE)('$name is bought on market day, gifted only to the fiance and retained in that ceremony',a=>{
 const s=engaged(),before=JSON.stringify(s),offer=TRADES.find(t=>t.id===a.item)!
 expect(ITEM_TEXT[a.item].name).toBe(a.name)
 const bought=trade(s,offer)!
 expect(bought.coins).toBe(820);expect(bought.inv[a.item]).toBe(1)
 expect(trade({...s,clock:{...s.clock,day:8}},offer)).toBeNull()
 expect(trade({...s,coins:179},offer)).toBeNull()
 expect(giveWeddingAttire(bought,'postman',a.item)).toBeNull()
 expect(giveWeddingAttire({...bought,romance:{...bought.romance,stage:'dating'}},'rudy',a.item)).toBeNull()
 const given=giveWeddingAttire({...bought,gifted:['rudy']},'rudy',a.item)!
 expect(given.inv[a.item]??0).toBe(0);expect(given.hearts).toEqual(s.hearts);expect(given.gifted).toEqual(['rudy'])
 const wedding=recordWeddingAttire({...given,clock:{day:14,minute:1110},romance:{...given.romance,stage:'married',marriedDay:14,weddingDay:null},scenes:['wedding:rudy']},'rudy')
 expect(weddingOutfitsFor(wedding,'rudy').partner).toBe(a.outfit)
 const own={...wedding,inv:{...wedding.inv,[a.item]:1}}
 const selected=chooseWeddingAttire(own,a.item)!
 expect(weddingOutfitsFor(selected,'rudy')).toEqual({player:a.outfit,partner:a.outfit,chosen:true})
 expect(selected.inv).toBe(own.inv);expect(selected.avatar).toBe(own.avatar);expect(selected.romance).toBe(own.romance)
 expect(chooseWeddingAttire(selected,null)).toBeNull()
 const loaded=deserialize(serialize(selected),CONTENT)!
 expect(weddingOutfitsFor(loaded,'rudy')).toEqual(weddingOutfitsFor(selected,'rudy'))
 expect(loaded.inv[a.item]).toBe(1);expect(JSON.stringify(s)).toBe(before)
})
it('never equips missing outfits or exposes them to another relationship, and permits ordinary clothes',()=>{
 const s=engaged()
 expect(weddingGiftsFor(s,'rudy')).toEqual([])
 expect(chooseWeddingAttire(s,null)).toBeNull()
 const wedding={...s,romance:{...s.romance,stage:'married' as const,marriedDay:7,weddingDay:null},scenes:['wedding:rudy']}
 expect(chooseWeddingAttire(wedding,'weddingTuxedo')).toBeNull()
 expect(chooseWeddingAttire({...wedding,scenes:[]},null)).toBeNull()
 expect(weddingOutfitsFor(chooseWeddingAttire(wedding,null)!,'rudy')).toEqual({player:null,partner:null,chosen:true})
})
it('the real wedding tick freezes the fiance gift before the scene and player wardrobe open',()=>{
 const s=engaged(),given=giveWeddingAttire({...s,inv:{weddingWhiteSuit:1}},'rudy','weddingWhiteSuit')!
 const ready={...given,clock:{day:14,minute:1110},scenes:[],player:{...given.player,x:24,y:19,path:[]}}
 const married=tick(ready,.05,()=>.5,CONTENT).state
 expect(married.romance.stage).toBe('married')
 expect(married.scenes).toContain('wedding:rudy')
 expect(weddingOutfitsFor(married,'rudy').partner).toBe('groom-white')
 expect(married.inv.weddingWhiteSuit??0).toBe(0)
})
