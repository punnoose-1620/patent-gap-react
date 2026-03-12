import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

export default function RequestDemoPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', role: '', portfolioSize: '', useCase: '', timeline: '', timezone: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = e => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <Navbar />
      <div className="page-layout">

        {/* Page Hero */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="eyebrow">Live Demonstration</div>
            <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(32px, 3.8vw, 50px)', fontWeight: 400, color: 'var(--deep)', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 20 }}>
              Request a <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Demo</em>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 1.5vw, 17px)', fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.8, maxWidth: 560 }}>
              See Patent Gap AI's continuous monitoring platform in action with a personalised walkthrough. We'll demonstrate claim-level analysis using patents from your own portfolio.
            </p>
            <div style={{ marginTop: 28, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['30-minute live session', 'Your own patents', 'No commitment required'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink2)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="page-form-section">
          <div className="page-form-wrap">
            <div className="form-grid">

              {/* Form Card */}
              <div className="form-card">
                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--acc-soft)', border: '1.5px solid var(--acc-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--acc-soft)', border: '1px solid var(--acc-border)', borderRadius: 4, padding: '6px 14px', marginBottom: 20 }}>
                      <div className="badge-dot" />
                      <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--accent)' }}>Request Received</span>
                    </div>
                    <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, color: 'var(--deep)', marginBottom: 12 }}>Demo Request Submitted</h3>
                    <p style={{ fontSize: 15, color: 'var(--ink2)', fontWeight: 300, lineHeight: 1.7, marginBottom: 8, maxWidth: 380, margin: '0 auto 24px' }}>
                      A member of our team will contact you within 1 business day to schedule your personalised demonstration.
                    </p>
                    <button className="btn-ghost" onClick={() => setSubmitted(false)} style={{ fontSize: 14 }}>Submit Another Request</button>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, color: 'var(--deep)', marginBottom: 6, fontWeight: 700 }}>Your Details</h3>
                    <p style={{ fontSize: 13.5, color: 'var(--ink3)', marginBottom: 28 }}>All fields marked with * are required.</p>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input className="form-input" name="firstName" placeholder="Jane" value={form.firstName} onChange={handle} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input className="form-input" name="lastName" placeholder="Doe" value={form.lastName} onChange={handle} required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Work Email *</label>
                      <input className="form-input" type="email" name="email" placeholder="jane@firm.com" value={form.email} onChange={handle} required />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company / Firm *</label>
                        <input className="form-input" name="company" placeholder="Hartwell & Reid LLP" value={form.company} onChange={handle} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Your Role *</label>
                        <select className="form-input" name="role" value={form.role} onChange={handle} required>
                          <option value="" disabled>Select role</option>
                          <option>Patent Attorney</option>
                          <option>IP Counsel</option>
                          <option>Portfolio Manager</option>
                          <option>Technology Executive</option>
                          <option>Licensing Professional</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Portfolio Size</label>
                        <select className="form-input" name="portfolioSize" value={form.portfolioSize} onChange={handle}>
                          <option value="" disabled>Select range</option>
                          <option>1–25 patents</option>
                          <option>26–100 patents</option>
                          <option>101–500 patents</option>
                          <option>500+ patents</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Preferred Timeline</label>
                        <select className="form-input" name="timeline" value={form.timeline} onChange={handle}>
                          <option value="" disabled>Select timeline</option>
                          <option>As soon as possible</option>
                          <option>Within 2 weeks</option>
                          <option>Within a month</option>
                          <option>Just exploring</option>
                        </select>
                      </div>
                    </div>

                    {/* Timezone — full width row */}
                    <div className="form-group">
                      <label className="form-label">Your Time Zone *</label>
                      <select className="form-input" name="timezone" value={form.timezone} onChange={handle} required>
                        <option value="" disabled>Select your time zone</option>
                        <optgroup label="Americas">
                          <option value="America/Los_Angeles">Pacific Time — US &amp; Canada (PT)</option>
                          <option value="America/Denver">Mountain Time — US &amp; Canada (MT)</option>
                          <option value="America/Chicago">Central Time — US &amp; Canada (CT)</option>
                          <option value="America/New_York">Eastern Time — US &amp; Canada (ET)</option>
                          <option value="America/Sao_Paulo">Brasília Time (BRT)</option>
                          <option value="America/Toronto">Toronto (ET)</option>
                          <option value="America/Vancouver">Vancouver (PT)</option>
                        </optgroup>
                        <optgroup label="Europe">
                          <option value="Europe/London">London (GMT/BST)</option>
                          <option value="Europe/Paris">Paris / Berlin / Amsterdam (CET)</option>
                          <option value="Europe/Stockholm">Stockholm (CET)</option>
                          <option value="Europe/Helsinki">Helsinki / Tallinn (EET)</option>
                          <option value="Europe/Moscow">Moscow (MSK)</option>
                        </optgroup>
                        <optgroup label="Asia / Pacific">
                          <option value="Asia/Dubai">Dubai (GST)</option>
                          <option value="Asia/Kolkata">India (IST)</option>
                          <option value="Asia/Singapore">Singapore / Kuala Lumpur (SGT)</option>
                          <option value="Asia/Tokyo">Tokyo / Osaka (JST)</option>
                          <option value="Asia/Seoul">Seoul (KST)</option>
                          <option value="Asia/Shanghai">Beijing / Shanghai (CST)</option>
                          <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                          <option value="Australia/Sydney">Sydney (AEST)</option>
                          <option value="Pacific/Auckland">Auckland (NZST)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Primary Use Case</label>
                      <textarea
                        className="form-input"
                        name="useCase"
                        placeholder="Describe your primary monitoring goals or enforcement use case (optional)..."
                        value={form.useCase}
                        onChange={handle}
                        style={{ minHeight: 90 }}
                      />
                    </div>

                    <button type="submit" className="btn-green" style={{ width: '100%', justifyContent: 'center' }}>
                      Request My Demo
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                    <p style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                      By submitting, you agree to our <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>. No commitment required.
                    </p>
                  </form>
                )}
              </div>

              {/* Info Side */}
              <div>
                <div className="eyebrow">What to Expect</div>
                <h2 className="serif" style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: 18 }}>A Personalised <em>Walkthrough</em></h2>
                <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 36 }}>
                  Your demo is tailored to your specific patent portfolio and enforcement context. We don't do generic product tours.
                </p>

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { num: '01', title: 'Share Your Context', desc: 'Tell us about your portfolio and primary monitoring goals in the form above.' },
                    { num: '02', title: 'We Prepare Your Demo', desc: 'Our team reviews your context and prepares a session using real or representative patents.' },
                    { num: '03', title: 'Live 30-Minute Session', desc: 'See claim-level analysis, monitoring outputs, and findings in a live walkthrough.' },
                    { num: '04', title: 'Q&A and Next Steps', desc: 'We answer your questions and discuss fit for your practice or portfolio.' },
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

                <div style={{ marginTop: 36, background: 'var(--surf)', border: '1px solid var(--rule)', borderLeft: '3px solid var(--accent)', borderRadius: '0 8px 8px 0', padding: '18px 20px' }}>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 15, fontStyle: 'italic', color: 'var(--deep)', lineHeight: 1.65 }}>
                    "We were running demos using real prosecution histories within the first session. The platform genuinely impressed our team."
                  </p>
                  <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--ink3)', marginTop: 10 }}>
                    — Beta Partner, IP Litigation Firm
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
