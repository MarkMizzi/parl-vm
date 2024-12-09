import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ToastPlugin from 'vue-toast-notification'
// Import one of the available themes
import 'vue-toast-notification/dist/theme-default.css'

const app = createApp(App)

app.use(createPinia())
app.use(ToastPlugin)
app.use(router)

app.mount('#app')
