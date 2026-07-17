import mongoose from 'mongoose'

// One document per unique (year, branch, section, subject, faculty, questionKey, answer) tuple.
// Uses a compound unique index to guarantee no duplicates.
// findOneAndUpdate + upsert:true is used for all writes.
const feedbackStatusSchema = new mongoose.Schema(
  {
    year:        { type: mongoose.Schema.Types.Mixed, required: true }, // Number or String
    branch:      { type: String, required: true },
    section:     { type: String, required: true },
    subject:     { type: String, required: true },
    faculty:     { type: String, required: true },
    questionKey: { type: String, required: true }, // "q1" … "q5"
    answer:      { type: String, required: true },
    status:      {
      type:    String,
      enum:    ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    updatedBy: { type: String, default: null },   // admin email
    updatedAt: { type: Date,   default: null },
  },
  {
    // No createdAt/updatedAt from timestamps — we manage updatedAt manually
    timestamps: false,
    collection: 'feedback_status',
  }
)

// Compound unique index — prevents duplicate status docs for the same answer
feedbackStatusSchema.index(
  { year: 1, branch: 1, section: 1, subject: 1, faculty: 1, questionKey: 1, answer: 1 },
  { unique: true }
)

export default mongoose.model('FeedbackStatus', feedbackStatusSchema, 'feedback_status')
