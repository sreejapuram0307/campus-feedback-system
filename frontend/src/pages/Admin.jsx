import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/Admin.css'

const API = 'http://localhost:5000'

// ── Static dropdown options (as specified) ─────────────────
const YEAR_OPTIONS    = [1, 2, 3, 4]
const BRANCH_OPTIONS  = ['AIML', 'IOT']
const SECTION_OPTIONS = ['A', 'B', 'C']
const YEAR_LABELS     = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' }

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected']

// ── Helpers ────────────────────────────────────────────────
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

// ── Sub-components ─────────────────────────────────────────

function Spinner() {
  return <div className="adm-spinner" aria-label="Loading" />
}

function StateCard({ type, title, desc }) {
  const icons = { idle: '🔍', error: '⚠️', empty: '📭' }
  return (
    <div className="adm-state-card">
      <div className={`adm-state-icon ${type}`}>
        {type === 'loading' ? <Spinner /> : icons[type]}
      </div>
      <p className="adm-state-title">{title}</p>
      {desc && <p className="adm-state-desc">{desc}</p>}
    </div>
  )
}

// ── AnswerBar — enhanced with inline status controls ────────
// statusMap  : { "questionKey|answer" → currentStatus }
// filterCtx  : { year, branch, section, subject, faculty }
// onStatusSaved: (questionKey, answer, newStatus) => void
function AnswerBar({ answer, count, total, isTop, questionKey, statusMap, filterCtx, onStatusSaved }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  // Build the O(1) lookup key
  const mapKey         = `${questionKey}|${answer}`
  const persistedStatus = statusMap[mapKey] ?? 'Pending'

  // Local draft — only committed to backend on "Update"
  const [draft,   setDraft]   = useState(persistedStatus)
  const [saving,  setSaving]  = useState(false)

  // Keep draft in sync if parent re-fetches statuses
  useEffect(() => {
    setDraft(persistedStatus)
  }, [persistedStatus])

  async function handleUpdate() {
    if (draft === persistedStatus) return   // nothing changed
    setSaving(true)
    try {
      const res  = await fetch(`${API}/admin/status`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          ...filterCtx,
          questionKey,
          answer,
          status: draft,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onStatusSaved(questionKey, answer, data.status)
      }
    } catch {
      // silently leave draft unchanged — user can retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="adm-answer-row">
      {/* ── existing analytics bar — UNCHANGED ── */}
      <div className="adm-answer-meta">
        <span className="adm-answer-text">{answer}</span>
        <span className="adm-answer-count">
          {count}
          <span className="adm-answer-pct"> ({pct}%)</span>
        </span>
      </div>
      <div className="adm-bar-track">
        <div
          className={`adm-bar-fill${isTop ? ' top' : ''}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* ── Status controls — new, below the bar ── */}
      <div className="adm-status-row">
        <span className="adm-status-label">Status</span>
        <select
          className="adm-status-select"
          data-status={draft}
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={`Status for ${answer}`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="button"
          className="adm-status-update-btn"
          disabled={saving || draft === persistedStatus}
          onClick={handleUpdate}
        >
          {saving ? 'Saving…' : 'Update'}
        </button>
        {/* Badge showing the currently saved status */}
        <span className="adm-status-badge" data-status={persistedStatus}>
          {persistedStatus}
        </span>
      </div>
    </div>
  )
}

// ── QuestionCard — receives statusMap + filterCtx + onStatusSaved ──
function QuestionCard({ question, totalResponses, statusMap, filterCtx, onStatusSaved }) {
  const num   = question.key.replace('q', '')
  const title = question.label.split('. ').slice(1).join('. ')
  return (
    <div className="adm-question-card">
      <div className="adm-question-header">
        <span className="adm-question-number">Q{num}</span>
        <span className="adm-question-title">{title}</span>
      </div>
      {question.answers.length === 0 ? (
        <p className="adm-no-data-q">No answers recorded for this question.</p>
      ) : (
        <div className="adm-answers-list">
          {question.answers.map((a, idx) => (
            <AnswerBar
              key={a.answer}
              answer={a.answer}
              count={a.count}
              total={totalResponses}
              isTop={idx === 0}
              questionKey={question.key}
              statusMap={statusMap}
              filterCtx={filterCtx}
              onStatusSaved={onStatusSaved}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate()
  const location = useLocation()

  const [adminUser,   setAdminUser]   = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter state — year/branch/section are static; faculty is dynamic
  const [year,    setYear]    = useState('')
  const [branch,  setBranch]  = useState('')
  const [section, setSection] = useState('')

  // Faculty options fetched from DB: [{ label, faculty, subject }]
  const [facultyOptions,       setFacultyOptions]       = useState([])
  const [facultyLoading,       setFacultyLoading]       = useState(false)
  const [selectedFaculty,      setSelectedFaculty]      = useState('')
  const [selectedSubject,      setSelectedSubject]      = useState('')
  const [selectedFacultyLabel, setSelectedFacultyLabel] = useState('')

  // Analytics state
  const [analytics,  setAnalytics]  = useState(null)
  const [fetchState, setFetchState] = useState('idle')
  const [errorMsg,   setErrorMsg]   = useState('')

  // ── Status map: "questionKey|answer" → status string ──────
  // Single source of truth — loaded once after analytics fetch,
  // updated optimistically on every successful PATCH.
  const [statusMap, setStatusMap] = useState({})

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    const params   = new URLSearchParams(location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, document.title, '/admin')
    }

    const token = localStorage.getItem('token')
    if (!token) { navigate('/login', { replace: true }); return }

    const decoded = decodeToken(token)
    if (!decoded || decoded.role !== 'admin') {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
      return
    }

    setAdminUser(decoded)
  }, [location.search, navigate])

  // ── Load faculty options when year + branch + section are all set ──
  const loadFacultyOptions = useCallback(async (y, b, s) => {
    if (!y || !b || !s) {
      setFacultyOptions([])
      return
    }
    setFacultyLoading(true)
    setFacultyOptions([])
    setSelectedFaculty('')
    setSelectedSubject('')
    setSelectedFacultyLabel('')
    setAnalytics(null)
    setFetchState('idle')
    try {
      const params = new URLSearchParams({ year: y, branch: b, section: s })
      const res  = await fetch(`${API}/admin/faculties?${params}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setFacultyOptions(data.faculties)
    } catch {
      setFacultyOptions([])
    } finally {
      setFacultyLoading(false)
    }
  }, [])

  // Reload faculty whenever any of the three context dropdowns change
  useEffect(() => {
    loadFacultyOptions(year, branch, section)
  }, [year, branch, section, loadFacultyOptions])

  // ── Year / Branch / Section change handlers ───────────────
  function handleYearChange(val) {
    setYear(val)
    setSelectedFaculty('')
    setSelectedSubject('')
    setSelectedFacultyLabel('')
    setAnalytics(null)
    setFetchState('idle')
    setStatusMap({})
  }

  function handleBranchChange(val) {
    setBranch(val)
    setSelectedFaculty('')
    setSelectedSubject('')
    setSelectedFacultyLabel('')
    setAnalytics(null)
    setFetchState('idle')
    setStatusMap({})
  }

  function handleSectionChange(val) {
    setSection(val)
    setSelectedFaculty('')
    setSelectedSubject('')
    setSelectedFacultyLabel('')
    setAnalytics(null)
    setFetchState('idle')
    setStatusMap({})
  }

  // ── Faculty change handler ────────────────────────────────
  function handleFacultyChange(val) {
    const opt = facultyOptions.find((f) => f.label === val)
    setSelectedSubject(val)
    setSelectedFaculty(opt ? opt.faculty : '')
    setSelectedFacultyLabel(val)
    setAnalytics(null)
    setFetchState('idle')
    setStatusMap({})
  }

  // ── Fetch analytics + statuses ────────────────────────────
  async function fetchAnalytics() {
    if (!year || !branch || !section || !selectedSubject || !selectedFaculty) return

    setFetchState('loading')
    setAnalytics(null)
    setStatusMap({})
    setErrorMsg('')

    const qp = new URLSearchParams({
      year,
      branch,
      section,
      subject: selectedSubject,
      faculty: selectedFaculty,
    })

    try {
      // Fire analytics and status fetches in parallel
      const [analyticsRes, statusRes] = await Promise.all([
        fetch(`${API}/admin/analytics?${qp}`, { headers: authHeaders() }),
        fetch(`${API}/admin/status?${qp}`,    { headers: authHeaders() }),
      ])

      const analyticsData = await analyticsRes.json()
      const statusData    = await statusRes.json()

      if (!analyticsData.success) {
        setErrorMsg(analyticsData.message || 'Failed to load analytics.')
        setFetchState('error')
        return
      }

      // Build O(1) lookup map from the status array — single pass
      if (statusData.success) {
        const map = {}
        for (const s of statusData.statuses) {
          map[`${s.questionKey}|${s.answer}`] = s.status
        }
        setStatusMap(map)
      }

      if (analyticsData.totalResponses === 0) {
        setFetchState('empty')
        setAnalytics(analyticsData)
        return
      }

      setAnalytics(analyticsData)
      setFetchState('done')
    } catch {
      setErrorMsg('Could not connect to the server. Please ensure the backend is running.')
      setFetchState('error')
    }
  }

  // ── Called by AnswerBar after a successful POST /admin/status ──
  // Updates only the one entry that changed — no re-fetch needed.
  function handleStatusSaved(questionKey, answer, newStatus) {
    setStatusMap((prev) => ({
      ...prev,
      [`${questionKey}|${answer}`]: newStatus,
    }))
  }

  // ── Clear all ─────────────────────────────────────────────
  function clearFilters() {
    setYear('')
    setBranch('')
    setSection('')
    setSelectedFaculty('')
    setSelectedSubject('')
    setSelectedFacultyLabel('')
    setFacultyOptions([])
    setAnalytics(null)
    setFetchState('idle')
    setErrorMsg('')
    setStatusMap({})
  }

  // ── Logout ────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  if (!adminUser) return null

  const allSelected     = year && branch && section && selectedSubject && selectedFaculty
  const facultyDisabled = facultyLoading || !year || !branch || !section

  // Context object passed to every AnswerBar for the status POST body
  const filterCtx = { year, branch, section, subject: selectedSubject, faculty: selectedFaculty }

  return (
    <div className="adm-shell">

      {/* Mobile hamburger */}
      <button
        type="button"
        className="adm-menu-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`adm-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        role="presentation"
      />

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="adm-sidebar-header">
          <div className="adm-brand">
            <div className="adm-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="adm-brand-text">Campus Feedback Hub</span>
          </div>
        </div>

        <nav className="adm-sidebar-nav">
          <button type="button" className="adm-nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button type="button" className="adm-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analytics</span>
          </button>
        </nav>

        <div className="adm-sidebar-footer">
          <button type="button" className="adm-logout-sidebar-btn" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="adm-main">

        {/* Top bar */}
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <h1>Feedback Analytics</h1>
            <p>Select filters to view aggregated feedback data</p>
          </div>
          <div className="adm-topbar-right">
            <div className="adm-admin-badge">
              <div className="adm-admin-avatar">
                {adminUser.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="adm-admin-info">
                <span className="adm-admin-role">Admin</span>
                <span className="adm-admin-email">{adminUser.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="adm-body">

          {/* Filter card */}
          <section className="adm-filter-card">
            <h2 className="adm-filter-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter Feedback
            </h2>

            <div className="adm-filter-grid">

              {/* Year — static */}
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-year">Year</label>
                <select
                  id="filter-year"
                  className="adm-select"
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  <option value="">Select Year</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{YEAR_LABELS[y]}</option>
                  ))}
                </select>
              </div>

              {/* Branch — static */}
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-branch">Branch</label>
                <select
                  id="filter-branch"
                  className="adm-select"
                  value={branch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                >
                  <option value="">Select Branch</option>
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Section — static */}
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-section">Section</label>
                <select
                  id="filter-section"
                  className="adm-select"
                  value={section}
                  onChange={(e) => handleSectionChange(e.target.value)}
                >
                  <option value="">Select Section</option>
                  {SECTION_OPTIONS.map((s) => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              {/* Faculty — dynamic from faculty_assignments */}
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-faculty">Faculty</label>
                <select
                  id="filter-faculty"
                  className="adm-select"
                  value={selectedSubject}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  disabled={facultyDisabled || facultyOptions.length === 0}
                >
                  <option value="">
                    {facultyLoading
                      ? 'Loading...'
                      : !year || !branch || !section
                        ? 'Select Year, Branch & Section first'
                        : facultyOptions.length === 0
                          ? 'No faculty found'
                          : 'Select Faculty'}
                  </option>
                  {facultyOptions.map((f) => (
                    <option key={f.label} value={f.label}>{f.label}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="adm-filter-actions">
              <button
                type="button"
                className="adm-fetch-btn"
                onClick={fetchAnalytics}
                disabled={!allSelected || fetchState === 'loading'}
              >
                {fetchState === 'loading' ? 'Fetching…' : 'View Feedback Analytics'}
              </button>
              <button type="button" className="adm-clear-btn" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </section>

          {/* Summary strip — only after a successful fetch */}
          {fetchState === 'done' && analytics && (
            <div className="adm-summary-strip">
              <div className="adm-summary-card">
                <div className="adm-summary-icon blue">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div className="adm-summary-info">
                  <span className="adm-summary-value">{analytics.totalResponses}</span>
                  <span className="adm-summary-label">Total Responses</span>
                </div>
              </div>

              <div className="adm-summary-card">
                <div className="adm-summary-icon green">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 14l2 2 4-4" />
                  </svg>
                </div>
                <div className="adm-summary-info">
                  <span className="adm-summary-value">{analytics.questions.length}</span>
                  <span className="adm-summary-label">Questions Analysed</span>
                </div>
              </div>

              <div className="adm-summary-card">
                <div className="adm-summary-icon purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="adm-summary-info">
                  <span className="adm-summary-value" style={{ fontSize: '15px', paddingTop: '6px' }}>
                    {selectedFacultyLabel}
                  </span>
                  <span className="adm-summary-label">Faculty</span>
                </div>
              </div>
            </div>
          )}

          {/* State cards */}
          {fetchState === 'idle' && (
            <StateCard
              type="idle"
              title="No data loaded yet"
              desc="Select Year, Branch, Section and Faculty above, then click View Feedback Analytics."
            />
          )}

          {fetchState === 'loading' && (
            <StateCard type="loading" title="Fetching analytics…" />
          )}

          {fetchState === 'error' && (
            <StateCard
              type="error"
              title="Failed to load analytics"
              desc={errorMsg}
            />
          )}

          {fetchState === 'empty' && (
            <StateCard
              type="empty"
              title="No feedback available"
              desc={`No feedback has been submitted yet for ${selectedFacultyLabel} — ${YEAR_LABELS[year]}, ${branch}, Section ${section}.`}
            />
          )}

          {/* Analytics grid */}
          {fetchState === 'done' && analytics && (
            <>
              <h2 className="adm-analytics-heading">
                Response Breakdown — {selectedFacultyLabel}&nbsp;·&nbsp;
                {YEAR_LABELS[year]}&nbsp;·&nbsp;{branch}&nbsp;·&nbsp;Section {section}
              </h2>
              <div className="adm-analytics-grid">
                {analytics.questions.map((q) => (
                  <QuestionCard
                    key={q.key}
                    question={q}
                    totalResponses={analytics.totalResponses}
                    statusMap={statusMap}
                    filterCtx={filterCtx}
                    onStatusSaved={handleStatusSaved}
                  />
                ))}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
