import type { App } from 'vue'

const components = {}

export default {
  install(app: App) {
    Object.keys(components).forEach(key => {
      app.component(key, components[key as keyof typeof components])
    })
  }
}