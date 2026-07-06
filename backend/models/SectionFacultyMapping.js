import mongoose from 'mongoose'

const mappedSubjectSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    faculty: { type: String, required: true },
  },
  { _id: false }
)

const sectionFacultyMappingSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    subjects: { type: [mappedSubjectSchema], required: true },
  },
  { timestamps: false }
)

export default mongoose.model(
  'SectionFacultyMapping',
  sectionFacultyMappingSchema,
  'section_faculty_mapping'
)
