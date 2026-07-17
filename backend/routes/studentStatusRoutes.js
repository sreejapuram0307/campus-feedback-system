import { Router } from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import { getStudentStatuses } from '../controllers/statusController.js'

const router = Router()

// GET /student/status
// JWT required — backend derives branch/year/section from the token,
// the student never passes them manually.
router.get('/status', verifyToken, getStudentStatuses)

export default router
