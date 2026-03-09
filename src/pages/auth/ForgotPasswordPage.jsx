import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../hooks/useAuth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Sending...')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoadingMessage('Sending...')

    const wakeTimer = setTimeout(() => {
      setLoadingMessage('Waking up server, please wait...')
    }, 5000)

    try {
      const result = await forgotPassword(email)
      clearTimeout(wakeTimer)
      if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.')
      } else {
        setSent(true)
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
            <div className="eyebrow">Account Recovery</div>
            <h1 style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 'clamp(32px, 3.8vw, 50px)',
              fontWeight: 400, color: 'var(--deep)',
              lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 20,
            }}>
              Reset your{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>password</em>
            </h1>
            <p style={{
              fontSize: 'clamp(15px, 1.5vw, 17px)', fontWeight: 300,
              color: 'var(--ink2)', lineHeight: 1.8, maxWidth: 520,
            }}>
              Enter your work email and we'll send you a secure link to regain access to your patent monitoring dashboard.
            </p>
            <div style={{ marginTop: 28, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['Secure reset link', 'Expires in 30 minutes', 'No data loss'].map((item, i) => (
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

              {/* Card */}
              <div className="form-card">

                {/* ── Success state ── */}
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                    {/* Animated checkmark */}
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'var(--acc-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 22px',
                      animation: 'fadeScale 0.4s cubic-bezier(0.22,1,0.36,1) both',
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>

                    <h3 style={{
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 20, color: 'var(--deep)', marginBottom: 10, fontWeight: 700,
                    }}>
                      Check your inbox
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 6 }}>
                      We sent a password reset link to
                    </p>
                    <p style={{
                      fontFamily: "'Inconsolata', monospace",
                      fontSize: 13.5, fontWeight: 700, color: 'var(--deep)',
                      background: 'var(--surf)', borderRadius: 7,
                      padding: '7px 14px', display: 'inline-block',
                      marginBottom: 24, wordBreak: 'break-all',
                    }}>
                      {email}
                    </p>

                    <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.65, marginBottom: 28 }}>
                      The link expires in <strong style={{ color: 'var(--ink2)' }}>30 minutes</strong>.
                      Check your spam folder if you don't see it.
                    </p>

                    {/* Resend */}
                    <button
                      onClick={() => { setSent(false); setEmail('') }}
                      className="btn-green"
                      style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}
                    >
                      Try a different email
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>

                    <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6 }}>
                      Remembered it?{' '}
                      <Link to="/login" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
                    </p>
                  </div>

                ) : (
                  /* ── Form state ── */
                  <>
                    <h3 style={{
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 20, color: 'var(--deep)', marginBottom: 6, fontWeight: 700,
                    }}>
                      Forgot your password?
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginBottom: 28 }}>
                      No worries — we'll email you a reset link right away.
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
                      <div className="form-group">
                        <label className="form-label">Work Email *</label>
                        <input
                          className="form-input"
                          type="email"
                          name="email"
                          placeholder="jane@firm.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          autoComplete="email"
                        />
                      </div>

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
                            Send Reset Link
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"/>
                              <polyline points="12 5 19 12 12 19"/>
                            </svg>
                          </>
                        )}
                      </button>

                      <p style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                        Remembered it?{' '}
                        <Link to="/login" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
                      </p>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 20px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                      {['SOC 2 Ready', 'TLS Encrypted', 'Attorney-Grade'].map((badge, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
                          <span style={{
                            fontFamily: "'Inconsolata', monospace", fontSize: 10,
                            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink3)',
                          }}>
                            {badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              </div>

              {/* Info Side */}
              <div>
                <div className="eyebrow">Account Security</div>
                <h2 className="serif" style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: 18 }}>
                  Your Data is Always <em>Protected</em>
                </h2>
                <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 36 }}>
                  Password resets are handled with the same level of security we apply to your patent data — encrypted, time-limited, and attorney-grade.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { num: '01', title: 'Secure Reset Link', desc: 'We generate a unique, one-time link that expires in 30 minutes and can only be used once.' },
                    { num: '02', title: 'TLS Encrypted Delivery', desc: 'Your reset email is sent over encrypted channels — no sensitive data is ever exposed in transit.' },
                    { num: '03', title: 'Instant Access Restoration', desc: "Once reset, you're taken straight back into your patent monitoring dashboard without any friction." },
                    { num: '04', title: 'No Data Impact', desc: 'Resetting your password never affects your portfolio data, findings, or monitoring settings.' },
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
                    "We treat access security the same way we treat patent claims — with precision and zero tolerance for exposure."
                  </p>
                  <p style={{
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.10em',
                    color: 'var(--ink3)', marginTop: 10,
                  }}>
                    — Patent Gap AI Security Team
                  </p>
                </div>

                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 12 }}>
                    Don&apos;t have an account yet?
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
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <Footer />
    </>
  )
}
