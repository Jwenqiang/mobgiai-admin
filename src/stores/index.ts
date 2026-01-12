import { createPinia } from 'pinia'
// 引入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const store= createPinia();
// 挂载持久化插件到 Pinia
store.use(piniaPluginPersistedstate)

export default store