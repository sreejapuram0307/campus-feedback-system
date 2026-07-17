import mongoose from 'mongoose'

// Flat document per subject assignment.
// Example: { branch: "AIML", year: 2, section: "B", subject: "SIMA", faculty: "Rajashekhar" }
const facultyAssignmentSchema = new mongoose.Schema(
  {
    branch:  { type: String, required: true },
    year:    { type: Number, required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    faculty: { type: String, required: true },
  },
  { timestamps: false }
)

export default mongoose.model(
  'FacultyAssignment',
  facultyAssignmentSchema,
  'faculty_assignments'
)
