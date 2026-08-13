import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import HeroSection from '../../components/layout/HeroSection'
import Footer from '../../components/layout/Footer'
import TestimonialsCarousel from './TestimonialsCarousel'

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
                <p>Most patent portfolios go unmonitored between filing and litigation. Identifying infringement stays manual, slow, and expensive — consuming attorney hours that should go toward enforcement, not research.</p>
                <p>By the time most patent holders discover infringement, the commercial damage is already done. Revenue has been lost. Leverage has been reduced.</p>
                <p>Catching infringement earlier changes the outcome. It creates licensing opportunities, strengthens enforcement positions, and gives attorneys the evidence they need before the window closes.</p>
              </div>
            </div>
            <div className="opp-cards reveal d1">
              <div className="opp-card">
                <span className="opp-card-val">Still Manual</span>
                <span className="opp-card-desc">The infringement identification process remains largely manual — skilled attorney hours spent on work that scales poorly across large portfolios.</span>
              </div>
              <div className="opp-card">
                <span className="opp-card-val">Too Late</span>
                <span className="opp-card-desc">Many patent holders discover infringement only after significant commercial damage has occurred — often years too late to act effectively.</span>
              </div>
              <div className="opp-card">
                <span className="opp-card-val">Act Earlier</span>
                <span className="opp-card-desc">Continuous monitoring enables earlier detection, supporting licensing and enforcement strategies with structured, documented evidence.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how" id="how-it-works">
        <div className="section-wrap">
          <div className="how-inner">

            {/* LEFT: heading + vertical steps */}
            <div className="how-left">
              <div className="how-header reveal">
                <div className="eyebrow">Process</div>
                <h2 className="serif">How Patent Gap AI <em>Works</em></h2>
                <p>A structured four-step process that takes patent claims from ingestion through to attorney-reviewed findings — continuously and at scale.</p>
              </div>
              <div className="steps-v">
                <div className="step-v reveal">
                  <div className="step-v-num">01</div>
                  <div>
                    <div className="step-v-title">Patent Claims Are Analyzed</div>
                    <p className="step-v-body">Our platform ingests patent documents and parses every claim at element level, establishing a precise technical scope baseline for monitoring.</p>
                  </div>
                </div>
                <div className="step-v reveal d1">
                  <div className="step-v-num">02</div>
                  <div>
                    <div className="step-v-title">Technologies Are Continuously Monitored</div>
                    <p className="step-v-body">Public data sources, product filings, and technology signals are scanned continuously to detect potential overlaps with existing patent claims.</p>
                  </div>
                </div>
                <div className="step-v reveal d2">
                  <div className="step-v-num">03</div>
                  <div>
                    <div className="step-v-title">Potential Infringements Are Identified</div>
                    <p className="step-v-body">AI highlights technologies that may intersect with existing patent claims, scoring each match and surfacing structured evidence for professional review.</p>
                  </div>
                </div>
                <div className="step-v reveal d3">
                  <div className="step-v-num">04</div>
                  <div>
                    <div className="step-v-title">Attorneys Review Structured Findings</div>
                    <p className="step-v-body">Legal professionals validate and assess AI-generated evidence before any enforcement decision is made — human judgment at every critical step.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: dashboard SVG panel */}
            <div className="how-right reveal d1">
              <div className="dash-panel">
                <div className="dash-topbar">
                  <div className="dash-dots">
                    <span className="dash-dot"></span>
                    <span className="dash-dot"></span>
                    <span className="dash-dot"></span>
                  </div>
                  <span className="dash-title-bar">Patent Gap AI — Analysis Dashboard</span>
                  <div className="dash-live">
                    <span className="dash-live-dot"></span>
                    <span className="dash-live-txt">Live</span>
                  </div>
                </div>
                <div className="dash-svg-wrap">
                  <svg viewBox="0 0 540 580" xmlns="http://www.w3.org/2000/svg" fontFamily="'Inconsolata', monospace">
                    <rect width="540" height="580" fill="#FAFAF7"/>
                    <defs>
                      <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(13,40,24,0.04)" strokeWidth="0.5"/>
                      </pattern>
                      <style>{`
                        .pulse-dot { animation: svgPulse 2.2s ease-in-out infinite; }
                        @keyframes svgPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
                        .flow-dash { stroke-dasharray: 5 6; animation: flowMove 1.8s linear infinite; }
                        @keyframes flowMove { to { stroke-dashoffset: -22; } }
                        .flow-dash2 { stroke-dasharray: 5 6; animation: flowMove2 2.0s linear infinite; }
                        @keyframes flowMove2 { to { stroke-dashoffset: -22; } }
                        .flow-dash3 { stroke-dasharray: 5 6; animation: flowMove3 2.2s linear infinite; }
                        @keyframes flowMove3 { to { stroke-dashoffset: -22; } }
                        .scan-bar { animation: scanDown 3s ease-in-out infinite; }
                        @keyframes scanDown { 0%{transform:translateY(0);opacity:0.7} 80%{transform:translateY(52px);opacity:0.15} 100%{transform:translateY(52px);opacity:0} }
                        .bar-fill { animation: barGrow 2s cubic-bezier(0.22,1,0.36,1) 0.4s both; transform-origin: left; }
                        @keyframes barGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
                        .bar-fill2 { animation: barGrow 2s cubic-bezier(0.22,1,0.36,1) 0.7s both; transform-origin: left; }
                        .bar-fill3 { animation: barGrow 2s cubic-bezier(0.22,1,0.36,1) 1.0s both; transform-origin: left; }
                        .fade-in-1 { animation: rowIn 0.5s ease 0.3s both; }
                        .fade-in-2 { animation: rowIn 0.5s ease 0.5s both; }
                        .fade-in-3 { animation: rowIn 0.5s ease 0.7s both; }
                        .fade-in-4 { animation: rowIn 0.5s ease 0.9s both; }
                        .fade-in-5 { animation: rowIn 0.5s ease 1.1s both; }
                        @keyframes rowIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
                      `}</style>
                      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(46,125,50,0.18)"/>
                        <stop offset="100%" stopColor="rgba(46,125,50,0)"/>
                      </radialGradient>
                    </defs>
                    <rect width="540" height="580" fill="url(#grid)"/>

                    {/* SECTION A: Patent Document */}
                    <rect x="20" y="16" width="154" height="178" rx="10" fill="#F5F2EC" stroke="rgba(13,40,24,0.10)" strokeWidth="1"/>
                    <rect x="20" y="16" width="154" height="3" rx="2" fill="#2E7D32" opacity="0.6"/>
                    <text x="32" y="36" fontSize="8.5" fill="rgba(13,40,24,0.35)" letterSpacing="0.12em">PATENT DOCUMENT</text>
                    <rect x="32" y="44" width="44" height="56" rx="4" fill="#FAFAF7" stroke="rgba(13,40,24,0.10)" strokeWidth="1"/>
                    <rect x="38" y="50" width="32" height="2" rx="1" fill="rgba(13,40,24,0.18)"/>
                    <rect x="38" y="55" width="28" height="2" rx="1" fill="rgba(13,40,24,0.12)"/>
                    <rect x="38" y="60" width="30" height="2" rx="1" fill="rgba(13,40,24,0.12)"/>
                    <rect x="38" y="65" width="24" height="2" rx="1" fill="rgba(13,40,24,0.12)"/>
                    <rect x="38" y="70" width="26" height="2" rx="1" fill="rgba(13,40,24,0.12)"/>
                    <rect x="38" y="75" width="20" height="2" rx="1" fill="rgba(13,40,24,0.12)"/>
                    <rect x="38" y="80" width="28" height="2" rx="1" fill="rgba(13,40,24,0.12)"/>
                    <rect x="38" y="85" width="22" height="2" rx="1" fill="rgba(13,40,24,0.12)"/>
                    <rect x="32" y="44" width="44" height="2" rx="1" fill="#2E7D32" opacity="0.35" className="scan-bar"/>
                    <text x="84" y="56" fontSize="7.5" fill="rgba(13,40,24,0.50)" letterSpacing="0.05em">US 11,234,567</text>
                    <text x="84" y="67" fontSize="7" fill="rgba(13,40,24,0.35)" letterSpacing="0.04em">Filed: 2021-03-14</text>
                    <text x="84" y="78" fontSize="7" fill="rgba(13,40,24,0.35)" letterSpacing="0.04em">Claims: 24</text>
                    <text x="84" y="89" fontSize="7" fill="rgba(13,40,24,0.35)" letterSpacing="0.04em">IPC: H04W</text>
                    <rect x="32" y="112" width="130" height="18" rx="5" fill="rgba(46,125,50,0.09)" stroke="rgba(46,125,50,0.22)" strokeWidth="0.8"/>
                    <circle cx="43" cy="121" r="3" fill="#2E7D32" className="pulse-dot"/>
                    <text x="51" y="124.5" fontSize="7.5" fill="#2E7D32" letterSpacing="0.10em">INGESTED &amp; QUEUED</text>
                    <text x="32" y="148" fontSize="7" fill="rgba(13,40,24,0.40)" letterSpacing="0.04em">Wireless Charging Adaptive</text>
                    <text x="32" y="158" fontSize="7" fill="rgba(13,40,24,0.40)" letterSpacing="0.04em">Power Control System</text>
                    <rect x="32" y="172" width="28" height="14" rx="4" fill="rgba(13,40,24,0.06)"/>
                    <text x="46" y="181.5" fontSize="8" fill="rgba(13,40,24,0.35)" textAnchor="middle" letterSpacing="0.06em">①</text>

                    {/* FLOW ARROW A→B */}
                    <line x1="174" y1="105" x2="212" y2="105" stroke="rgba(46,125,50,0.40)" strokeWidth="1.4" className="flow-dash"/>
                    <polygon points="212,101 220,105 212,109" fill="rgba(46,125,50,0.55)"/>

                    {/* SECTION B: Claims Extracted */}
                    <rect x="222" y="16" width="298" height="178" rx="10" fill="#F5F2EC" stroke="rgba(13,40,24,0.10)" strokeWidth="1"/>
                    <rect x="222" y="16" width="298" height="3" rx="2" fill="#2E7D32" opacity="0.6"/>
                    <text x="236" y="36" fontSize="8.5" fill="rgba(13,40,24,0.35)" letterSpacing="0.12em">CLAIMS EXTRACTED &amp; PARSED</text>
                    <g className="fade-in-1">
                      <rect x="236" y="44" width="270" height="24" rx="5" fill="#FAFAF7" stroke="rgba(13,40,24,0.08)" strokeWidth="0.8"/>
                      <rect x="236" y="44" width="3" height="24" rx="1" fill="#2E7D32" opacity="0.7"/>
                      <text x="246" y="54" fontSize="7.5" fill="rgba(13,40,24,0.65)" letterSpacing="0.04em" fontWeight="500">Claim 1 — Independent</text>
                      <text x="246" y="63" fontSize="7" fill="rgba(13,40,24,0.38)" letterSpacing="0.04em">Adaptive frequency allocation method comprising…</text>
                      <text x="490" y="59" fontSize="7.5" fill="#2E7D32" textAnchor="end" letterSpacing="0.06em">BROAD</text>
                    </g>
                    <g className="fade-in-2">
                      <rect x="236" y="72" width="270" height="24" rx="5" fill="#FAFAF7" stroke="rgba(13,40,24,0.08)" strokeWidth="0.8"/>
                      <rect x="236" y="72" width="3" height="24" rx="1" fill="#2E7D32" opacity="0.5"/>
                      <text x="246" y="82" fontSize="7.5" fill="rgba(13,40,24,0.65)" letterSpacing="0.04em" fontWeight="500">Claim 4 — Dependent</text>
                      <text x="246" y="91" fontSize="7" fill="rgba(13,40,24,0.38)" letterSpacing="0.04em">Wherein the power control loop adjusts…</text>
                      <text x="490" y="87" fontSize="7.5" fill="rgba(13,40,24,0.38)" textAnchor="end" letterSpacing="0.06em">DEP</text>
                    </g>
                    <g className="fade-in-3">
                      <rect x="236" y="100" width="270" height="24" rx="5" fill="#FAFAF7" stroke="rgba(13,40,24,0.08)" strokeWidth="0.8"/>
                      <rect x="236" y="100" width="3" height="24" rx="1" fill="#2E7D32" opacity="0.5"/>
                      <text x="246" y="110" fontSize="7.5" fill="rgba(13,40,24,0.65)" letterSpacing="0.04em" fontWeight="500">Claim 9 — Independent</text>
                      <text x="246" y="119" fontSize="7" fill="rgba(13,40,24,0.38)" letterSpacing="0.04em">System for resonant coupling array wherein…</text>
                      <text x="490" y="115" fontSize="7.5" fill="#2E7D32" textAnchor="end" letterSpacing="0.06em">BROAD</text>
                    </g>
                    <g className="fade-in-4">
                      <rect x="236" y="128" width="270" height="24" rx="5" fill="#FAFAF7" stroke="rgba(13,40,24,0.08)" strokeWidth="0.8"/>
                      <rect x="236" y="128" width="3" height="24" rx="1" fill="rgba(13,40,24,0.12)" opacity="0.6"/>
                      <text x="246" y="138" fontSize="7.5" fill="rgba(13,40,24,0.40)" letterSpacing="0.04em" fontWeight="500">+ 20 more claims parsed</text>
                      <text x="246" y="147" fontSize="7" fill="rgba(13,40,24,0.28)" letterSpacing="0.04em">Pending element-level decomposition…</text>
                    </g>
                    <rect x="236" y="168" width="28" height="14" rx="4" fill="rgba(13,40,24,0.06)"/>
                    <text x="250" y="177.5" fontSize="8" fill="rgba(13,40,24,0.35)" textAnchor="middle" letterSpacing="0.06em">②</text>

                    {/* FLOW ARROW ↓ to AI Engine */}
                    <line x1="270" y1="194" x2="270" y2="228" stroke="rgba(46,125,50,0.40)" strokeWidth="1.4" className="flow-dash2"/>
                    <polygon points="266,228 270,236 274,228" fill="rgba(46,125,50,0.55)"/>

                    {/* SECTION C: AI Engine */}
                    <rect x="20" y="238" width="500" height="116" rx="10" fill="#0D2818" stroke="rgba(250,250,247,0.07)" strokeWidth="1"/>
                    <rect x="20" y="238" width="500" height="116" rx="10" fill="url(#glow)"/>
                    <text x="40" y="262" fontSize="8.5" fill="rgba(250,250,247,0.30)" letterSpacing="0.14em">AI ANALYSIS ENGINE</text>
                    <rect x="480" y="252" width="28" height="14" rx="4" fill="rgba(250,250,247,0.08)"/>
                    <text x="494" y="261.5" fontSize="8" fill="rgba(250,250,247,0.35)" textAnchor="middle" letterSpacing="0.06em">③</text>
                    <rect x="40" y="270" width="110" height="22" rx="6" fill="rgba(46,125,50,0.18)" stroke="rgba(46,125,50,0.30)" strokeWidth="0.8"/>
                    <circle cx="52" cy="281" r="3" fill="#4ade80" className="pulse-dot"/>
                    <text x="60" y="284" fontSize="7.5" fill="rgba(250,250,247,0.70)" letterSpacing="0.08em">Claim Mapping</text>
                    <rect x="158" y="270" width="118" height="22" rx="6" fill="rgba(46,125,50,0.12)" stroke="rgba(46,125,50,0.22)" strokeWidth="0.8"/>
                    <circle cx="170" cy="281" r="3" fill="#4ade80" className="pulse-dot" style={{animationDelay:'0.4s'}}/>
                    <text x="178" y="284" fontSize="7.5" fill="rgba(250,250,247,0.60)" letterSpacing="0.08em">Prior Art Scan</text>
                    <rect x="284" y="270" width="128" height="22" rx="6" fill="rgba(46,125,50,0.12)" stroke="rgba(46,125,50,0.22)" strokeWidth="0.8"/>
                    <circle cx="296" cy="281" r="3" fill="#4ade80" className="pulse-dot" style={{animationDelay:'0.8s'}}/>
                    <text x="304" y="284" fontSize="7.5" fill="rgba(250,250,247,0.60)" letterSpacing="0.08em">Overlap Scoring</text>
                    <rect x="420" y="270" width="84" height="22" rx="6" fill="rgba(46,125,50,0.12)" stroke="rgba(46,125,50,0.22)" strokeWidth="0.8"/>
                    <circle cx="432" cy="281" r="3" fill="#4ade80" className="pulse-dot" style={{animationDelay:'1.2s'}}/>
                    <text x="440" y="284" fontSize="7.5" fill="rgba(250,250,247,0.60)" letterSpacing="0.08em">Evidence</text>
                    <text x="40" y="312" fontSize="7" fill="rgba(250,250,247,0.28)" letterSpacing="0.10em">ANALYSIS PROGRESS</text>
                    <rect x="40" y="317" width="440" height="6" rx="3" fill="rgba(250,250,247,0.08)"/>
                    <rect x="40" y="317" width="352" height="6" rx="3" fill="#2E7D32" opacity="0.8" className="bar-fill"/>
                    <text x="486" y="324" fontSize="7.5" fill="#4ade80" textAnchor="end" letterSpacing="0.06em">80%</text>

                    {/* FLOW ARROW ↓ to Findings */}
                    <line x1="270" y1="354" x2="270" y2="386" stroke="rgba(46,125,50,0.40)" strokeWidth="1.4" className="flow-dash3"/>
                    <polygon points="266,386 270,394 274,386" fill="rgba(46,125,50,0.55)"/>

                    {/* SECTION D: Findings */}
                    <rect x="20" y="396" width="500" height="168" rx="10" fill="#F5F2EC" stroke="rgba(13,40,24,0.10)" strokeWidth="1"/>
                    <rect x="20" y="396" width="500" height="3" rx="2" fill="#2E7D32" opacity="0.6"/>
                    <text x="36" y="416" fontSize="8.5" fill="rgba(13,40,24,0.35)" letterSpacing="0.12em">INFRINGEMENT FINDINGS</text>
                    <rect x="400" y="406" width="108" height="16" rx="4" fill="rgba(46,125,50,0.09)" stroke="rgba(46,125,50,0.22)" strokeWidth="0.8"/>
                    <text x="454" y="416.5" fontSize="7" fill="#2E7D32" textAnchor="middle" letterSpacing="0.08em">3 FLAGGED · 2 QUEUED</text>
                    <text x="36" y="432" fontSize="7" fill="rgba(13,40,24,0.30)" letterSpacing="0.10em">TECHNOLOGY / ENTITY</text>
                    <text x="270" y="432" fontSize="7" fill="rgba(13,40,24,0.30)" letterSpacing="0.10em" textAnchor="middle">CLAIM REF</text>
                    <text x="390" y="432" fontSize="7" fill="rgba(13,40,24,0.30)" letterSpacing="0.10em" textAnchor="middle">RISK</text>
                    <text x="490" y="432" fontSize="7" fill="rgba(13,40,24,0.30)" letterSpacing="0.10em" textAnchor="end">SCORE</text>
                    <line x1="36" y1="436" x2="504" y2="436" stroke="rgba(13,40,24,0.07)" strokeWidth="0.8"/>
                    <g className="fade-in-1">
                      <rect x="36" y="439" width="3" height="24" rx="1" fill="#ef4444" opacity="0.80"/>
                      <text x="46" y="449" fontSize="8" fill="rgba(13,40,24,0.72)" letterSpacing="0.04em" fontWeight="500">TechCorp Inc — PowerSense Module</text>
                      <text x="46" y="459" fontSize="7" fill="rgba(13,40,24,0.38)" letterSpacing="0.04em">§ 271(a) Direct · Product launch Q2 2024</text>
                      <text x="270" y="454" fontSize="7.5" fill="rgba(13,40,24,0.50)" textAnchor="middle" letterSpacing="0.04em">Cl. 1, 4, 9</text>
                      <rect x="358" y="443" width="64" height="16" rx="4" fill="rgba(239,68,68,0.10)"/>
                      <text x="390" y="453.5" fontSize="7.5" fill="#dc2626" textAnchor="middle" letterSpacing="0.08em" fontWeight="700">HIGH</text>
                      <text x="490" y="454" fontSize="9" fill="#0D2818" textAnchor="end" fontWeight="700">94%</text>
                      <line x1="36" y1="465" x2="504" y2="465" stroke="rgba(13,40,24,0.06)" strokeWidth="0.6"/>
                    </g>
                    <g className="fade-in-2">
                      <rect x="36" y="468" width="3" height="24" rx="1" fill="#f59e0b" opacity="0.80"/>
                      <text x="46" y="478" fontSize="8" fill="rgba(13,40,24,0.72)" letterSpacing="0.04em" fontWeight="500">InnoCharge GmbH — WC-9 Platform</text>
                      <text x="46" y="488" fontSize="7" fill="rgba(13,40,24,0.38)" letterSpacing="0.04em">§ 271(b) Induced · Patent pending overlap</text>
                      <text x="270" y="483" fontSize="7.5" fill="rgba(13,40,24,0.50)" textAnchor="middle" letterSpacing="0.04em">Cl. 1, 12</text>
                      <rect x="352" y="472" width="76" height="16" rx="4" fill="rgba(245,158,11,0.10)"/>
                      <text x="390" y="482.5" fontSize="7.5" fill="#b45309" textAnchor="middle" letterSpacing="0.08em" fontWeight="700">REVIEW</text>
                      <text x="490" y="483" fontSize="9" fill="#0D2818" textAnchor="end" fontWeight="700">81%</text>
                      <line x1="36" y1="494" x2="504" y2="494" stroke="rgba(13,40,24,0.06)" strokeWidth="0.6"/>
                    </g>
                    <g className="fade-in-3">
                      <rect x="36" y="497" width="3" height="24" rx="1" fill="#2E7D32" opacity="0.60"/>
                      <text x="46" y="507" fontSize="8" fill="rgba(13,40,24,0.72)" letterSpacing="0.04em" fontWeight="500">NovaPower Ltd — Continuation Window</text>
                      <text x="46" y="517" fontSize="7" fill="rgba(13,40,24,0.38)" letterSpacing="0.04em">Licensing opportunity · § 102 clear</text>
                      <text x="270" y="512" fontSize="7.5" fill="rgba(13,40,24,0.50)" textAnchor="middle" letterSpacing="0.04em">Cl. 9</text>
                      <rect x="358" y="501" width="64" height="16" rx="4" fill="rgba(46,125,50,0.09)"/>
                      <text x="390" y="511.5" fontSize="7.5" fill="#2E7D32" textAnchor="middle" letterSpacing="0.08em" fontWeight="700">OPP</text>
                      <text x="490" y="512" fontSize="9" fill="#0D2818" textAnchor="end" fontWeight="700">—</text>
                    </g>
                    <path d="M20,548 h500 v6 q0,10 -10,10 h-480 q-10,0 -10,-10 v-6z" fill="#0D2818"/>
                    <circle cx="36" cy="557" r="3" fill="#4ade80" className="pulse-dot"/>
                    <text x="46" y="560" fontSize="7.5" fill="rgba(250,250,247,0.40)" letterSpacing="0.10em">ATTORNEY REVIEW QUEUED · 2 FINDINGS READY</text>
                    <text x="500" y="560" fontSize="7.5" fill="rgba(250,250,247,0.55)" textAnchor="end" letterSpacing="0.08em">↓ EXPORT PDF / DOCX / JSON</text>
                    <rect x="36" y="530" width="28" height="14" rx="4" fill="rgba(13,40,24,0.06)"/>
                    <text x="50" y="539.5" fontSize="8" fill="rgba(13,40,24,0.35)" textAnchor="middle" letterSpacing="0.06em">④</text>
                  </svg>
                </div>
              </div>
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
              <h2 className="serif">The Platform Behind Your Patent <em>Protection</em></h2>
            </div>
            <div className="ai-desc reveal d1">
              <p>Patent claim language is precise, technical, and deliberately complex. Until recently, interpreting it at scale required senior attorney hours on every search.</p>
              <p>Patent Gap AI uses modern language models trained on patent data to read claims the way attorneys do — and then runs that analysis continuously across your entire portfolio.</p>
              <p>The result is a live view of your portfolio's exposure: which claims are at risk, which sources are overlapping, and which findings are ready for legal review right now.</p>
            </div>
          </div>
          <div className="ai-pillars">
            <div className="ai-pillar reveal">
              <div className="ap-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(250,250,247,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div className="ap-title">Reads Claims Like an Attorney</div>
              <p className="ap-body">Our platform interprets patent claim language at the element level — the same granularity a skilled attorney uses — and applies that analysis across your full portfolio automatically.</p>
            </div>
            <div className="ai-pillar reveal d1">
              <div className="ap-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(250,250,247,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <div className="ap-title">Connected to Public Patent Data</div>
              <p className="ap-body">USPTO filings, Espacenet, and public product disclosures are scanned continuously. When something overlaps with your claims, you see it — with the source citation already attached.</p>
            </div>
            <div className="ai-pillar reveal d2">
              <div className="ap-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(250,250,247,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </div>
              <div className="ap-title">Always On, Not One-Off</div>
              <p className="ap-body">Infringement doesn't happen on a schedule. Your monitoring shouldn't either. Patent Gap AI runs continuously so new filings and product launches are caught as they happen, not at the next quarterly review.</p>
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

      
<TestimonialsCarousel />
      
      {/* ── CTA ── */}
      <section className="cta-section" id="cta">
        <div className="cta-inner">
          <span className="cta-lbl">Get Started</span>
          <h2 className="cta-h">Stop Losing Revenue on Patents <em>You Already Own</em></h2>
          <div className="cta-btns">
            <Link to="/request-demo" className="btn-cta-white">Request Early Access</Link>
            <Link to="/contact" className="btn-cta-outline">Contact Us</Link>
          </div>
         <p className="cta-sub">Know what's infringing your patents. Know it now, not after the damage is done.</p>
        </div>
      </section>

      <Footer />
    </>
  )
}
