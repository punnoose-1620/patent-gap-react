import { useState, useEffect, useRef, useCallback } from 'react'

const TESTIMONIALS = [
  {
    initials: 'FK', name: 'Firat Koseoglu',
    image: '/images/testimonials/firat.jpg',
    role: 'Patent Engineer', firm: 'Patent Engineer',
    tag: 'Patent Engineer',
    quote: "Patent Gap AI transforms static patent portfolios into continuously monitored sources of evidence-backed infringement leads.",
  },
  {
    initials: 'BL', name: 'Brent Lindon',
    image: '',
    role: 'Patent Attorney', firm: 'Patent Drafters',
    tag: 'Patent Attorney',
    quote: "Many patent portfolios do not reach enforcement because infringement screening is costly and difficult to scale. Patent Gap AI addresses that bottleneck.",
  },
  {
    initials: 'JK', name: 'W. John Keyes',
    image: '',
    role: 'Counsel, Intellectual Property', firm: 'TBD.',
    tag: 'Counsel, Intellectual Property',
    quote: "In biopharma we have many R&D intelligence tools, but none that automate patent infringement monitoring - Patent Gap AI directly addresses that gap.",
  },
  {
    initials: 'PH', name: 'Peter L. Holmes',
    image: '/images/testimonials/peter.jpg',
    role: 'Intellectual Property Attorney', firm: 'Peter L. Holmes, Esq.',
    tag: 'Intellectual Property Attorney',
    quote: "Patent Gap AI helps automate the time-intensive legal work behind claim interpretation, infringement search and analysis, and product-to-claim mapping.",
  },
  {
    initials: 'AS', name: 'Ashwani Sethi',
    image: '/images/testimonials/test.png',
    role: 'Patent Engineer', firm: 'Patent Engineer',
    tag: 'Patent Engineer',
    quote: "Identifying reliable evidence of use has traditionally been slow and manual. Patent Gap AI brings structure and scale to that analysis.",
  },
  
]

// ── Reusable Avatar component ──────────────────────────────────────────────
function Avatar({ image, initials, alt, className }) {
  const [imgFailed, setImgFailed] = useState(false)
  console.log('Avatar', { image, initials, alt, imgFailed })

  // Reset failed state whenever the image src changes
  useEffect(() => {
    setImgFailed(false)
  }, [image])

  if (image && !imgFailed) {
    return (
      <img
        src={image}
        alt={alt}
        className={className}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return <div className={className}>{initials}</div>
}

function usePerPage() {
  const [per, setPer] = useState(3)
  useEffect(() => {
    function update() {
      if (window.innerWidth < 640)       setPer(1)
      else if (window.innerWidth < 1024) setPer(2)
      else                               setPer(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return per
}

export default function TestimonialsCarousel() {
  const perPage  = usePerPage()
  const total    = TESTIMONIALS.length
  const maxIndex = total - perPage

  const [active, setActive]   = useState(0)
  const [animDir, setAnimDir] = useState(null)
  const [paused, setPaused]   = useState(false)
  const timerRef              = useRef(null)
  const dragStart             = useRef(null)

  const go = useCallback((next, dir) => {
    const clamped = Math.max(0, Math.min(next, maxIndex))
    if (clamped === active) return
    setAnimDir(dir)
    setActive(clamped)
  }, [active, maxIndex])

  const prev = () => go(active - 1, 'right')
  const next = () => go(active + 1, 'left')

  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(() => {
      const nextIdx = active >= maxIndex ? 0 : active + 1
      go(nextIdx, 'left')
    }, 5000)
    return () => clearTimeout(timerRef.current)
  }, [active, paused, maxIndex, go])

  useEffect(() => {
    setActive(prev => Math.min(prev, total - perPage))
  }, [perPage, total])

  const onTouchStart = e => { dragStart.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (dragStart.current === null) return
    const delta = dragStart.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) delta > 0 ? next() : prev()
    dragStart.current = null
  }

  const groups    = Math.ceil(total / perPage)
  const activeDot = Math.round(active / perPage)

  return (
    <section
      className="testimonials"
      id="testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Practitioner testimonials"
    >
      <div className="section-wrap">

        {/* ── HEADER ── */}
        <div className="tc-header reveal">
          <div>
            <div className="eyebrow">What Practitioners Say</div>
            <h2 className="serif">Trusted by <em>IP Professionals</em></h2>
            <p className="tc-subhead">
              Insights from patent attorneys, IP counsel, and enforcement professionals
              who rely on Patent Gap AI in active practice.
            </p>
          </div>

          <div className="tc-arrows">
            <button
              className={`tc-arrow${active === 0 ? ' disabled' : ''}`}
              onClick={prev}
              aria-label="Previous testimonials"
              disabled={active === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="tc-count">
              <span className="tc-count-cur">{String(active + 1).padStart(2, '0')}</span>
              <span className="tc-count-sep">/</span>
              <span className="tc-count-tot">{String(maxIndex + 1).padStart(2, '0')}</span>
            </div>
            <button
              className={`tc-arrow${active >= maxIndex ? ' disabled' : ''}`}
              onClick={next}
              aria-label="Next testimonials"
              disabled={active >= maxIndex}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── TRACK ── */}
        <div
          className="tc-viewport"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="tc-track"
            style={{
              transform: `translateX(calc(-${active} * (100% / ${perPage}) - ${active} * (16px / ${perPage})))`,
            }}
          >
            {TESTIMONIALS.map((t, i) => {
              const isVisible = i >= active && i < active + perPage
              return (
                <div
                  key={i}
                  className={`tc-card${isVisible ? ' visible' : ''}`}
                  style={{ flex: `0 0 calc((100% - ${(perPage - 1) * 16}px) / ${perPage})` }}
                  aria-hidden={!isVisible}
                >
                  <blockquote className="tc-quote">
                    <span className="tc-quotemark">&ldquo;</span>
                    {t.quote}
                    <span className="tc-quotemark tc-quotemark--close">&rdquo;</span>
                  </blockquote>

                  <div className="tc-rule" />

                  <div className="tc-person">
                    {/* ── CARD AVATAR: image with initials fallback ── */}
                    <Avatar
                      image={t.image}
                      initials={t.initials}
                      alt={t.name}
                      className="tc-avatar"
                      width={48}        // ← add this
                      height={48} 
                    />
                    <div className="tc-meta">
                      <span className="tc-name">{t.name}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="tc-footer">

          <div className="tc-progress-wrap">
            <div
              className="tc-progress-fill"
              style={{ width: `${((active + perPage) / total) * 100}%` }}
            />
          </div>

          <div className="tc-dots" role="tablist" aria-label="Testimonial pages">
            {Array.from({ length: groups }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeDot}
                className={`tc-dot${i === activeDot ? ' active' : ''}`}
                onClick={() => go(Math.min(i * perPage, maxIndex), i > activeDot ? 'left' : 'right')}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <div className="tc-thumbs" role="list">
            {TESTIMONIALS.map((t, i) => {
              const isActive = i >= active && i < active + perPage
              return (
                <button
                  key={i}
                  role="listitem"
                  className={`tc-thumb${isActive ? ' active' : ''}`}
                  onClick={() => go(Math.min(i, maxIndex), i > active ? 'left' : 'right')}
                  aria-label={`View ${t.name}'s testimonial`}
                  title={`${t.name} — ${t.firm}`}
                >
                  {/* ── THUMB AVATAR: image with initials fallback ── */}
                  <Avatar
                    image={t.image}
                    initials={t.initials}
                    alt={t.name}
                    className="tc-thumb-initials"
                  />
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}
