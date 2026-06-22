import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  email: { type: String, required: true, unique: true },
})

export default mongoose.model('Student', studentSchema, 'students')
