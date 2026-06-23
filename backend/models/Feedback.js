import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true },
    rollNumber: { type: String, required: true },
    branch: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    faculty: { type: String, required: true },
    q1: { type: String, required: true },
    q2: { type: String, required: true },
    q3: { type: String, required: true },
    q4: { type: String, required: true },
    q5: { type: String, required: true },
    comments: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model('Feedback', feedbackSchema)