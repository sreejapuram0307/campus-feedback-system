import { Router } from 'express'
import {
  submitFeedback,
  checkFeedbackStatus,
  getSubmittedSubjects,
  getSubjectsForStudent,
} from '../controllers/feedbackController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/submit', submitFeedback)
router.get('/check', checkFeedbackStatus)
router.get('/submitted-subjects', getSubmittedSubjects)
router.get('/subjects/:rollNo', verifyToken, getSubjectsForStudent)

export default router