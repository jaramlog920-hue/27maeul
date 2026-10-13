import config from '../../vite.config'

// 화면 검증 중 다른 작업의 파일 변경이 게임을 재시작하지 않게 한다.
export default { ...config, server: { host: '127.0.0.1', port: 5181, hmr: false, watch: { ignored: ['**/src/**'] } } }
