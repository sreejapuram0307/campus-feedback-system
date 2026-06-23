import Feedback from '../models/Feedback.js'

export const submitFeedback = async (req, res) => {
  try {
    const {
      studentEmail,
      rollNumber,
      branch,
      year,
      section,
      subject,
      q1,
      q2,
      q3,
      q4,
      q5,
      comments,
    } = req.body

    if (
      !studentEmail ||
      !rollNumber ||
      !branch ||
      !year ||
      !section ||
      !subject ||
      !q1 ||
      !q2 ||
      !q3 ||
      !q4 ||
      !q5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      })
    }

    const existing = await Feedback.findOne({
      studentEmail,
      subject,
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Feedback already submitted for this subject',
      })
    }

    const faculty = subject.split(' - ')[1] || 'Unknown'

    const feedback = await Feedback.create({
      studentEmail,
      rollNumber,
      branch,
      year,
      section,
      subject,
      faculty,
      q1,
      q2,
      q3,
      q4,
      q5,
      comments,
    })

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

export const checkFeedbackStatus = async (req, res) => {
  try {
    const { studentEmail, subject } = req.query

    const existing = await Feedback.findOne({
      studentEmail,
      subject,
    })

    return res.json({
      alreadySubmitted: !!existing,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      alreadySubmitted: false,
    })
  }
}