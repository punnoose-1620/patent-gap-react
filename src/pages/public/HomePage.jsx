import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import HeroSection from '../../components/layout/HeroSection'
import Footer from '../../components/layout/Footer'

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

export default function HomePage() {
  useReveal()

  return (
    <>
      <Navbar />
      <HeroSection />

      {/* ── OPPORTUNITY ── */}
      <section className="opportunity" id="opportunity">
        <div className="section-wrap">
          <div className="two-col">
            <div className="reveal">
              <div className="eyebrow">The Problem</div>
              <h2 className="serif">The Opportunity in Patent <em>Monitoring</em></h2>
              <div className="opp-text" style={{ marginTop: 26 }}>
                <p>Large patent portfolios are rarely monitored continuously. The process of identifying potential infringement remains largely manual, time-consuming, and expensive.</p>
                <p>As a result, many patent holders discover infringement only after significant commercial damage has already occurred.</p>
                <p>Continuous monitoring creates the opportunity to identify potential infringement earlier and support licensing or enforcement strategies with structured evidence.</p>
              </div>
            </div>
            <div className="opp-cards reveal d1">
              <div className="opp-card">
                <span className="opp-card-val">Manual</span>
                <span className="opp-card-desc">The infringement identification process remains largely manual — skilled attorney hours spent on work that scales poorly across large portfolios.</span>
              </div>
              <div className="opp-card">
                <span className="opp-card-val">Delayed</span>
                <span className="opp-card-desc">Many patent holders discover infringement only after significant commercial damage has occurred — often years too late to act effectively.</span>
              </div>
              <div className="opp-card">
                <span className="opp-card-val">Earlier</span>
                <span className="opp-card-desc">Continuous monitoring enables earlier detection, supporting licensing and enforcement strategies with structured, documented evidence.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how" id="how-it-works">
        <div className="section-wrap">
          <div className="how-header reveal">
            <div className="eyebrow">Process</div>
            <h2 className="serif">How Patent Gap AI <em>Works</em></h2>
            <p>A structured four-step process that takes patent claims from analysis through to attorney-reviewed findings — continuously and at scale.</p>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step-num">01</div>
              <div className="step-title">Patent Claims Are Analyzed</div>
              <p className="step-body">Our platform analyzes patents at the claim level to understand their technical scope and establish a precise monitoring baseline.</p>
            </div>
            <div className="step reveal d1">
              <div className="step-num">02</div>
              <div className="step-title">Technologies Are Continuously Monitored</div>
              <p className="step-body">Public data sources and technology signals are scanned continuously to detect potential overlaps with existing patent claims.</p>
            </div>
            <div className="step reveal d2">
              <div className="step-num">03</div>
              <div className="step-title">Potential Infringements Are Identified</div>
              <p className="step-body">AI highlights technologies that may intersect with existing patent claims, surfacing relevant signals for professional review.</p>
            </div>
            <div className="step reveal d3">
              <div className="step-num">04</div>
              <div className="step-title">Attorneys Review Structured Findings</div>
              <p className="step-body">Legal professionals validate and assess the AI-generated evidence before any enforcement decision is made.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ATTORNEYS ── */}
      <section className="attorneys" id="attorneys">
        <div className="section-wrap">
          <div className="two-col">
            <div className="reveal">
              <div className="eyebrow">Collaboration</div>
              <h2 className="serif">Built with Patent <em>Attorneys</em></h2>
              <div className="att-text" style={{ marginTop: 26 }}>
                <p>Patent Gap AI has been developed in collaboration with experienced patent lawyers to ensure the platform reflects real-world legal workflows.</p>
                <p>The system is designed to support attorneys in identifying potential infringement scenarios and structuring relevant technical evidence.</p>
                <p>By combining human legal expertise with AI-assisted analysis, the platform enables a more systematic approach to patent monitoring.</p>
              </div>
              <div className="att-callout">"The platform is designed as a tool for attorneys — not a replacement. Every finding goes through legal review before any enforcement action."</div>
            </div>
            <div className="att-items reveal d1">
              <div className="att-item">
                <span className="att-num">01</span>
                <div>
                  <h4>Designed for Legal Workflows</h4>
                  <p>Built from the ground up to fit how patent attorneys actually work — not a generic AI tool retrofitted for legal use.</p>
                </div>
              </div>
              <div className="att-item">
                <span className="att-num">02</span>
                <div>
                  <h4>Human Review at Every Stage</h4>
                  <p>AI surfaces and structures evidence. Attorneys validate, interpret, and decide. The human remains in the loop throughout.</p>
                </div>
              </div>
              <div className="att-item">
                <span className="att-num">03</span>
                <div>
                  <h4>Evidence That Holds Up</h4>
                  <p>Findings are documented with source citations and structured in formats that support real enforcement and licensing workflows.</p>
                </div>
              </div>
              <div className="att-item">
                <span className="att-num">04</span>
                <div>
                  <h4>Iterative Development</h4>
                  <p>Continuously refined based on practitioner feedback from active monitoring and enforcement engagements.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI INFRASTRUCTURE ── */}
      <section className="ai-infra" id="ai-infra">
        <div className="section-wrap">
          <div className="ai-header two-col" style={{ marginBottom: 60 }}>
            <div className="reveal">
              <div className="eyebrow">Technology</div>
              <h2 className="serif">AI Infrastructure for Patent <em>Intelligence</em></h2>
            </div>
            <div className="ai-desc reveal d1">
              <p>Recent advances in large language models have made it possible to interpret complex patent claim language with significantly greater precision.</p>
              <p>Patent Gap AI combines these advances with structured patent data and domain-specific workflows to support continuous patent monitoring.</p>
              <p>The platform focuses on assisting professionals with identifying relevant signals, organizing evidence, and improving visibility into potential infringement risks.</p>
            </div>
          </div>
          <div className="ai-pillars">
            <div className="ai-pillar reveal">
              <div className="ap-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(250,250,247,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div className="ap-title">Large Language Models</div>
              <p className="ap-body">State-of-the-art LLMs interpret complex patent claim language with precision previously achievable only through expert human analysis.</p>
            </div>
            <div className="ai-pillar reveal d1">
              <div className="ap-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(250,250,247,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <div className="ap-title">Structured Patent Data</div>
              <p className="ap-body">Domain-specific data pipelines process public patent databases and technology disclosures to surface relevant monitoring signals.</p>
            </div>
            <div className="ai-pillar reveal d2">
              <div className="ap-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(250,250,247,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </div>
              <div className="ap-title">Continuous Monitoring</div>
              <p className="ap-body">Automated pipelines scan public technology signals on an ongoing basis, so patent holders don't need to wait for periodic manual reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS ── */}
      <section className="early-access" id="early-access">
        <div className="section-wrap">
          <div className="two-col">
            <div className="reveal">
              <div className="eyebrow">Development Status</div>
              <h2 className="serif">Early <em>Access</em></h2>
              <div className="ea-text" style={{ marginTop: 26 }}>
                <p>Patent Gap AI is currently being developed in collaboration with patent professionals and technology experts.</p>
                <p>The platform is in active beta development with selected partners and continues to evolve based on real-world legal workflows and feedback.</p>
              </div>
              <div className="ea-live">
                <div className="badge-dot" />
                <span>Active Beta · Selected Partners</span>
              </div>
            </div>
            <div className="ea-cards reveal d1">
              <div className="ea-card">
                <div>
                  <strong>Active Development</strong>
                  <span>The platform is being actively built and refined with direct input from practicing patent attorneys and enforcement professionals.</span>
                </div>
              </div>
              <div className="ea-card">
                <div>
                  <strong>Selected Partner Program</strong>
                  <span>We are working with a small group of IP firms and patent holders to test and validate the platform in real enforcement contexts.</span>
                </div>
              </div>
              <div className="ea-card">
                <div>
                  <strong>Feedback-Driven Roadmap</strong>
                  <span>Features and workflows are shaped by real practitioner feedback to ensure the platform solves actual problems in IP enforcement.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials" id="testimonials">
        <div className="section-wrap">
          <div className="test-header reveal">
            <div className="eyebrow">What Practitioners Say</div>
            <h2 className="serif">Trusted by <em>IP Professionals</em></h2>
          </div>
          <div className="test-grid">
            {[
              {
                initials: 'MR', name: 'Marcus Reid', role: 'Partner, IP Litigation · Hartwell & Reid LLP',
                quote: 'Patent Gap AI fundamentally changed how we approach portfolio monitoring. What used to take weeks of manual review now surfaces as structured findings in hours. Our team can focus on analysis rather than searching.',
              },
              {
                initials: 'SL', name: 'Sophia Lindqvist', role: 'Chief IP Counsel · Volaris Technologies',
                quote: "The claim-level analysis is exceptional. It doesn't just flag patents — it maps each claim element to potential infringers with evidence we can actually use in licensing conversations. The depth is unlike anything else we've seen.",
              },
              {
                initials: 'DJ', name: 'Daniel J. Okafor', role: 'Principal Patent Attorney · Okafor IP Group',
                quote: "As a boutique IP firm, continuous monitoring was previously out of reach. Patent Gap AI gives us enterprise-grade intelligence without enterprise-grade overhead. It's levelled the playing field for our clients significantly.",
              },
            ].map((t, i) => (
              <div key={i} className={`test-card reveal${i === 1 ? ' d1' : i === 2 ? ' d2' : ''}`}>
                <div className="test-stars">
                  {[...Array(5)].map((_, j) => <span key={j}>★</span>)}
                </div>
                <p className="test-quote">{t.quote}</p>
                <div className="test-person">
                  <div className="test-avatar">{t.initials}</div>
                  <div>
                    <div className="test-name">{t.name}</div>
                    <div className="test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" id="cta">
        <div className="cta-inner">
          <span className="cta-lbl">Get Started</span>
          <h2 className="cta-h">Stop Losing Revenue on Patents <em>You Already Own</em></h2>
          <div className="cta-btns">
            <Link to="/request-demo" className="btn-cta-white">Request Early Access</Link>
            <Link to="/contact" className="btn-cta-outline">Contact Us</Link>
          </div>
          <p className="cta-sub">Structured patent monitoring for serious enforcement teams.</p>
        </div>
      </section>

      <Footer />
    </>
  )
}
