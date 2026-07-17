import FeedbackStatus from '../models/FeedbackStatus.js'
import Student from '../models/Student.js'

// ─────────────────────────────────────────────────────────────
// GET /admin/status?year=&branch=&section=&subject=&faculty=
//
// Fetches ALL status documents for the given filter combination
// in a SINGLE query — no loop queries.
//
// Returns a flat array; the frontend converts it to an O(1)
// lookup map keyed by  "questionKey|answer".
// ─────────────────────────────────────────────────────────────
export const getStatuses = async (req, res) => {
  try {
    const { year, branch, section, subject, faculty } = req.query

    if (!year || !branch || !section || !subject || !faculty) {
      return res.status(400).json({
        success: false,
        message: 'year, branch, section, subject, and faculty are required',
      })
    }

    // Use $in for year to handle Number vs String storage inconsistency
    const numericYear = Number(year)
    const filter = {
      year:    { $in: [numericYear, String(numericYear)] },
      branch:  branch.trim(),
      section: section.trim(),
      subject: subject.trim(),
      faculty: faculty.trim(),
    }

    const docs = await FeedbackStatus.find(filter)
      .select('questionKey answer status -_id')
      .lean()

    return res.json({ success: true, statuses: docs })
  } catch (error) {
    console.error('getStatuses error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /admin/status
//
// Creates or updates (upsert) a status document for one
// specific (year, branch, section, subject, faculty,
//           questionKey, answer) combination.
//
// Uses findOneAndUpdate + upsert:true — never creates duplicates.
// ─────────────────────────────────────────────────────────────
const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected']

export const upsertStatus = async (req, res) => {
  try {
    const { year, branch, section, subject, faculty, questionKey, answer, status } = req.body

    if (!year || !branch || !section || !subject || !faculty || !questionKey || !answer || !status) {
      return res.status(400).json({
        success: false,
        message: 'year, branch, section, subject, faculty, questionKey, answer, and status are all required',
      })
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    // The unique filter that identifies one status document
    const numericYear = Number(year)
    const queryFilter = {
      year:        { $in: [numericYear, String(numericYear)] },
      branch:      branch.trim(),
      section:     section.trim(),
      subject:     subject.trim(),
      faculty:     faculty.trim(),
      questionKey: questionKey.trim(),
      answer:      answer.trim(),
    }

    // What we set on create or update
    const updateData = {
      // On upsert (new doc), also write the scalar year value
      year:        numericYear,
      branch:      branch.trim(),
      section:     section.trim(),
      subject:     subject.trim(),
      faculty:     faculty.trim(),
      questionKey: questionKey.trim(),
      answer:      answer.trim(),
      status,
      updatedBy:   req.user?.email ?? null,
      updatedAt:   new Date(),
    }

    const doc = await FeedbackStatus.findOneAndUpdate(
      queryFilter,
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return res.json({
      success:     true,
      questionKey: doc.questionKey,
      answer:      doc.answer,
      status:      doc.status,
    })
  } catch (error) {
    console.error('upsertStatus error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────
// Human-readable labels for each question key.
// Kept here so the student API response is self-describing.
// ─────────────────────────────────────────────────────────────
const QUESTION_LABELS = {
  q1: 'Teaching Quality',
  q2: 'Communication',
  q3: 'Subject Knowledge',
  q4: 'Punctuality',
  q5: 'Interaction',
}

// ─────────────────────────────────────────────────────────────
// GET /student/status
//
// Protected by verifyToken.  The student's branch, year, and
// section are read from req.user (JWT payload) — the student
// never sends these values manually, preventing spoofing.
//
// Returns all issue statuses for the student's class so they
// can see what feedback issues are being actioned.
//
// resolvedBy is intentionally EXCLUDED — admin identity is
// never exposed to students.
// ─────────────────────────────────────────────────────────────
export const getStudentStatuses = async (req, res) => {
  try {
    // Re-read the student's CURRENT record from the database using their
    // verified email from the JWT.  This prevents stale JWT payloads from
    // leaking data across section changes: if the student's section in the
    // database has changed since the token was issued, the live value is
    // always used.  Email is the only JWT field we trust here — it is the
    // stable account identity and cannot change.
    const studentEmail = req.user?.email
    if (!studentEmail) {
      return res.status(401).json({ success: false, message: 'Invalid token — email missing.' })
    }

    const student = await Student.findOne({ email: studentEmail })
      .select('branch year section')
      .lean()

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      })
    }

    const { branch, year, section } = student

    if (!branch || year === undefined || !section) {
      return res.status(400).json({
        success: false,
        message: 'Student profile is incomplete — branch, year, or section missing.',
      })
    }

    const numericYear = Number(year)

    // Filter is built exclusively from live DB values — never from JWT or
    // any frontend-supplied parameter.
    const filter = {
      year:    { $in: [numericYear, String(numericYear)] },
      branch:  branch.trim(),
      section: section.trim(),
    }

    const docs = await FeedbackStatus.find(filter)
      .select('subject questionKey answer status updatedAt -_id')
      .sort({ subject: 1, questionKey: 1 })
      .lean()

    const statuses = docs.map((d) => ({
      subject:   d.subject,
      question:  QUESTION_LABELS[d.questionKey] ?? d.questionKey,
      issue:     d.answer,
      status:    d.status,
      updatedAt: d.updatedAt,
    }))

    return res.json({ success: true, statuses })
  } catch (error) {
    console.error('getStudentStatuses error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}
