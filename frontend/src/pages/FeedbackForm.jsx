import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/FeedbackForm.css'

export default function FeedbackForm() {
  const navigate = useNavigate()
  const [selectedSubject, setSelectedSubject] = useState('')
  const [formData, setFormData] = useState({
    teachingQuality: '',
    communication: '',
    subjectKnowledge: '',
    punctuality: '',
    interaction: '',
    additionalComments: '',
  })
  const [otherResponses, setOtherResponses] = useState({
    teachingQuality: '',
    communication: '',
    subjectKnowledge: '',
    punctuality: '',
    interaction: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const subject = localStorage.getItem('selectedSubject')
    if (!subject) {
      navigate('/dashboard', { replace: true })
      return
    }
    setSelectedSubject(subject)
  }, [navigate])

  const handleQuestionChange = (questionKey, value) => {
    setFormData((prev) => ({
      ...prev,
      [questionKey]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [questionKey]: '',
    }))
  }

  const handleOtherChange = (questionKey, value) => {
    setOtherResponses((prev) => ({
      ...prev,
      [questionKey]: value,
    }))
  }

  const handleAddCommentsChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      additionalComments: value,
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    const requiredFields = [
      'teachingQuality',
      'communication',
      'subjectKnowledge',
      'punctuality',
      'interaction',
    ]

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // UPDATED FOR BACKEND INTEGRATION
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('Login expired')
        navigate('/login')
        return
      }

      const payload = JSON.parse(atob(token.split('.')[1]))

      const feedbackData = {
        studentEmail: payload.email,
        rollNumber: payload.rollNumber,
        branch: payload.branch,
        year: payload.year,
        section: payload.section,
        subject: selectedSubject,
        q1:
          formData.teachingQuality === 'Other'
            ? otherResponses.teachingQuality
            : formData.teachingQuality,
        q2:
          formData.communication === 'Other'
            ? otherResponses.communication
            : formData.communication,
        q3:
          formData.subjectKnowledge === 'Other'
            ? otherResponses.subjectKnowledge
            : formData.subjectKnowledge,
        q4:
          formData.punctuality === 'Other'
            ? otherResponses.punctuality
            : formData.punctuality,
        q5:
          formData.interaction === 'Other'
            ? otherResponses.interaction
            : formData.interaction,
        comments: formData.additionalComments,
      }

      const response = await fetch('http://localhost:5000/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.message)
        return
      }

      navigate('/success')
    } catch (error) {
      console.error('Submit error:', error)
      alert('Submission failed')
    }
  }

  if (!selectedSubject) {
    return null
  }

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <button
            className="feedback-back-btn"
            onClick={() => navigate('/dashboard')}
            type="button"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="feedback-title">Feedback Form</h1>
          <div style={{ width: '20px' }} />
        </div>

        <div className="feedback-subject-info">
          <h2>Feedback for: {selectedSubject}</h2>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">

          {/* Q1 */}
          <fieldset className="form-section">
            <legend className="form-legend">Q1 Teaching Quality</legend>
            {['Too Fast', 'Too Slow', 'Need More Examples', 'Voice Not Audible', 'No Issues', 'Other'].map((option) => (
              <div key={option}>
                <input
                  type="radio"
                  name="teachingQuality"
                  value={option}
                  checked={formData.teachingQuality === option}
                  onChange={(e) => handleQuestionChange('teachingQuality', e.target.value)}
                />
                {option}
              </div>
            ))}
            {formData.teachingQuality === 'Other' && (
              <input
                type="text"
                placeholder="Please specify..."
                value={otherResponses.teachingQuality}
                onChange={(e) => handleOtherChange('teachingQuality', e.target.value)}
              />
            )}
            {errors.teachingQuality && <span>{errors.teachingQuality}</span>}
          </fieldset>

          {/* Q2 */}
          <fieldset className="form-section">
            <legend className="form-legend">Q2 Communication</legend>
            {['Difficult to Understand', 'Less Interactive', 'Encourages Questions', 'Good Communication', 'No Issues', 'Other'].map((option) => (
              <div key={option}>
                <input
                  type="radio"
                  name="communication"
                  value={option}
                  checked={formData.communication === option}
                  onChange={(e) => handleQuestionChange('communication', e.target.value)}
                />
                {option}
              </div>
            ))}
            {formData.communication === 'Other' && (
              <input
                type="text"
                placeholder="Please specify..."
                value={otherResponses.communication}
                onChange={(e) => handleOtherChange('communication', e.target.value)}
              />
            )}
          </fieldset>

          {/* Q3 */}
          <fieldset className="form-section">
            <legend className="form-legend">Q3 Subject Knowledge</legend>
            {['Excellent', 'Good', 'Average', 'Need More Practical Applications', 'No Issues', 'Other'].map((option) => (
              <div key={option}>
                <input
                  type="radio"
                  name="subjectKnowledge"
                  value={option}
                  checked={formData.subjectKnowledge === option}
                  onChange={(e) => handleQuestionChange('subjectKnowledge', e.target.value)}
                />
                {option}
              </div>
            ))}
            {formData.subjectKnowledge === 'Other' && (
              <input
                type="text"
                placeholder="Please specify..."
                value={otherResponses.subjectKnowledge}
                onChange={(e) => handleOtherChange('subjectKnowledge', e.target.value)}
              />
            )}
          </fieldset>

          {/* Q4 */}
          <fieldset className="form-section">
            <legend className="form-legend">Q4 Punctuality</legend>
            {['Always On Time', 'Frequently Late', 'Ends Early', 'No Issues', 'Other'].map((option) => (
              <div key={option}>
                <input
                  type="radio"
                  name="punctuality"
                  value={option}
                  checked={formData.punctuality === option}
                  onChange={(e) => handleQuestionChange('punctuality', e.target.value)}
                />
                {option}
              </div>
            ))}
          </fieldset>

          {/* Q5 */}
          <fieldset className="form-section">
            <legend className="form-legend">Q5 Interaction</legend>
            {['Encourages Questions', 'Solves Doubts Well', 'Less Interaction', "Doesn't Encourage Questions", 'No Issues', 'Other'].map((option) => (
              <div key={option}>
                <input
                  type="radio"
                  name="interaction"
                  value={option}
                  checked={formData.interaction === option}
                  onChange={(e) => handleQuestionChange('interaction', e.target.value)}
                />
                {option}
              </div>
            ))}
          </fieldset>

          <div className="form-section">
            <label>Additional Comments</label>
            <textarea
              value={formData.additionalComments}
              onChange={(e) => handleAddCommentsChange(e.target.value)}
              rows="5"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="form-submit-btn">
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}