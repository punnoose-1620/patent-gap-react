import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' })
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
            <div className="eyebrow">Get in Touch</div>
            <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(32px, 3.8vw, 50px)', fontWeight: 400, color: 'var(--deep)', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 20 }}>
              Contact <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Us</em>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 1.5vw, 17px)', fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.8, maxWidth: 520 }}>
              Whether you have questions about our platform, want to explore a partnership, or need more information about how Patent Gap AI can support your IP practice — we'd love to hear from you.
            </p>
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
                    <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, color: 'var(--deep)', marginBottom: 12 }}>Message Sent</h3>
                    <p style={{ fontSize: 15, color: 'var(--ink2)', fontWeight: 300, lineHeight: 1.7, marginBottom: 28 }}>Thank you for reaching out. We'll be in touch within 1–2 business days.</p>
                    <button className="btn-green" onClick={() => setSubmitted(false)} style={{ fontSize: 14, padding: '10px 22px' }}>Send Another Message</button>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, color: 'var(--deep)', marginBottom: 28, fontWeight: 700 }}>Send a Message</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input className="form-input" name="name" placeholder="Jane" value={form.name} onChange={handle} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Work Email</label>
                        <input className="form-input" type="email" name="email" placeholder="jane@firm.com" value={form.email} onChange={handle} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company / Firm</label>
                      <input className="form-input" name="company" placeholder="Hartwell & Reid LLP" value={form.company} onChange={handle} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <select className="form-input" name="subject" value={form.subject} onChange={handle} required>
                        <option value="" disabled>Select a topic</option>
                        <option value="demo">Request a Demo</option>
                        <option value="partnership">Partnership Inquiry</option>
                        <option value="pricing">Pricing & Plans</option>
                        <option value="technical">Technical Question</option>
                        <option value="press">Press / Media</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <textarea className="form-input" name="message" placeholder="Tell us about your patent portfolio and monitoring needs..." value={form.message} onChange={handle} required />
                    </div>
                    <button type="submit" className="btn-green" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                      Send Message
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </form>
                )}
              </div>

              {/* Info Side */}
              <div>
                <div className="eyebrow">Contact Details</div>
                <h2 className="serif" style={{ fontSize: 'clamp(22px, 2.5vw, 34px)', marginBottom: 18 }}>We're Here to <em>Help</em></h2>
                <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.8, marginBottom: 36 }}>
                  Our team includes patent attorneys, IP professionals, and engineers. We understand the nuance of your work.
                </p>
                <div className="info-list">
                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Email</h4>
                      <p>contact@patentgap.ai — we respond within 1–2 business days.</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Offices</h4>
                      <p>San Francisco, CA · Stockholm, Sweden. Available globally for remote engagements.</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Request a Demo</h4>
                      <p>Want to see the platform in action? <Link to="/request-demo" style={{ color: 'var(--accent)', fontWeight: 500 }}>Schedule a live demo</Link> with our team.</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Response Time</h4>
                      <p>We aim to respond to all inquiries within 1–2 business days. Urgent matters are typically addressed same-day.</p>
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="info-item">
                    <div className="info-icon">
                      {/* LinkedIn logo mark */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                        <rect x="2" y="9" width="4" height="12"/>
                        <circle cx="4" cy="4" r="2"/>
                      </svg>
                    </div>
                    <div>
                      <h4>LinkedIn</h4>
                      <p>
                        Follow us for updates, insights, and IP industry news.{' '}
                        <a
                          href="https://www.linkedin.com/company/patent-gap-ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', fontWeight: 500 }}
                        >
                          Patent Gap AI on LinkedIn
                        </a>
                      </p>
                    </div>
                  </div>

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
