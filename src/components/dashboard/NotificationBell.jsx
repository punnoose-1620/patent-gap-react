import { useState, useEffect, useRef } from 'react';

/**
 * NotificationBell
 * Props:
 *   patents — the full mappedPatents array from DashboardPage
 *   onPatentClick — called with the patent object when user clicks a row
 */
const NotificationBell = ({ patents = [], onPatentClick }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const updatedPatents = patents.filter(p => p.hasUpdates);
  const count = updatedPatents.length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* ── Bell button ── */}
      <button
        className="tn-icon"
        aria-label="Notifications"
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Green count badge */}
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: 1,
            right: 1,
            minWidth: 15,
            height: 15,
            borderRadius: 10,
            background: '#16a34a',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "'Inconsolata', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            boxShadow: '0 0 0 2px var(--surface, #fff)',
            pointerEvents: 'none',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: 320,
          background: 'var(--surface, #fff)',
          border: '1px solid var(--rule2, #e5e5e0)',
          borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          zIndex: 999,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--rule2, #e5e5e0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: 'var(--ink3, #8C8C84)',
            }}>
              Notifications
            </span>
            {count > 0 && (
              <span style={{
                background: 'rgba(22,163,74,0.12)',
                color: '#16a34a',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "'Inconsolata', monospace",
                padding: '2px 8px',
                borderRadius: 20,
              }}>
                {count} update{count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {count === 0 ? (
              <div style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: 'var(--ink3, #8C8C84)',
                fontSize: 13,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                No new updates
              </div>
            ) : (
              updatedPatents.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => { onPatentClick?.(p); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '11px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: i < updatedPatents.length - 1 ? '1px solid var(--rule2, #e5e5e0)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--rule1, #f5f5f0)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {/* Pulsing green dot */}
                  <span style={{
                    marginTop: 4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#16a34a',
                    flexShrink: 0,
                    animation: 'notif-pulse 1.8s ease-in-out infinite',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--ink1, #1a1a16)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 2,
                    }}>
                      {p.title}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{
                        fontFamily: "'Inconsolata', monospace",
                        fontSize: 10,
                        color: 'var(--ink3, #8C8C84)',
                      }}>
                        {p.patentNumber}
                      </span>
                      <span style={{ color: 'var(--rule2)', fontSize: 10 }}>·</span>
                      <span style={{
                        fontSize: 10,
                        color: 'var(--ink3, #8C8C84)',
                      }}>
                        Updated {p.updatedAt}
                      </span>
                    </div>
                  </div>

                  {/* Risk pill if applicable */}
                  {(p.riskLevel === 'high' || p.riskLevel === 'medium') && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "'Inconsolata', monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 7px',
                      borderRadius: 20,
                      flexShrink: 0,
                      background: p.riskLevel === 'high' ? 'rgba(185,28,28,0.10)' : 'rgba(140,140,132,0.12)',
                      color: p.riskLevel === 'high' ? '#B91C1C' : '#8C8C84',
                    }}>
                      {p.riskLevel === 'high' ? 'High Risk' : 'Med Risk'}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--rule2, #e5e5e0)',
              textAlign: 'center',
            }}>
              <span style={{
                fontSize: 11,
                color: 'var(--ink3, #8C8C84)',
                fontFamily: "'Inconsolata', monospace",
              }}>
                Click a patent to view details
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes notif-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
