import Feedback from '../models/Feedback.js'
import FacultyAssignment from '../models/FacultyAssignment.js'

// ─────────────────────────────────────────────────────────────
// Helper: build a regex that matches the trimmed value exactly,
// allowing any surrounding whitespace/newlines in the stored field.
// This handles cases where data was inserted with trailing \n or
// leading/trailing spaces without requiring a data migration.
// ─────────────────────────────────────────────────────────────
function exactTrimmed(value) {
  // Escape regex special characters in the value
  const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // ^\s* ... \s*$  — allow surrounding whitespace in the stored string
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i')
}

// ─────────────────────────────────────────────────────────────
// GET /admin/faculties?year=&branch=&section=
// ─────────────────────────────────────────────────────────────
export const getFaculties = async (req, res) => {
  try {
    const { year, branch, section } = req.query

    if (!year || !branch || !section) {
      return res.status(400).json({
        success: false,
        message: 'year, branch, and section are required',
      })
    }

    const numericYear = Number(year)
    const assignments = await FacultyAssignment.find({
      year:    { $in: [numericYear, String(numericYear)] },
      branch:  exactTrimmed(branch),
      section: exactTrimmed(section),
    }).select('subject faculty -_id')

    const faculties = assignments.map((a) => ({
      label:   `${a.subject.trim()} - ${a.faculty.trim()}`,
      faculty: a.faculty.trim(),
      subject: a.subject.trim(),
    }))

    return res.json({ success: true, faculties })
  } catch (error) {
    console.error('getFaculties error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /admin/analytics?year=&branch=&section=&subject=&faculty=
// ─────────────────────────────────────────────────────────────

const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5']

const QUESTION_LABELS = {
  q1: 'Q1. Teaching Quality',
  q2: 'Q2. Communication',
  q3: 'Q3. Subject Knowledge',
  q4: 'Q4. Punctuality',
  q5: 'Q5. Interaction',
}

export const getFeedbackAnalytics = async (req, res) => {
  try {
    const { year, branch, section, subject, faculty } = req.query

    if (!year || !branch || !section || !subject || !faculty) {
      return res.status(400).json({
        success: false,
        message: 'year, branch, section, subject, and faculty are required',
      })
    }

    const numericYear = Number(year)

    // Use exactTrimmed() for all string fields so stored values with
    // trailing newlines (\n) or extra whitespace still match correctly.
    // year uses $in to handle Number vs String storage difference.
    const matchFilter = {
      year:    { $in: [numericYear, String(numericYear)] },
      branch:  exactTrimmed(branch),
      section: exactTrimmed(section),
      subject: exactTrimmed(subject),
      faculty: exactTrimmed(faculty),
    }

    // Count matching documents
    const totalResponses = await Feedback.countDocuments(matchFilter)

    if (totalResponses === 0) {
      return res.json({
        success: true,
        totalResponses: 0,
        questions: QUESTION_KEYS.map((key) => ({
          key,
          label: QUESTION_LABELS[key],
          answers: [],
        })),
      })
    }

    // Aggregate per question in parallel — all counting in MongoDB
    const results = await Promise.all(
      QUESTION_KEYS.map((key) =>
        Feedback.aggregate([
          { $match: matchFilter },
          { $group: { _id: `$${key}`, count: { $sum: 1 } } },
          { $sort:  { count: -1 } },
        ])
      )
    )

    const questions = QUESTION_KEYS.map((key, i) => ({
      key,
      label:   QUESTION_LABELS[key],
      answers: results[i].map((item) => ({
        answer: item._id,
        count:  item.count,
      })),
    }))

    return res.json({ success: true, totalResponses, questions })
  } catch (error) {
    console.error('getFeedbackAnalytics error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}
