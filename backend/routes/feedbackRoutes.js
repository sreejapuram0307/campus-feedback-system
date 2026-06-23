import { Router } from 'express'
import {
  submitFeedback,
  checkFeedbackStatus,
} from '../controllers/feedbackController.js'

const router = Router()

router.post('/submit', submitFeedback)
router.get('/check', checkFeedbackStatus)

export default router