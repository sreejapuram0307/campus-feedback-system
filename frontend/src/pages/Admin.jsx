import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export default function Admin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')

    if (token) {
      localStorage.setItem('token', token)
      window.history.replaceState({}, document.title, '/admin')
    }

    const storedToken = localStorage.getItem('token')

    if (!storedToken) {
      navigate('/login', { replace: true })
      return
    }

    const decoded = decodeToken(storedToken)

    if (!decoded || decoded.role !== 'admin') {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
      return
    }

    setAdminUser(decoded)
  }, [location.search, navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  if (!adminUser) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', padding: '32px' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '28px', color: '#111827' }}>Admin Dashboard</h1>
        <p style={{ margin: '0 0 20px', fontSize: '16px', color: '#4b5563' }}>Welcome Administrator</p>

        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Logged in as:</p>
          <p style={{ margin: 0, fontSize: '16px', color: '#111827', wordBreak: 'break-all' }}>{adminUser.email}</p>
        </div>

        <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#374151' }}>This is the Admin Dashboard.</p>

        <button
          type="button"
          onClick={handleLogout}
          style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: '10px', background: '#2563eb', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
