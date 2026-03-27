// ===========================
// FILE: InfringementModal.jsx
// ===========================
// Supports two infringement formats:
//   Patent  → entry_id, entry_title, entry_url, similar_claims
//   Product → product_id, product_name, product_url, claims, similar_claims (with justification)
// ===========================

import { createPortal } from 'react-dom';
import { X, ExternalLink, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { patentApi } from '../../api/patentApi';

const getSimilarityScoreClass = (score) => {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
};
const formatSimilarityScore = (score) => `${Math.round(score * 100)}%`;

// ─────────────────────────────────────────────────────────────
// Detect which format a raw infringement object uses and
// return a normalised shape the modal can consume uniformly.
// ─────────────────────────────────────────────────────────────
const normaliseInfringement = (raw) => {
  if (!raw) return null;
  const isProduct = Boolean(raw.product_id);
  return {
    type:         isProduct ? 'product' : 'patent',
    title:        isProduct ? (raw.product_name  || 'Untitled Product') : (raw.entry_title || 'Untitled'),
    id:           isProduct ? (raw.product_id    || 'N/A')              : (raw.entry_id    || 'N/A'),
    url:          isProduct ? (raw.product_url   || null)               : (raw.entry_url   || null),
    source:       raw.source || 'unknown',
    similarClaims: raw.similar_claims || [],
    // patent-only
    sameAsPatent: raw.same_as_patent || false,
    // product-only: the product's own claims array
    productClaims: isProduct ? (raw.claims || []) : [],
  };
};

const InfringementModal = ({
  match,
  patentTitle,
  patentNumber,
  caseId,
  infringementId,
  onClose,
}) => {
  if (!match) return null;

  const [caseData,     setCaseData]     = useState(null);
  const [rawInfData,   setRawInfData]   = useState(null);   // raw API object
  const [normInfData,  setNormInfData]  = useState(null);   // normalised
  const [sameAsPatent, setSameAsPatent] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fetch + normalise
  useEffect(() => {
    if (!caseId || !infringementId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedCase = await patentApi.getCaseById(caseId);
        setCaseData(fetchedCase);

        // Find by entry_id OR product_id
        const found = (fetchedCase.infringements || []).find(
          (inf) => inf.entry_id === infringementId || inf.product_id === infringementId
        );

        setRawInfData(found || null);
        const normalised = normaliseInfringement(found);
        setNormInfData(normalised);

        console.log('📋 Raw infringement in modal:', found);
        console.log('📋 Normalised infringement:', normalised);

        // Same-patent check only makes sense for patent type
        if (found && normalised?.type === 'patent') {
          if (found.same_as_patent) {
            setSameAsPatent(true);
          } else {
            const isSame = await patentApi.checkSamePatent(fetchedCase.title, found.entry_title);
            setSameAsPatent(isSame);
          }
        }
      } catch (err) {
        console.error('Error loading infringement details:', err);
        setError(err?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [caseId, infringementId]);

  // ── Derived display values ──
  // Prefer fresh API data; fall back to the match prop passed from the card
  const isProduct  = normInfData ? normInfData.type === 'product' : match.type === 'product';
  const title      = normInfData?.title   || match.title || 'Infringement Details';
  const entryId    = normInfData?.id      || match.id    || 'N/A';
  const source     = normInfData?.source  || match.source || (isProduct ? 'Amazon' : 'Google Patents');
  const entryUrl   = normInfData?.url     || match.url   || null;
  const caseLabel  = caseId ? (caseId.split('_')[1] || caseId) : (patentNumber || 'N/A');

  const riskLevel  = match.riskLevel || 'low';
  const isHigh     = riskLevel === 'high';
  const isMedium   = riskLevel === 'medium';
  const riskColor  = isHigh ? 'var(--red)' : isMedium ? 'var(--amber)' : 'var(--accent)';
  const riskBg     = isHigh ? 'var(--red-soft)' : isMedium ? 'var(--amber-soft)' : 'var(--acc-soft)';
  const scoreNum   = match.score || 0;

  // Product claims (the product's own described claims)
  const productClaims = normInfData?.productClaims || match.claims || [];

  // ── Build claim chart rows ──
  // Patent format: zip caseData.claims with similar_claims by index
  // Product format: similar_claims already carry 'claim' + optional 'justification'
  const claimRows = (() => {
    const similarClaims = normInfData?.similarClaims || rawInfData?.similar_claims || match.similarClaims || [];

    if (isProduct) {
      // Product: each row comes directly from similar_claims
      return similarClaims.map((sc, index) => ({
        claimNumber:     index + 1,
        yourClaim:       productClaims[index] || '—',    // product's own claim at same index
        similarClaim:    sc.claim             || null,
        similarityScore: sc.similarity_score  ?? null,
        urlToClaim:      sc.url_to_claim      || null,
        justification:   sc.justification     || null,   // product-only field
      }));
    } else {
      // Patent: zip caseData.claims with similar_claims
      const patentClaims = caseData?.claims || [];
      if (!patentClaims.length) return [];
      return patentClaims.map((claim, index) => {
        const sc    = similarClaims[index] || null;
        const parts = claim.split('. ');
        const text  = parts.length > 1 ? parts.slice(1).join('. ').trim() : claim;
        return {
          claimNumber:     index + 1,
          yourClaim:       text,
          similarClaim:    sc?.claim            || null,
          similarityScore: sc?.similarity_score ?? null,
          urlToClaim:      sc?.url_to_claim     || null,
          justification:   null,
        };
      });
    }
  })();

  // ─── JSX ─────────────────────────────────────────────────────────────────
  const content = (
    <>
      <style>{`
        @keyframes _im_bdIn  { from{opacity:0} to{opacity:1} }
        @keyframes _im_panIn {
          from { opacity:0; transform:translate(-50%,-46%) scale(0.96); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
        @keyframes _im_panInMobile {
          from { opacity:0; transform:translateY(100%); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes _im_spin  { to { transform:rotate(360deg) } }

        ._im_bd {
          position:fixed; inset:0; z-index:9000;
          background:rgba(13,40,24,0.52);
          backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
          animation:_im_bdIn 0.22s ease both;
        }
        ._im_panel {
          position:fixed; top:50%; left:50%;
          transform:translate(-50%,-50%);
          z-index:9001;
          width:min(92vw,1060px); max-height:88vh;
          display:flex; flex-direction:column;
          background:var(--bg,#FAFAF7);
          border-radius:20px;
          border:1.5px solid rgba(255,255,255,0.65);
          box-shadow:
            0 0 0 1px rgba(13,40,24,0.06),
            0 8px 32px rgba(13,40,24,0.14),
            0 32px 80px rgba(13,40,24,0.22);
          overflow:hidden;
          animation:_im_panIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
        }
        ._im_hd {
          flex-shrink:0;
          padding:20px 26px 16px;
          background:var(--surf,#F5F2EC);
          border-bottom:1px solid var(--rule,rgba(13,40,24,0.08));
          border-radius:20px 20px 0 0;
        }
        ._im_body {
          flex:1; overflow-y:auto; padding:22px 26px;
          scrollbar-width:thin; scrollbar-color:var(--surf2) transparent;
          -webkit-overflow-scrolling: touch;
        }
        ._im_body::-webkit-scrollbar{width:5px}
        ._im_body::-webkit-scrollbar-thumb{background:var(--surf2);border-radius:99px}
        ._im_ft {
          flex-shrink:0;
          padding:14px 26px;
          background:var(--surf,#F5F2EC);
          border-top:1px solid var(--rule,rgba(13,40,24,0.08));
          border-radius:0 0 20px 20px;
          display:flex; justify-content:space-between; align-items:center;
          gap:10px;
        }
        ._im_back {
          all:unset; cursor:pointer; display:inline-flex; align-items:center; gap:6px;
          margin-bottom:10px;
          font-family:'Inconsolata',monospace; font-size:10.5px;
          text-transform:uppercase; letter-spacing:0.10em; color:var(--ink3);
          transition:color 0.15s;
        }
        ._im_back:hover{color:var(--accent)}
        ._im_x {
          all:unset; cursor:pointer; width:32px; height:32px; flex-shrink:0;
          border-radius:9px; border:1px solid var(--rule);
          display:flex; align-items:center; justify-content:center;
          color:var(--ink3); transition:background 0.15s,color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        ._im_x:hover{background:var(--surf2);color:var(--ink)}
        ._im_chip {
          display:inline-flex; align-items:center; gap:5px;
          background:rgba(13,40,24,0.06); border-radius:6px;
          padding:3px 9px;
          font-family:'Inconsolata',monospace; font-size:11px; color:var(--ink2);
          white-space:nowrap;
        }
        ._im_type_pill {
          display:inline-flex; align-items:center; gap:4px;
          border-radius:6px; padding:3px 9px;
          font-family:'Inconsolata',monospace; font-size:11px; font-weight:700;
          white-space:nowrap;
        }
        ._im_type_pill[data-type="product"] {
          background:var(--amber-soft,rgba(180,83,9,0.10));
          color:var(--amber,#b45309);
        }
        ._im_type_pill[data-type="patent"] {
          background:var(--acc-soft);
          color:var(--accent);
        }
        ._im_icard {
          background:var(--bg); border-radius:12px;
          border:1px solid var(--rule); padding:14px 18px;
        }
        ._im_ilabel {
          font-family:'Inconsolata',monospace; font-size:9.5px;
          text-transform:uppercase; letter-spacing:0.12em;
          color:var(--ink3); margin-bottom:6px;
        }
        ._im_ival {
          font-size:15px; font-weight:700; color:var(--ink); line-height:1.3;
        }
        ._im_sechd {
          display:flex; align-items:center; gap:10px; margin-bottom:14px;
        }
        ._im_secico {
          width:28px; height:28px; border-radius:7px;
          background:var(--acc-soft);
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        ._im_visit {
          all:unset; cursor:pointer;
          display:inline-flex; align-items:center; gap:8px;
          background:var(--deep,#0D2818); color:#FAFAF7;
          font-family:'Jost',sans-serif; font-size:13px; font-weight:600;
          padding:9px 20px; border-radius:9px;
          transition:background 0.18s,transform 0.18s;
          -webkit-tap-highlight-color: transparent;
        }
        ._im_visit:hover:not([disabled]){background:#1b4229;transform:translateY(-1px)}
        ._im_visit[disabled]{background:var(--surf2);color:var(--ink3);cursor:not-allowed}
        ._im_btnclose {
          all:unset; cursor:pointer;
          display:inline-flex; align-items:center; gap:7px;
          font-family:'Jost',sans-serif; font-size:13px; font-weight:500;
          padding:8px 20px; border-radius:9px;
          border:1.5px solid var(--rule); color:var(--ink2);
          transition:background 0.15s,border-color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        ._im_btnclose:hover{background:var(--bg);border-color:rgba(13,40,24,0.22);color:var(--ink)}
        ._im_btnexp {
          all:unset; cursor:pointer;
          display:inline-flex; align-items:center; gap:7px;
          font-family:'Jost',sans-serif; font-size:13px; font-weight:600;
          padding:8px 22px; border-radius:9px;
          background:var(--accent,#2E7D32); color:#fff;
          transition:background 0.18s,transform 0.18s,box-shadow 0.18s;
          -webkit-tap-highlight-color: transparent;
        }
        ._im_btnexp:hover{background:#256427;transform:translateY(-1px);box-shadow:0 4px 16px rgba(46,125,50,0.28)}
        ._im_tbl{width:100%;border-collapse:collapse}
        ._im_tbl th{
          padding:10px 14px; text-align:left;
          font-family:'Inconsolata',monospace; font-size:9.5px;
          text-transform:uppercase; letter-spacing:0.10em;
          color:var(--ink3); font-weight:600;
          background:rgba(13,40,24,0.04);
          border-bottom:1px solid var(--rule);
          white-space:nowrap;
        }
        ._im_tbl td{
          padding:13px 14px; vertical-align:top;
          font-size:12.5px; color:var(--ink2); line-height:1.65;
          border-bottom:1px solid var(--rule2);
          transition:background 0.12s;
        }
        ._im_tbl tbody tr:nth-child(even) td{background:var(--surf)}
        ._im_tbl tbody tr:hover td{background:var(--acc-soft)!important}
        ._im_sc{
          display:inline-block; padding:3px 9px; border-radius:6px;
          font-family:'Inconsolata',monospace; font-size:12px; font-weight:700;
        }
        ._im_sc_h{background:var(--red-soft);   color:var(--red)}
        ._im_sc_m{background:var(--amber-soft); color:var(--amber)}
        ._im_sc_l{background:var(--acc-soft);   color:var(--accent)}
        ._im_spin{
          width:34px;height:34px;border-radius:50%;
          border:3px solid var(--rule2);border-top-color:var(--accent);
          animation:_im_spin 0.9s linear infinite;margin:0 auto 12px;
        }
        ._im_justification {
          margin-top:6px;
          padding:6px 10px;
          border-left:2px solid var(--amber,#b45309);
          background:var(--amber-soft,rgba(180,83,9,0.06));
          border-radius:0 6px 6px 0;
          font-size:11.5px;
          color:var(--amber,#b45309);
          font-style:italic;
          line-height:1.5;
        }
        ._im_info_grid {
          display:grid; grid-template-columns:1fr 1fr;
          gap:10px; margin-bottom:14px;
        }
        ._im_chips {
          display:flex; flex-wrap:wrap; gap:7px; align-items:center;
        }
        ._im_title {
          font-size:clamp(15px,1.8vw,21px);
          font-weight:700; color:var(--deep);
          letter-spacing:-0.02em; line-height:1.25; margin:0 0 10px;
          word-break:break-word;
        }

        /* ════ TABLET ════ */
        @media (max-width:1023px) {
          ._im_panel { width:min(95vw,820px); max-height:90vh; }
          ._im_hd  { padding:16px 20px 14px; }
          ._im_body{ padding:18px 20px; }
          ._im_ft  { padding:12px 20px; }
        }

        /* ════ MOBILE — bottom sheet ════ */
        @media (max-width:767px) {
          ._im_panel {
            top:auto; bottom:0; left:0; right:0; transform:none;
            width:100%; max-height:92vh;
            border-radius:20px 20px 0 0; border-bottom:none;
            animation:_im_panInMobile 0.32s cubic-bezier(0.22,1,0.36,1) both;
          }
          ._im_hd  { padding:14px 16px 12px; border-radius:20px 20px 0 0; }
          ._im_body{ padding:16px 16px; }
          ._im_ft  { padding:12px 16px; gap:8px; flex-direction:row; border-radius:0; }
          ._im_btnclose { flex:1; justify-content:center; padding:10px 14px; }
          ._im_btnexp   { flex:1; justify-content:center; padding:10px 14px; }
          ._im_title    { font-size:16px !important; }
          ._im_back     { font-size:10px; margin-bottom:8px; }
          ._im_info_grid{ grid-template-columns:1fr 1fr; gap:8px; }
          ._im_ival     { font-size:13px; }
          ._im_chips    { overflow-x:auto; flex-wrap:nowrap; -webkit-overflow-scrolling:touch; padding-bottom:2px; }
          ._im_tbl th   { font-size:9px; padding:8px 10px; }
          ._im_tbl td   { font-size:12px; padding:10px 10px; }
          ._im_overlap_score { font-size:18px !important; }
          ._im_visit    { width:100%; justify-content:center; padding:10px 18px; box-sizing:border-box; }
        }

        /* ════ SMALL MOBILE ════ */
        @media (max-width:480px) {
          ._im_panel  { max-height:95vh; }
          ._im_hd     { padding:12px 14px 10px; }
          ._im_body   { padding:14px 14px; }
          ._im_ft     { padding:10px 14px; flex-direction:column; }
          ._im_btnclose{ width:100%; }
          ._im_btnexp  { width:100%; }
          ._im_info_grid{ grid-template-columns:1fr; gap:6px; }
          ._im_icard  { padding:10px 14px; }
          ._im_ival   { font-size:12px; }
          ._im_title  { font-size:14px !important; }
          ._im_sechd  { gap:8px; margin-bottom:10px; }
          ._im_overlap_score{ font-size:16px !important; }
          ._im_tbl th { padding:7px 8px; font-size:8.5px; }
          ._im_tbl td { padding:9px 8px; font-size:11.5px; }
        }

        /* ════ TINY ════ */
        @media (max-width:360px) {
          ._im_hd  { padding:10px 12px 8px; }
          ._im_body{ padding:12px 12px; }
          ._im_ft  { padding:8px 12px; }
          ._im_chip{ font-size:9.5px; padding:2px 7px; }
          ._im_back{ font-size:9px; }
          ._im_tbl th{ font-size:8px; padding:6px 7px; }
          ._im_tbl td{ font-size:11px; padding:8px 7px; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="_im_bd" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className="_im_panel"
        role="dialog"
        aria-modal="true"
        aria-label="Infringement Details"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="_im_hd">
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <button className="_im_back" onClick={onClose}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Case Details
              </button>

              <h1 className="_im_title" style={{ fontFamily:"'Libre Baskerville',serif" }}>
                {title}
              </h1>

              <div className="_im_chips">
                {/* Type pill — PATENT or PRODUCT */}
                <span
                  className="_im_type_pill"
                  data-type={isProduct ? 'product' : 'patent'}
                >
                  {isProduct ? '🛒 Product' : '📄 Patent'}
                </span>

                <span className="_im_chip">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                  Case: {caseLabel}
                </span>

                <span className="_im_chip">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                  {isProduct ? `Product: ${entryId}` : `Patent: ${entryId}`}
                </span>

                <span style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  background:riskBg, color:riskColor,
                  fontFamily:"'Inconsolata',monospace", fontSize:10, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.10em',
                  padding:'3px 9px', borderRadius:5, whiteSpace:'nowrap',
                }}>
                  <span style={{ width:5,height:5,borderRadius:'50%',background:'currentColor',flexShrink:0 }} />
                  {riskLevel} risk · {scoreNum}%
                </span>
              </div>
            </div>

            <button className="_im_x" onClick={onClose} aria-label="Close">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="_im_body">

          {/* Same-patent warning (patent type only) */}
          {sameAsPatent && !isProduct && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:10,
              background:'var(--amber-soft)',
              border:'1px solid rgba(180,83,9,0.22)',
              borderRadius:10, padding:'11px 15px', marginBottom:18,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p style={{ fontSize:13, color:'var(--amber)', fontWeight:500, margin:0, lineHeight:1.55 }}>
                Note: This infringement might be the same patent, but filed on a different database.
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              background:'var(--red-soft)', border:'1px solid rgba(185,28,28,0.20)',
              borderRadius:10, padding:'11px 15px', marginBottom:18,
              fontSize:13, color:'var(--red)',
            }}>
              {error}
            </div>
          )}

          {/* Spinner */}
          {loading && (
            <div style={{ textAlign:'center', padding:'44px 0' }}>
              <div className="_im_spin" />
              <p style={{ fontSize:13, color:'var(--ink3)' }}>Loading infringement details…</p>
            </div>
          )}

          {!loading && (
            <>
              {/* ── Info section header ── */}
              <div className="_im_sechd">
                <div className="_im_secico">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--ink3)', marginBottom:1 }}>
                    {isProduct ? 'Product Record' : 'Patent Record'}
                  </div>
                  <div style={{ fontSize:14.5, fontWeight:700, color:'var(--ink)' }}>
                    {isProduct ? 'Product Infringement Information' : 'Patent Infringement Information'}
                  </div>
                </div>
              </div>

              {/* Source + ID cards */}
              <div className="_im_info_grid">
                <div className="_im_icard">
                  <div className="_im_ilabel">Source</div>
                  <div className="_im_ival">{source}</div>
                </div>
                <div className="_im_icard">
                  <div className="_im_ilabel">{isProduct ? 'Product ID' : 'Entry ID'}</div>
                  <div className="_im_ival" style={{ fontFamily:"'Inconsolata',monospace", wordBreak:'break-all' }}>{entryId}</div>
                </div>
              </div>

              {/* Product claims preview (product type only) */}
              {isProduct && productClaims.length > 0 && (
                <div style={{
                  background:'var(--surf)', borderRadius:12,
                  border:'1px solid var(--rule)', padding:'14px 18px', marginBottom:14,
                }}>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--ink3)', marginBottom:10 }}>
                    Product Claims
                  </div>
                  {productClaims.map((c, i) => (
                    <p key={i} style={{
                      fontSize:13, color:'var(--ink2)', lineHeight:1.65, margin:0,
                      paddingBottom: i < productClaims.length - 1 ? 8 : 0,
                      borderBottom: i < productClaims.length - 1 ? '1px solid var(--rule2)' : 'none',
                      marginBottom: i < productClaims.length - 1 ? 8 : 0,
                    }}>
                      {c}
                    </p>
                  ))}
                </div>
              )}

              {/* Overlap score bar */}
              <div style={{
                background:'var(--surf)', borderRadius:12,
                border:'1px solid var(--rule)',
                padding:'14px 18px', marginBottom:14,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, gap:8 }}>
                  <span style={{ fontFamily:"'Inconsolata',monospace", fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--ink3)' }}>Overlap Score</span>
                  <span className="_im_overlap_score" style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, fontWeight:700, color:riskColor }}>{scoreNum}%</span>
                </div>
                <div style={{ height:5, background:'rgba(13,40,24,0.08)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${scoreNum}%`, background:riskColor, borderRadius:3, transition:'width 0.7s cubic-bezier(0.22,1,0.36,1)' }} />
                </div>
              </div>

              {/* Visit source button */}
              <div style={{ marginBottom:26 }}>
                <button
                  className="_im_visit"
                  onClick={() => entryUrl && window.open(entryUrl, '_blank')}
                  disabled={!entryUrl}
                >
                  <ExternalLink size={14} />
                  {isProduct ? 'Visit Product Listing' : 'Visit Infringement Source'}
                </button>
              </div>

              {/* ── Claim Chart section header ── */}
              <div className="_im_sechd">
                <div className="_im_secico">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--ink3)', marginBottom:1 }}>Side-by-Side</div>
                  <div style={{ fontSize:14.5, fontWeight:700, color:'var(--ink)' }}>Infringement Claim Chart</div>
                </div>
              </div>

              <div style={{ background:'var(--surf)', borderRadius:12, border:'1px solid var(--rule)', overflow:'hidden' }}>
                <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                  <table className="_im_tbl" style={{ minWidth: isProduct ? 560 : 480 }}>
                    <thead>
                      <tr>
                        <th style={{ width:68 }}>Claim #</th>
                        <th style={{ width:'30%' }}>{isProduct ? 'Product Claim' : 'Your Patent Claim'}</th>
                        <th>Similar Infringing Claim</th>
                        <th style={{ width:112 }}>Similarity</th>
                        {/* Justification column — product only */}
                        {isProduct && <th style={{ width:'22%' }}>Justification</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {claimRows.length > 0 ? (
                        claimRows.map((row, i) => {
                          const sc  = row.similarityScore !== null ? getSimilarityScoreClass(row.similarityScore) : null;
                          const cls = sc === 'high' ? '_im_sc_h' : sc === 'medium' ? '_im_sc_m' : '_im_sc_l';
                          return (
                            <tr key={i}>
                              <td>
                                <span style={{ fontFamily:"'Libre Baskerville',serif", fontSize:16, fontWeight:700, color:'var(--accent)' }}>
                                  {row.claimNumber}
                                </span>
                              </td>
                              <td>{row.yourClaim}</td>
                              <td>
                                {row.similarClaim ? (
                                  <>
                                    <p style={{ margin:'0 0 7px' }}>{row.similarClaim}</p>
                                    {row.urlToClaim && (
                                      <a
                                        href={row.urlToClaim}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize:11, color:'var(--accent)', display:'inline-flex', alignItems:'center', gap:3, fontFamily:"'Inconsolata',monospace", textDecoration:'none' }}
                                      >
                                        View source →
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <span style={{ color:'var(--ink3)', fontSize:12 }}>No similar claim found</span>
                                )}
                              </td>
                              <td>
                                {row.similarityScore !== null ? (
                                  <span className={`_im_sc ${cls}`}>
                                    {formatSimilarityScore(row.similarityScore)}
                                  </span>
                                ) : (
                                  <span style={{ color:'var(--ink3)', fontSize:12 }}>—</span>
                                )}
                              </td>
                              {/* Justification cell — product only */}
                              {isProduct && (
                                <td>
                                  {row.justification ? (
                                    <div className="_im_justification">
                                      {row.justification}
                                    </div>
                                  ) : (
                                    <span style={{ color:'var(--ink3)', fontSize:12 }}>—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={isProduct ? 5 : 4} style={{ textAlign:'center', padding:'36px 14px', color:'var(--ink3)', fontFamily:"'Inconsolata',monospace", fontSize:12 }}>
                            No claim data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="_im_ft">
          <button className="_im_btnclose" onClick={onClose}>Close</button>
          <button className="_im_btnexp">
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};

export default InfringementModal;