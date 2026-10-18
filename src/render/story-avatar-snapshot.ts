import type {Avatar,Hsv} from '../engine/avatar'

/** Detach mutable HSV tuples as well as the avatar object from the saved household/wardrobe. */
export function storyAvatarSnapshot<T extends Avatar>(avatar:T):T {
 const result={...avatar}
 for(const key of ['eyeColor','hairColor','bottomColor','accColor'] as const){
  const color=avatar[key]
  if(color)result[key]=[...color] as Hsv
 }
 return result
}
