import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token')

    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, document.title, '/dashboard')
    }

    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const decoded = decodeToken(token)
    if (!decoded) {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
      return
    }

    setUser(decoded)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Campus Feedback Hub</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-bold text-white">
            CFH
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-slate-50 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Roll Number</span>
            <span className="font-medium text-slate-900">{user.rollNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Branch</span>
            <span className="font-medium text-slate-900">{user.branch}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Year</span>
            <span className="font-medium text-slate-900">{user.year}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Section</span>
            <span className="font-medium text-slate-900">{user.section}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
