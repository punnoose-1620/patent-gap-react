// src/components/dashboard/FetchBar.jsx

import { useState } from 'react';

export default function FetchBar({ fetchingIds, errorIds = [], initialCount }) {
  const [showFetchPopup, setShowFetchPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const hasFetching = fetchingIds && fetchingIds.length > 0;
  const hasErrors   = errorIds && errorIds.length > 0;

  if (!hasFetching && !hasErrors) return null;

  const pct = initialCount > 0
    ? Math.round(((initialCount - fetchingIds.length) / initialCount) * 100)
    : 0;

  return (
    <>
      <div style={{
        border: '0.5px solid rgba(46,125,50,0.30)',
        borderLeft: '3px solid #3B6D11',
        borderRadius: '0 10px 10px 0',
        padding: '14px 18px',
        marginBottom: 16,
        position: 'relative',
      }}>

        {/* ── Top row ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, display:'flex', alignItems:'center', gap: 8 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#3B6D11', display: 'inline-block',
              animation: 'fetchDotPulse 1.2s ease-in-out infinite',
            }} />
            Fetching patents
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Fetching count + link */}
            {hasFetching && (
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, color: '#3B6D11' }}>
                  {fetchingIds.length} remaining
                </span>
                <button
                  onClick={() => { setShowFetchPopup(v => !v); setShowErrorPopup(false); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: '#3B6D11', textDecoration: 'underline', padding: 0,
                    opacity: 0.75, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.75}
                >
                  view ids
                </button>
              </span>
            )}

            {/* Error count + link */}
            {hasErrors && (
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--red, #B91C1C)' }}>
                  {errorIds.length} error{errorIds.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => { setShowErrorPopup(v => !v); setShowFetchPopup(false); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--red, #B91C1C)', textDecoration: 'underline', padding: 0,
                    opacity: 0.75, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.75}
                >
                  view error ids
                </button>
              </span>
            )}
          </div>
        </div>

        {/* ── Progress bar ── */}
        {hasFetching && (
          <div style={{ height: 6, background: 'rgba(46,125,50,0.10)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: '#3B6D11',
              width: `${pct}%`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        )}

        {/* ── Footer text ── */}
        <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>
          {hasFetching
            ? `${initialCount - fetchingIds.length} of ${initialCount} patents ready · checking every 3s`
            : `All patents fetched · ${hasErrors ? `${errorIds.length} failed` : ''}`
          }
        </div>

        {/* ── Fetching IDs popup ── */}
        {showFetchPopup && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
            background: 'var(--bg, #FAFAF7)',
            border: '1px solid rgba(46,125,50,0.25)',
            borderRadius: 10, padding: '12px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            minWidth: 260, maxWidth: 380,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <span style={{
                fontFamily: "'Inconsolata', monospace", fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.10em', color: '#3B6D11',
                fontWeight: 700,
              }}>
                Fetching IDs ({fetchingIds.length})
              </span>
              <button
                onClick={() => setShowFetchPopup(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
              {fetchingIds.map((id, i) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 8px', borderRadius: 6,
                  background: 'rgba(46,125,50,0.06)',
                  border: '1px solid rgba(46,125,50,0.14)',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#3B6D11', flexShrink: 0,
                    animation: 'fetchDotPulse 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }} />
                  <span style={{
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    color: '#3B6D11', wordBreak: 'break-all',
                  }}>
                    {id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error IDs popup ── */}
        {showErrorPopup && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
            background: 'var(--bg, #FAFAF7)',
            border: '1px solid rgba(185,28,28,0.25)',
            borderRadius: 10, padding: '12px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            minWidth: 260, maxWidth: 380,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <span style={{
                fontFamily: "'Inconsolata', monospace", fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.10em',
                color: 'var(--red, #B91C1C)', fontWeight: 700,
              }}>
                Error IDs ({errorIds.length})
              </span>
              <button
                onClick={() => setShowErrorPopup(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
              {errorIds.map((id) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 8px', borderRadius: 6,
                  background: 'rgba(185,28,28,0.06)',
                  border: '1px solid rgba(185,28,28,0.14)',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="var(--red, #B91C1C)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span style={{
                    fontFamily: "'Inconsolata', monospace", fontSize: 11,
                    color: 'var(--red, #B91C1C)', wordBreak: 'break-all',
                  }}>
                    {id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fetchDotPulse {
          0%, 100% { opacity: .6; }
          50%       { opacity: 1; }
        }
      `}</style>
    </>
  );
}