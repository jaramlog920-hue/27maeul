import {SCENES} from '../../content/text'
import {neighborById} from '../../content/catalog'
import {withLookDefaults} from '../../engine/avatar'
import type {Who} from '../../render/sprites'

export function previewPerson(id:string){
 const named=id.split(':').find(part=>!!neighborById(part))
 return named??SCENES[id]?.lines.find(line=>!!neighborById(line.speaker))?.speaker
}
export function previewActor(id:string){
 const who=previewPerson(id),def=neighborById(who??'')
 return {id:who,avatar:def?withLookDefaults({name:def.role,look:def.look??'m',...def.avatar}):null,
  who:(def&&!def.avatar?def.sprite:'writer') as Who}
}

export function previewFamilyChild(){return {avatar:withLookDefaults({name:'아이',look:'f',skin:1}),who:'child' as const,short:1}}
