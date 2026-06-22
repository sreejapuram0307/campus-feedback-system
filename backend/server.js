import './config/env.js'
import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import { getUser } from './controllers/authController.js'
import { verifyToken } from './middleware/authMiddleware.js'

const app = express()

connectDB()

app.use(cors({ origin: env.FRONTEND_URL }))
app.use(express.json())

app.use('/auth', authRoutes)
app.get('/api/user', verifyToken, getUser)

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
})
