import { Router } from 'express'
import {
  redirectToGoogle,
  googleCallback,
  logout,
} from '../controllers/authController.js'

const router = Router()

router.get('/google', redirectToGoogle)
router.get('/google/callback', googleCallback)
router.get('/logout', logout)

export default router
