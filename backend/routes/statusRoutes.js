import { Router } from 'express'
import { getStatuses, upsertStatus } from '../controllers/statusController.js'

const router = Router()

// GET /admin/status?year=&branch=&section=&subject=&faculty=
router.get('/', getStatuses)

// POST /admin/status
router.post('/', upsertStatus)

export default router
