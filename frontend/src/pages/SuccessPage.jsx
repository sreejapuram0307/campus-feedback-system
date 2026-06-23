import { useNavigate } from 'react-router-dom'
import '../styles/SuccessPage.css'

export default function SuccessPage() {
  const navigate = useNavigate()

  const handleReturnToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="success-title">Thank you for your valuable feedback! 🎉</h1>

        <p className="success-message">Your response has been recorded successfully.</p>

        <button type="button" className="success-btn" onClick={handleReturnToDashboard}>
          Return to Subjects
        </button>
      </div>
    </div>
  )
}
