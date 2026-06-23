import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import { getUser } from './controllers/authController.js'
import { verifyToken } from './middleware/authMiddleware.js'

const app = express()

// Connect MongoDB
connectDB()

// Middleware
app.use(cors({ origin: env.FRONTEND_URL }))
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/feedback', feedbackRoutes)

// Protected route
app.get('/api/user', verifyToken, getUser)

// Test route (optional)
app.get('/', (req, res) => {
  res.json({ message: 'Backend running successfully' })
})

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
})