import { HOME_SPACE_DIRECTIONS } from './home-space-directions'
import type { FurnitureArt } from './furniture-art'

/** 같은 벤치 그림의 가운데만 늘려 세 사람이 쓰는 공동 벤치로 만든다. */
export const VILLAGE_BENCH_ART: FurnitureArt = {
 w:3,h:1,
 rows:HOME_SPACE_DIRECTIONS.longBench.down.rows.map(r=>r.slice(0,16)+r.slice(8,24)+r.slice(16)),
}
