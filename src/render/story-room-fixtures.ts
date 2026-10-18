import {pixels} from './home-space-art'
/** The original sixteen-pixel room-window rectangles from the live map renderer. */
export const STORY_ROOM_PALETTE={a:'#f4e0c0',b:'#f8e8cc',c:'#b8a488',d:'#dbeef7',e:'#ebf5fa',f:'#dacab3',g:'#e8d0a8'}
export const STORY_ROOM_WINDOW=pixels(1,1,[['a',0,0,16,16],['b',0,0,16,2],['c',3,3,10,11],['d',5,5,6,7],['e',5,5,6,2],['c',7,5,2,7],['c',5,8,6,2],['f',2,13,12,2]])
export const STORY_ROOM_WALL=pixels(1,1,[['a',0,0,16,16],['b',0,0,16,2],['g',0,15,16,1]])
