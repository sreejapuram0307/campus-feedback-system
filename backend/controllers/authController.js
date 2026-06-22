import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import Student from '../models/Student.js'

function createOAuth2Client() {
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL
  )
}

export const redirectToGoogle = (req, res) => {
  const oauth2Client = createOAuth2Client()

  const url = oauth2Client.generateAuthUrl({
    access_type: 'online',
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    prompt: 'select_account',
  })

  console.log('OAuth URL:', url)
  res.redirect(url)
}

export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query

    if (!code) {
      return res.redirect(`${env.FRONTEND_URL}/access-denied`)
    }

    const oauth2Client = createOAuth2Client()

    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
    })

    oauth2Client.setCredentials(tokens)

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileRes.ok) {
      return res.redirect(`${env.FRONTEND_URL}/access-denied`)
    }

    const googleProfile = await profileRes.json()
    const email = googleProfile.emails?.[0]?.value ?? googleProfile.email ?? null

    if (!email) {
      return res.redirect(`${env.FRONTEND_URL}/access-denied`)
    }

    const student = await Student.findOne({ email })

    if (!student) {
      return res.redirect(`${env.FRONTEND_URL}/access-denied`)
    }

    const token = jwt.sign(
      {
        email: student.email,
        rollNumber: student.rollNumber,
        branch: student.branch,
        year: student.year,
        section: student.section,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    return res.redirect(`${env.FRONTEND_URL}/dashboard?token=${token}`)
  } catch (error) {
    console.error('Google callback error:', error.message)
    return res.redirect(`${env.FRONTEND_URL}/access-denied`)
  }
}

export const getUser = (req, res) => {
  res.json({ user: req.user })
}

export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' })
}
