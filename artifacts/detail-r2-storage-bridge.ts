// Audit-only entry: the production app and this entry share the same bundled store.
import { useGame } from '../src/store/game-store'
import { CONTENT } from '../src/content/catalog'
import { ITEM_TEXT } from '../src/content/text'
import { newGame } from '../src/engine/game'
import { HOME_ENTRY, PLACES, cameraFor, VIEW_W, VIEW_H } from '../src/engine/world'
import { newChild } from '../src/engine/child'
import { saveGameAsync } from '../src/engine/save'
;(window as unknown as { __auditModules: unknown }).__auditModules = { CONTENT, ITEM_TEXT, newGame, newChild, HOME_ENTRY, PLACES, cameraFor, VIEW_W, VIEW_H, saveGameAsync }
;(window as unknown as { __gd: unknown }).__gd = { store: useGame, step: () => {} }
