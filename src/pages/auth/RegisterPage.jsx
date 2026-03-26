import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { Eye, EyeOff, Upload, User, X } from 'lucide-react'

// ─── Silent background collector (never shown to user) ───────────────────────
const collectSilentFields = async () => {
  const silent = {}

  silent.timezone      = Intl.DateTimeFormat().resolvedOptions().timeZone
  silent.locale        = navigator.language || navigator.userLanguage || null
  silent.platform      = navigator.platform || null
  silent.registered_at = new Date().toISOString()

  try {
    const res  = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) })
    const json = await res.json()
    silent.ip_address = json.ip
  } catch {
    silent.ip_address = null
  }

  console.log('🌐 Silent fields collected:', silent)
  return silent
}

// ─── Photo → base64 ──────────────────────────────────────────────────────────
const toBase64 = file =>
  new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload  = () => res(reader.result)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })

// ─── Password strength ────────────────────────────────────────────────────────
const passwordStrength = pwd => {
  if (!pwd) return { score: 0, label: '', color: 'transparent' }
  let score = 0
  if (pwd.length >= 8)           score++
  if (pwd.length >= 12)          score++
  if (/[A-Z]/.test(pwd))         score++
  if (/[0-9]/.test(pwd))         score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const map = [
    { label: 'Very weak', color: '#dc2626' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Good',      color: '#84cc16' },
    { label: 'Strong',    color: 'var(--accent)' },
  ]
  return { score, ...map[Math.min(score, 4)] }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate     = useNavigate()
  const { register } = useAuth()
  const { auth }     = useStore()
  const photoRef     = useRef()

  // ── Form state: only user-facing fields ──────────────────────────────────
  // locale, platform, ip_address are NOT here — collected silently at submit
  const [form, setForm] = useState({
    title:            '',   // Mr / Ms / Mx / Dr / Prof  — required
    full_name:        '',   // required
    email:            '',   // required
    password:         '',   // required
    confirm_password: '',
    phone:            '',   // optional
    company:          '',   // optional
    job_title:        '',   // required
    address_line1:    '',   // optional
    address_line2:    '',   // optional
    city:             '',   // optional
    state:            '',   // optional
    postal_code:      '',   // optional
    country:          '',   // optional
  })

  const [photoPreview, setPhotoPreview]     = useState(null)
  const [photoFile, setPhotoFile]           = useState(null)
  const [showPassword, setShowPassword]     = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [error, setError]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Creating account...')
  const [step, setStep]                     = useState(1)   // 1=Identity 2=Security 3=Address
  const [agreedToTerms, setAgreedToTerms]   = useState(false)

  const strength = passwordStrength(form.password)

  useEffect(() => {
    if (auth.isAuthenticated) navigate('/dashboard')
  }, [auth.isAuthenticated])

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handlePhoto = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setPhotoFile(file)
    setPhotoPreview(await toBase64(file))
    setError('')
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  // ── Per-step validation ───────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 1) {
      if (!form.title)            { setError('Please select a title.');        return false }
      if (!form.full_name.trim()) { setError('Full name is required.');        return false }
      if (!form.email.trim())     { setError('Email is required.');            return false }
      if (!form.job_title.trim()) { setError('Job title is required.');        return false }
    }
    if (step === 2) {
      if (!form.password)                          { setError('Password is required.');             return false }
      if (strength.score < 2)                      { setError('Please choose a stronger password.'); return false }
      if (form.password !== form.confirm_password) { setError('Passwords do not match.');           return false }
    }
    if (step === 3) {
      if (!agreedToTerms) { setError('Please accept the terms to continue.'); return false }
    }
    setError('')
    return true
  }

  const nextStep = () => { if (validateStep()) setStep(s => s + 1) }
  const prevStep = () => { setError(''); setStep(s => s - 1) }

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async e => {
    e.preventDefault()
    if (!validateStep()) return

    setLoading(true)
    setLoadingMessage('Collecting profile data…')

    const wakeTimer = setTimeout(() => setLoadingMessage('Waking up server, please wait…'), 5000)

    try {
      // Silent fields collected in background — user never sees or touches these
      const silent = await collectSilentFields()
      setLoadingMessage('Creating your account…')

      let profile_picture = null
      if (photoFile) profile_picture = await toBase64(photoFile)

      const payload = {
        // ── User-typed fields ────────────────────────────────────────────
        title:           form.title,
        full_name:       form.full_name,
        email:           form.email,
        password:        form.password,
        phone:           form.phone    || null,
        company:         form.company  || null,
        job_title:       form.job_title,
        profile_picture,
        address: {
          line1:       form.address_line1 || null,
          line2:       form.address_line2 || null,
          city:        form.city          || null,
          state:       form.state         || null,
          postal_code: form.postal_code   || null,
          country:     form.country       || null,
        },

        // ── Silent background fields (auto-collected, never in form state) ─
        timezone:      silent.timezone,
        locale:        silent.locale,       // ← background only
        platform:      silent.platform,     // ← background only
        ip_address:    silent.ip_address,   // ← background only
        registered_at: silent.registered_at,
      }

      console.log('📋 Full registration payload:', payload)
      console.log('📸 Photo file:', photoFile)
      console.log('🌐 Silent fields:', silent)

      const result = await register(
        payload.full_name,
        payload.email,
        payload.password,
        payload.company,
        payload,          // full payload → authApi.register
      )

      clearTimeout(wakeTimer)

      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      clearTimeout(wakeTimer)
      setLoading(false)
    }
  }

  const steps = ['Identity', 'Security', 'Address']

  const optionalBadge = (
    <span style={{
      fontFamily: "'Inconsolata', monospace", fontSize: 10,
      color: 'var(--ink3)', marginLeft: 6, letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>optional</span>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="page-layout">

        {/* ── Page Hero ─────────────────────────────────────────────────── */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="eyebrow">Create Your Account</div>
            <h1 style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 'clamp(22px, 5vw, 50px)',
              fontWeight: 400, color: 'var(--deep)',
              lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 20,
            }}>
              Join{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Patent Gap AI</em>
            </h1>
            <p style={{
              fontSize: 'clamp(15px, 1.5vw, 17px)', fontWeight: 300,
              color: 'var(--ink2)', lineHeight: 1.8, maxWidth: 520,
            }}>
              Set up your account and start monitoring your patent portfolio for infringement signals in minutes.
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

        {/* ── Form Section ──────────────────────────────────────────────── */}
        <div className="page-form-section">
          <div className="page-form-wrap">
            <div className="form-grid">

              {/* ── Registration Card ──────────────────────────────────── */}
              <div className="form-card">

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
                  {steps.map((label, i) => {
                    const idx    = i + 1
                    const done   = idx < step
                    const active = idx === step
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center',
                        flex: i < steps.length - 1 ? 1 : 'none',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: done ? 'var(--accent)' : active ? 'var(--deep)' : 'transparent',
                            border: `2px solid ${done ? 'var(--accent)' : active ? 'var(--deep)' : 'var(--rule)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}>
                            {done ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <span style={{
                                fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 700,
                                color: active ? 'white' : 'var(--ink3)',
                              }}>{idx}</span>
                            )}
                          </div>
                          <span style={{
                            fontFamily: "'Inconsolata', monospace", fontSize: 10,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            color: active ? 'var(--deep)' : done ? 'var(--accent)' : 'var(--ink3)',
                          }}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div style={{
                            flex: 1, height: 2, margin: '0 8px', marginBottom: 20,
                            background: done ? 'var(--accent)' : 'var(--rule)',
                            transition: 'background 0.3s',
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Step heading */}
                <h3 style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 20, color: 'var(--deep)', marginBottom: 6, fontWeight: 700,
                }}>
                  {step === 1 && 'Your Identity'}
                  {step === 2 && 'Secure Your Account'}
                  {step === 3 && 'Your Address'}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginBottom: 28 }}>
                  {step === 1 && 'Name, role, contact details, and a profile photo.'}
                  {step === 2 && 'Choose a strong password to protect your account.'}
                  {step === 3 && 'Your address (optional) and terms of service.'}
                </p>

                {/* Error banner */}
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
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span style={{ fontSize: 13.5, color: 'var(--red)', lineHeight: 1.5 }}>{error}</span>
                  </div>
                )}

                <form onSubmit={submit}>

                  {/* ════════════════ STEP 1 — Identity ════════════════ */}
                  {step === 1 && (
                    <>
                      {/* Profile picture */}
                      <div className="form-group">
                        <label className="form-label">Profile Picture {optionalBadge}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div
                            onClick={() => photoRef.current?.click()}
                            style={{
                              width: 72, height: 72, borderRadius: '50%',
                              border: '2px dashed var(--rule)', background: 'var(--surf)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                              transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--rule)'}
                          >
                            {photoPreview
                              ? <img src={photoPreview} alt="Preview"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <User size={28} color="var(--ink3)" />
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button type="button" onClick={() => photoRef.current?.click()}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  padding: '7px 14px', fontSize: 12, borderRadius: 6,
                                  border: '1px solid var(--rule)', background: 'var(--surf)',
                                  color: 'var(--deep)', cursor: 'pointer',
                                  fontFamily: "'Inconsolata', monospace",
                                  textTransform: 'uppercase', letterSpacing: '0.07em',
                                }}>
                                <Upload size={12} />
                                {photoPreview ? 'Change' : 'Upload'}
                              </button>
                              {photoPreview && (
                                <button type="button" onClick={removePhoto}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '7px 12px', fontSize: 12, borderRadius: 6,
                                    border: '1px solid rgba(185,28,28,0.2)',
                                    background: 'rgba(185,28,28,0.05)',
                                    color: 'var(--red)', cursor: 'pointer',
                                    fontFamily: "'Inconsolata', monospace",
                                    textTransform: 'uppercase', letterSpacing: '0.07em',
                                  }}>
                                  <X size={12} /> Remove
                                </button>
                              )}
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 6, lineHeight: 1.5 }}>
                              JPG or PNG, max 5 MB.
                            </p>
                          </div>
                        </div>
                        <input ref={photoRef} type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhoto} style={{ display: 'none' }} />
                      </div>

                      {/* Title + Full name — inline */}
                      <div className="form-group">
                        <label className="form-label">Title & Full Name *</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            className="form-input"
                            name="title"
                            value={form.title}
                            onChange={handle}
                            required
                            style={{ width: 90, flexShrink: 0, appearance: 'none', cursor: 'pointer' }}
                          >
                            <option value="">—</option>
                            <option value="Mr">Mr</option>
                            <option value="Ms">Ms</option>
                            <option value="Mx">Mx</option>
                            <option value="Dr">Dr</option>
                            <option value="Prof">Prof</option>
                          </select>
                          <input
                            className="form-input"
                            type="text"
                            name="full_name"
                            placeholder="Jane Smith"
                            value={form.full_name}
                            onChange={handle}
                            required
                            autoComplete="name"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="form-group">
                        <label className="form-label">Work Email *</label>
                        <input className="form-input" type="email" name="email"
                          placeholder="jane@firm.com"
                          value={form.email} onChange={handle}
                          required autoComplete="email" />
                      </div>

                      {/* Job title */}
                      <div className="form-group">
                        <label className="form-label">Job Title *</label>
                        <input className="form-input" type="text" name="job_title"
                          placeholder="Patent Counsel"
                          value={form.job_title} onChange={handle}
                          required />
                      </div>

                      {/* Company (optional) */}
                      <div className="form-group">
                        <label className="form-label">Company / Firm {optionalBadge}</label>
                        <input className="form-input" type="text" name="company"
                          placeholder="Acme IP Law LLP"
                          value={form.company} onChange={handle}
                          autoComplete="organization" />
                      </div>

                      {/* Phone (optional) */}
                      <div className="form-group">
                        <label className="form-label">Phone {optionalBadge}</label>
                        <input className="form-input" type="tel" name="phone"
                          placeholder="+1 (555) 000-0000"
                          value={form.phone} onChange={handle}
                          autoComplete="tel" />
                      </div>
                    </>
                  )}

                  {/* ════════════════ STEP 2 — Security ════════════════ */}
                  {step === 2 && (
                    <>
                      {/* Password */}
                      <div className="form-group">
                        <label className="form-label">Password *</label>
                        <div style={{ position: 'relative' }}>
                          <input className="form-input"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="••••••••"
                            value={form.password} onChange={handle}
                            required autoComplete="new-password"
                            style={{ paddingRight: 40 }} />
                          <button type="button"
                            onClick={() => setShowPassword(v => !v)}
                            style={{
                              position: 'absolute', right: 12, top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none', border: 'none',
                              cursor: 'pointer', padding: 0,
                              display: 'flex', alignItems: 'center', color: 'var(--ink3)',
                            }}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {/* Strength bar */}
                        {form.password && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                              {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{
                                  flex: 1, height: 3, borderRadius: 2,
                                  background: i <= strength.score ? strength.color : 'var(--rule)',
                                  transition: 'background 0.3s',
                                }} />
                              ))}
                            </div>
                            <span style={{
                              fontFamily: "'Inconsolata', monospace", fontSize: 10,
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                              color: strength.color,
                            }}>{strength.label}</span>
                          </div>
                        )}
                        <p style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 6 }}>
                          Min. 8 characters. Use uppercase, numbers, and symbols for strength.
                        </p>
                      </div>

                      {/* Confirm password */}
                      <div className="form-group">
                        <label className="form-label">Confirm Password *</label>
                        <div style={{ position: 'relative' }}>
                          <input className="form-input"
                            type={showConfirm ? 'text' : 'password'}
                            name="confirm_password"
                            placeholder="••••••••"
                            value={form.confirm_password} onChange={handle}
                            required autoComplete="new-password"
                            style={{ paddingRight: 40 }} />
                          <button type="button"
                            onClick={() => setShowConfirm(v => !v)}
                            style={{
                              position: 'absolute', right: 12, top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none', border: 'none',
                              cursor: 'pointer', padding: 0,
                              display: 'flex', alignItems: 'center', color: 'var(--ink3)',
                            }}>
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {/* Match indicator */}
                        {form.confirm_password && (
                          <p style={{
                            fontSize: 11.5, marginTop: 6,
                            color: form.password === form.confirm_password ? 'var(--accent)' : 'var(--red)',
                            fontFamily: "'Inconsolata', monospace",
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                          }}>
                            {form.password === form.confirm_password
                              ? '✓ Passwords match'
                              : '✗ Passwords do not match'}
                          </p>
                        )}
                      </div>

                      {/* Silent collection notice */}
                      <div style={{
                        background: 'var(--surf)',
                        border: '1px solid var(--rule)',
                        borderLeft: '3px solid var(--accent)',
                        borderRadius: '0 8px 8px 0',
                        padding: '12px 14px', marginTop: 4,
                      }}>
                        <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.65, margin: 0 }}>
                          Upon registration, your timezone, locale, platform, and IP address are
                          collected automatically to help secure your account and personalise your experience.
                        </p>
                      </div>
                    </>
                  )}

                  {/* ════════════════ STEP 3 — Address ════════════════ */}
                  {step === 3 && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Address Line 1 {optionalBadge}</label>
                        <input className="form-input" type="text" name="address_line1"
                          placeholder="123 Main Street"
                          value={form.address_line1} onChange={handle}
                          autoComplete="address-line1" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Address Line 2 {optionalBadge}</label>
                        <input className="form-input" type="text" name="address_line2"
                          placeholder="Suite 400"
                          value={form.address_line2} onChange={handle}
                          autoComplete="address-line2" />
                      </div>

                      {/* City + State */}
                      <div className="form-group">
                        <label className="form-label">City & State / Region {optionalBadge}</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="form-input" type="text" name="city"
                            placeholder="New York"
                            value={form.city} onChange={handle}
                            autoComplete="address-level2"
                            style={{ flex: 1 }} />
                          <input className="form-input" type="text" name="state"
                            placeholder="NY"
                            value={form.state} onChange={handle}
                            autoComplete="address-level1"
                            style={{ width: 80, flexShrink: 0 }} />
                        </div>
                      </div>

                      {/* Postal code + Country */}
                      <div className="form-group">
                        <label className="form-label">Postal Code & Country {optionalBadge}</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="form-input" type="text" name="postal_code"
                            placeholder="10001"
                            value={form.postal_code} onChange={handle}
                            autoComplete="postal-code"
                            style={{ width: 110, flexShrink: 0 }} />
                          <input className="form-input" type="text" name="country"
                            placeholder="United States"
                            value={form.country} onChange={handle}
                            autoComplete="country-name"
                            style={{ flex: 1 }} />
                        </div>
                      </div>

                      {/* Terms */}
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        marginTop: 8, marginBottom: 24,
                      }}>
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreedToTerms}
                          onChange={e => setAgreedToTerms(e.target.checked)}
                          style={{
                            marginTop: 2, flexShrink: 0,
                            accentColor: 'var(--accent)', cursor: 'pointer',
                          }}
                        />
                        <label htmlFor="terms" style={{
                          fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6, cursor: 'pointer',
                        }}>
                          I agree to the{' '}
                          <a href="/terms" style={{ color: 'var(--accent)' }}>Terms of Service</a>
                          {' '}and{' '}
                          <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
                          I understand that certain device and network data is collected automatically
                          to secure and personalise my account.
                        </label>
                      </div>
                    </>
                  )}

                  {/* ── Navigation buttons ──────────────────────────────── */}
                  <div style={{ display: 'flex', gap: 10, marginTop: step === 3 ? 0 : 8 }}>
                    {step > 1 && (
                      <button type="button" onClick={prevStep}
                        disabled={loading}
                        className="btn-ghost"
                        style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.5 : 1 }}>
                        ← Back
                      </button>
                    )}

                    {step < 3 ? (
                      <button type="button" onClick={nextStep}
                        className="btn-green"
                        style={{ flex: 1, justifyContent: 'center' }}>
                        Continue
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    ) : (
                      <button type="submit"
                        className="btn-green"
                        disabled={loading}
                        style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                        {loading ? (
                          <>
                            {loadingMessage}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                              style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          </>
                        ) : (
                          <>
                            Create Account
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
                  </p>

                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 20px' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                  <span style={{
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)',
                  }}>Secure Access</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                </div>

                {/* Trust badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                  {['SOC 2 Ready', 'TLS Encrypted', 'Attorney-Grade'].map((badge, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'var(--accent)', opacity: 0.6,
                      }} />
                      <span style={{
                        fontFamily: "'Inconsolata', monospace", fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink3)',
                      }}>{badge}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* ── Info Side ──────────────────────────────────────────────── */}
              <div>
                <div className="eyebrow">Why Patent Gap AI</div>
                <h2 className="serif" style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: 18 }}>
                  Built for IP Teams That Move at the <em>Speed of Infringement</em>
                </h2>
                <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 36 }}>
                  From day one, your account gives you continuous monitoring, claim-level analysis,
                  and structured findings ready for legal review.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { num: '01', title: 'Instant Portfolio Setup',  desc: 'Add patents by number and we begin monitoring for infringement signals immediately.' },
                    { num: '02', title: 'Claim-Level Analysis',     desc: 'Drill into individual claims to see exactly where potential infringement is occurring.' },
                    { num: '03', title: 'Structured Findings',      desc: 'Attorney-ready reports with source citations, evidence chains, and export options.' },
                    { num: '04', title: 'Continuous Alerts',        desc: 'Get notified when new infringement signals are detected across your monitored portfolio.' },
                  ].map((item, i) => (
                    <div key={i} className="att-item" style={{ paddingLeft: 0 }}>
                      <span className="att-num">{item.num}</span>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--deep)', marginBottom: 4 }}>{item.title}</h4>
                        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.65 }}>{item.desc}</p>
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
                    "Patent Gap AI gives us a live view of our entire portfolio's exposure.
                    It's become an essential part of our enforcement workflow."
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
                    Already have an account?
                  </p>
                  <Link to="/login" className="btn-ghost"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Sign In
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
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
