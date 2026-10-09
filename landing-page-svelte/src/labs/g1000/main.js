import { mount } from 'svelte'
import { inject } from '@vercel/analytics'
import './g1000.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app'),
})

inject()

export default app
