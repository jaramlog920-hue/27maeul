import { createRoot } from 'react-dom/client'
import { LandscapeScene } from './StarsScene'
import '../../app/global.css'
const kind = new URLSearchParams(window.location.search).get('scene') === 'sunset' ? 'sunset' : 'stars'
createRoot(document.getElementById('root')!).render(<LandscapeScene kind={kind} preview onFinish={() => { window.location.href = '/' }} />)
