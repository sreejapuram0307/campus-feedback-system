import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import { getUser } from './controllers/authController.js'
import { verifyToken } from './middleware/authMiddleware.js'

const app = express()

connectDB()

app.use(cors({ origin: env.FRONTEND_URL }))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/feedback', feedbackRoutes)

app.get('/api/user', verifyToken, getUser)

app.get('/', (req, res) => {
  res.json({ message: 'Backend running successfully' })
})

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
})