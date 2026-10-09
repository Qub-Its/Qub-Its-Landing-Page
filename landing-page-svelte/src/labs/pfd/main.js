import { mount } from 'svelte'
import { inject } from '@vercel/analytics'
import './pfd.css'
import App from './App.svelte'
import { detectLang } from './i18n.js'
import { maybeIntro } from '../shared/intro/intro.js'

const app = mount(App, {
  target: document.getElementById('app'),
})

maybeIntro({ target: 'pfd', lang: detectLang() })
inject()

export default app
