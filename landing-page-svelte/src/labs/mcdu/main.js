// MCDU trainer entry. The trainer is vanilla JS; this only wires styles, analytics and the shared lab modules.
import { inject } from '@vercel/analytics'
import './mcdu.css'
import './trainer.js'
import { mountFeedback } from '../shared/feedback/feedback-panel.js'
import '../shared/pfd-promo.js'

mountFeedback({ key: import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY })
inject()
