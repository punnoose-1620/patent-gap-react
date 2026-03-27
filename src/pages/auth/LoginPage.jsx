import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Signing in...')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { auth } = useStore()

  

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

 const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoadingMessage('Signing in...')

    const wakeTimer = setTimeout(() => {
      setLoadingMessage('Waking up server, please wait...')
    }, 5000)

    try {
      const result = await login(form.email, form.password)
      console.log('Result:', result)                        // ← is success: true?
    console.log('Session:', localStorage.getItem('session')) // ← is session saved?
      clearTimeout(wakeTimer)
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.')
      } else {
        navigate('/dashboard', { replace: true }) // ✅ replace so back button doesn't return to login
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      clearTimeout(wakeTimer)
      setLoading(false)
    }
  }


  return (
    <>
      <Navbar />
      <div className="page-layout">

        {/* Page Hero */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="eyebrow">Secure Access</div>
            <h1 style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 'clamp(22px, 5vw, 50px)',
              fontWeight: 400, color: 'var(--deep)',
              lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 20,
            }}>
              Sign in to{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Patent Gap AI</em>
            </h1>
            <p style={{
              fontSize: 'clamp(15px, 1.5vw, 17px)', fontWeight: 300,
              color: 'var(--ink2)', lineHeight: 1.8, maxWidth: 520,
            }}>
              Access your patent monitoring dashboard, claim-level analysis, and continuous infringement reports.
            </p>
            <div style={{ marginTop: 28, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['Claim-level analysis', 'Continuous monitoring', 'Attorney-reviewed findings'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "'Inconsolata', monospace", fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink2)',
                  }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="page-form-section">
          <div className="page-form-wrap">
            <div className="form-grid">

              {/* Login Card */}
              <div className="form-card">
                <h3 style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 20, color: 'var(--deep)', marginBottom: 6, fontWeight: 700,
                }}>
                  Welcome back
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginBottom: 28 }}>
                  Sign in to your account to continue.
                </p>

                {error && (
                  <div style={{
                    background: 'rgba(185,28,28,0.06)',
                    border: '1px solid rgba(185,28,28,0.18)',
                    borderLeft: '3px solid var(--red)',
                    borderRadius: '0 6px 6px 0',
                    padding: '12px 14px', marginBottom: 22,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="var(--red)" strokeWidth="2" strokeLinecap="round"
                      strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span style={{ fontSize: 13.5, color: 'var(--red)', lineHeight: 1.5 }}>{error}</span>
                  </div>
                )}

                <form onSubmit={submit}>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">Work Email *</label>
                    <input
                      className="form-input"
                      type="email"
                      name="email"
                      placeholder="jane@firm.com"
                      value={form.email}
                      onChange={handle}
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div className="form-group">
                   
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handle}
                        required
                        disabled={loading}
                        autoComplete="current-password"
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        disabled={loading}
                        style={{
                          position: 'absolute', right: 12, top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: 0,
                          display: 'flex', alignItems: 'center',
                          color: 'var(--ink3)',
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="btn-green"
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? (
                      <>
                        {loadingMessage}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                          style={{ animation: 'spin 1s linear infinite' }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>

                  <p style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                    Don't have access yet?{' '}
                    <Link to="/register" style={{ color: 'var(--accent)' }}>
                      Register
                    </Link>
                  </p>

                </form>

                {/* Divider */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  margin: '28px 0 20px',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                  <span style={{
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)',
                  }}>
                    Secure Access
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                </div>

                {/* Trust badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                  {['SOC 2 Ready', 'TLS Encrypted', 'Attorney-Grade'].map((badge, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'var(--accent)', opacity: 0.6,
                      }} />
                      <span style={{
                        fontFamily: "'Inconsolata', monospace", fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink3)',
                      }}>
                        {badge}
                      </span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Info Side */}
              <div>
                <div className="eyebrow">Your Dashboard</div>
                <h2 className="serif" style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: 18 }}>
                  Everything You Need for Patent <em>Enforcement</em>
                </h2>
                <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 36 }}>
                  Your account gives you access to continuous monitoring, claim-level analysis, and structured findings ready for legal review.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { num: '01', title: 'Patent Portfolio Dashboard', desc: 'View all monitored patents with live infringement signals and risk scores at a glance.' },
                    { num: '02', title: 'Claim-Level Analysis', desc: 'Drill into individual claims to see exactly where potential infringement is occurring.' },
                    { num: '03', title: 'Structured Findings', desc: 'Attorney-ready reports with source citations, evidence chains, and export options.' },
                    { num: '04', title: 'Continuous Alerts', desc: 'Get notified when new infringement signals are detected across your monitored portfolio.' },
                  ].map((step, i) => (
                    <div key={i} className="att-item" style={{ paddingLeft: 0 }}>
                      <span className="att-num">{step.num}</span>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--deep)', marginBottom: 4 }}>{step.title}</h4>
                        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.65 }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 36, background: 'var(--surf)',
                  border: '1px solid var(--rule)', borderLeft: '3px solid var(--accent)',
                  borderRadius: '0 8px 8px 0', padding: '18px 20px',
                }}>
                  <p style={{
                    fontFamily: "'Libre Baskerville', serif", fontSize: 15,
                    fontStyle: 'italic', color: 'var(--deep)', lineHeight: 1.65,
                  }}>
                    "Patent Gap AI gives us a live view of our entire portfolio's exposure. It's become an essential part of our enforcement workflow."
                  </p>
                  <p style={{
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.10em',
                    color: 'var(--ink3)', marginTop: 10,
                  }}>
                    — Beta Partner, IP Litigation Firm
                  </p>
                </div>

                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 12 }}>
                    Don't have an account yet?
                  </p>
                  <Link to="/request-demo" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Request Early Access
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <Footer />
    </>
  )
}
