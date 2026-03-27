// ===========================
// FILE: DocumentModal.jsx
// Modal for viewing patent documents inline.
// Matches the PatentDetailPage design system (CSS vars, Inconsolata, Libre Baskerville, etc.)
// ===========================

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Download, ExternalLink, FileText, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────
const getFileExtension = (url = '') => url.split('.').pop().toLowerCase().split('?')[0];

const getFileType = (url = '') => {
  const ext = getFileExtension(url);
  if (ext === 'pdf')  return 'pdf';
  if (['xml', 'txt', 'html', 'htm', 'json'].includes(ext)) return 'text';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'unknown';
};

const formatFileSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// ─── PDF Viewer ───────────────────────────────────────────────
const PdfViewer = ({ objectUrl, fileName }) => {
  const [page,     setPage]     = useState(1);
  const [zoom,     setZoom]     = useState(1);
  const [rotate,   setRotate]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const iframeRef = useRef(null);

  const zoomIn  = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const rotateCw = () => setRotate(r => (r + 90) % 360);

  return (
    <div className="dm-pdf-wrap">
      {/* PDF toolbar */}
      <div className="dm-pdf-toolbar">
        <div className="dm-pdf-toolbar-left">
          <span className="dm-mono dm-filename">{fileName}</span>
        </div>
        <div className="dm-pdf-controls">
          <button className="dm-ctrl-btn" onClick={zoomOut}  title="Zoom out"><ZoomOut  size={13} /></button>
          <span   className="dm-mono dm-zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="dm-ctrl-btn" onClick={zoomIn}   title="Zoom in"><ZoomIn   size={13} /></button>
          <div    className="dm-vsep" />
          <button className="dm-ctrl-btn" onClick={rotateCw} title="Rotate"><RotateCw size={13} /></button>
        </div>
      </div>

      {/* PDF frame */}
      <div className="dm-pdf-frame-wrap" style={{ overflow: 'auto', flex: 1 }}>
        {loading && (
          <div className="dm-center-msg">
            <div className="dm-spinner" />
            <span className="dm-mono dm-muted">Loading document…</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={objectUrl}
          title={fileName}
          onLoad={() => setLoading(false)}
          style={{
            width:     `${100 * zoom}%`,
            minWidth:  '100%',
            height:    '100%',
            border:    'none',
            transform: `rotate(${rotate}deg)`,
            transformOrigin: 'top center',
            display:   loading ? 'none' : 'block',
            transition: 'transform 0.25s ease',
          }}
        />
      </div>
    </div>
  );
};

// ─── Text / XML Viewer ────────────────────────────────────────
const TextViewer = ({ content, fileName }) => {
  const ext = getFileExtension(fileName);

  return (
    <div className="dm-text-wrap">
      <div className="dm-text-header">
        <span className="dm-mono dm-filename">{fileName}</span>
        <span className="dm-ext-badge">.{ext}</span>
      </div>
      <pre className="dm-text-content">
        <code>{content}</code>
      </pre>
    </div>
  );
};

// ─── Image Viewer ─────────────────────────────────────────────
const ImageViewer = ({ objectUrl, fileName }) => {
  const [zoom,   setZoom]   = useState(1);
  const [rotate, setRotate] = useState(0);

  return (
    <div className="dm-img-wrap">
      <div className="dm-pdf-toolbar">
        <span className="dm-mono dm-filename">{fileName}</span>
        <div className="dm-pdf-controls">
          <button className="dm-ctrl-btn" onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} title="Zoom out"><ZoomOut  size={13} /></button>
          <span   className="dm-mono dm-zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="dm-ctrl-btn" onClick={() => setZoom(z => Math.min(z + 0.25, 4))}    title="Zoom in"><ZoomIn   size={13} /></button>
          <div    className="dm-vsep" />
          <button className="dm-ctrl-btn" onClick={() => setRotate(r => (r + 90) % 360)} title="Rotate"><RotateCw size={13} /></button>
        </div>
      </div>
      <div className="dm-img-frame">
        <img
          src={objectUrl}
          alt={fileName}
          style={{
            transform: `scale(${zoom}) rotate(${rotate}deg)`,
            transition: 'transform 0.25s ease',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};

// ─── Unsupported / Unknown file type ─────────────────────────
const UnknownViewer = ({ fileName, objectUrl, onDownload }) => (
  <div className="dm-center-msg dm-unknown-wrap">
    <div className="dm-unknown-icon">
      <FileText size={44} color="var(--accent)" strokeWidth={1.2} />
    </div>
    <p className="dm-unknown-name">{fileName}</p>
    <p className="dm-mono dm-muted" style={{ marginBottom: 20 }}>
      Preview not available for this file type.
    </p>
    <button className="btn-new" onClick={onDownload}>
      <Download size={14} /> Download File
    </button>
  </div>
);

// ─── Main DocumentModal ───────────────────────────────────────
/**
 * Props:
 *   document   – { url, source, title? }  (the doc object from caseData.documents[i])
 *   index      – number (0-based doc index)
 *   total      – number (total docs in case)
 *   onClose    – () => void
 *   onNext     – () => void  (navigate to next doc)
 *   onPrev     – () => void  (navigate to prev doc)
 *   fetchBlob  – async (url) => Blob  (the patentApi.proxyDocument call)
 */
const DocumentModal = ({ document, index, total, onClose, onNext, onPrev, fetchBlob }) => {
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [objectUrl,  setObjectUrl]  = useState(null);
  const [textContent,setTextContent]= useState(null);
  const [fileSize,   setFileSize]   = useState(null);

  const url      = document?.url      || '';
  const fileName = url.split('/').pop() || `document-${index + 1}`;
  const fileType = getFileType(url);
  const ext      = getFileExtension(url);

  // ── Fetch the doc blob on mount / when doc changes ──
  useEffect(() => {
    if (!url) return;
    let alive    = true;
    let blobUrl  = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      setObjectUrl(null);
      setTextContent(null);
      setFileSize(null);

      try {
        const blob = await fetchBlob(url);
        if (!alive) return;

        setFileSize(blob.size);

        if (fileType === 'text') {
          const text = await blob.text();
          if (alive) setTextContent(text);
        } else {
          const mimeMap = { pdf: 'application/pdf', image: blob.type || 'image/png' };
          const mime    = mimeMap[fileType] || blob.type || 'application/octet-stream';
          blobUrl       = URL.createObjectURL(new Blob([blob], { type: mime }));
          if (alive) setObjectUrl(blobUrl);
        }
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load document.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url, fileType, fetchBlob]);

  // ── Keyboard navigation ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') onNext?.();
      if (e.key === 'ArrowLeft')  onPrev?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev]);

  // ── Trap focus inside modal ──
  const modalRef = useRef(null);
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  // ── Download handler ──
  const handleDownload = () => {
    if (!objectUrl && !textContent) return;
    const a    = window.document.createElement('a');
    a.href     = objectUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(textContent)}`;
    a.download = fileName;
    a.click();
  };

  // ── Open in new tab ──
  const handleOpenExternal = () => {
    if (objectUrl) window.open(objectUrl, '_blank');
  };

  // ── Render the appropriate viewer ──
  const renderViewer = () => {
    if (loading) {
      return (
        <div className="dm-center-msg">
          <div className="dm-spinner" />
          <span className="dm-mono dm-muted">Loading document…</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dm-center-msg">
          <div className="dm-error-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="dm-mono dm-muted" style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>
          <button className="btn-export" onClick={() => window.open(url, '_blank')}>
            <ExternalLink size={13} /> Open Original URL
          </button>
        </div>
      );
    }

    if (fileType === 'pdf'   && objectUrl)   return <PdfViewer   objectUrl={objectUrl}  fileName={fileName} />;
    if (fileType === 'image' && objectUrl)   return <ImageViewer objectUrl={objectUrl}  fileName={fileName} />;
    if (fileType === 'text'  && textContent) return <TextViewer  content={textContent}  fileName={fileName} />;
    return <UnknownViewer fileName={fileName} objectUrl={objectUrl} onDownload={handleDownload} />;
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div className="dm-backdrop" onClick={onClose} aria-hidden="true" />

      {/* ── Modal shell ── */}
      <div
        className="dm-shell"
        role="dialog"
        aria-modal="true"
        aria-label={`Document viewer: ${fileName}`}
        ref={modalRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Modal header ── */}
        <header className="dm-header">
          <div className="dm-header-left">
            {/* Doc type badge */}
            <span className="dm-ext-badge dm-ext-badge--lg">.{ext}</span>

            <div className="dm-header-meta">
              <span className="dm-header-title">{fileName}</span>
              <div className="dm-header-sub">
                {document?.source && (
                  <span className="dm-mono dm-muted">
                    Source: {document.source === 'uspto' ? 'US Patent Office' : document.source}
                  </span>
                )}
                {fileSize && <span className="dm-mono dm-muted">{formatFileSize(fileSize)}</span>}
                <span className="dm-mono dm-muted">
                  Doc {index + 1} of {total}
                </span>
              </div>
            </div>
          </div>

          <div className="dm-header-right">
            {/* Download */}
            {(objectUrl || textContent) && (
              <button className="dm-action-btn" onClick={handleDownload} title="Download">
                <Download size={14} />
                <span className="dm-action-label">Download</span>
              </button>
            )}

            {/* Open in new tab */}
            {objectUrl && fileType !== 'pdf' && (
              <button className="dm-action-btn" onClick={handleOpenExternal} title="Open in new tab">
                <ExternalLink size={14} />
                <span className="dm-action-label">New Tab</span>
              </button>
            )}

            {/* Close */}
            <button className="dm-close-btn" onClick={onClose} title="Close (Esc)" aria-label="Close document viewer">
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ── Viewer body ── */}
        <div className="dm-body">
          {renderViewer()}
        </div>

        {/* ── Footer navigation ── */}
        {total > 1 && (
          <footer className="dm-footer">
            <button
              className="dm-nav-btn"
              onClick={onPrev}
              disabled={index === 0}
              title="Previous document (←)"
            >
              <ChevronLeft size={14} />
              <span className="dm-action-label">Previous</span>
            </button>

            {/* Pagination dots */}
            <div className="dm-page-dots">
              {Array.from({ length: total }, (_, i) => (
                <div
                  key={i}
                  className={`dm-page-dot ${i === index ? 'active' : ''}`}
                  title={`Document ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="dm-nav-btn"
              onClick={onNext}
              disabled={index === total - 1}
              title="Next document (→)"
            >
              <span className="dm-action-label">Next</span>
              <ChevronRight size={14} />
            </button>
          </footer>
        )}
      </div>

      <style>{`
        /* ── Backdrop ── */
        .dm-backdrop {
          position: fixed; inset: 0;
          background: rgba(10, 10, 8, 0.62);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 1100;
          animation: dm-fade-in 0.18s ease;
        }

        /* ── Shell ── */
        .dm-shell {
          position: fixed;
          inset: 0;
          margin: auto;
          top: 5vh; left: 50%; right: auto; bottom: 5vh;
          transform: translateX(-50%);
          width: min(92vw, 1040px);
          max-height: 90vh;
          background: var(--surf, #fafaf7);
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow:
            0 32px 80px rgba(0,0,0,0.22),
            0 8px 24px rgba(0,0,0,0.14),
            inset 0 1px 0 rgba(255,255,255,0.8);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1101;
          outline: none;
          animation: dm-slide-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dm-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dm-slide-in {
          from { opacity: 0; transform: translateX(-50%) translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
        }

        /* ── Header ── */
        .dm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--rule2, rgba(0,0,0,0.07));
          background: var(--surf2, rgba(248,248,244,0.9));
          flex-shrink: 0;
        }
        .dm-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .dm-header-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .dm-header-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink, #1a1a16);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dm-header-sub {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .dm-header-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        /* ── Extension badge ── */
        .dm-ext-badge {
          font-family: 'Inconsolata', monospace;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          padding: 2px 7px;
          border-radius: 4px;
          background: var(--acc-soft, rgba(34,197,94,0.10));
          color: var(--accent, #16a34a);
          border: 1px solid var(--acc-border, rgba(34,197,94,0.20));
          flex-shrink: 0;
        }
        .dm-ext-badge--lg {
          font-size: 11px;
          padding: 3px 9px;
        }

        /* ── Action buttons ── */
        .dm-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          border-radius: 6px;
          border: 1px solid var(--rule2, rgba(0,0,0,0.10));
          background: transparent;
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--ink3, #8a8a78);
          cursor: pointer;
          transition: all 0.15s;
        }
        .dm-action-btn:hover {
          background: var(--surf2, rgba(248,248,244,0.9));
          border-color: var(--accent, #16a34a);
          color: var(--accent, #16a34a);
        }

        /* ── Close button ── */
        .dm-close-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          border-radius: 7px;
          border: 1px solid var(--rule2, rgba(0,0,0,0.10));
          background: transparent;
          color: var(--ink3, #8a8a78);
          cursor: pointer;
          transition: all 0.15s;
          margin-left: 4px;
        }
        .dm-close-btn:hover {
          background: var(--red-soft, rgba(185,28,28,0.08));
          border-color: rgba(185,28,28,0.22);
          color: var(--red, #b91c1c);
        }

        /* ── Body ── */
        .dm-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: var(--bg, #f5f5f0);
          min-height: 0;
        }

        /* ── PDF viewer ── */
        .dm-pdf-wrap {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .dm-pdf-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: var(--surf2, rgba(248,248,244,0.9));
          border-bottom: 1px solid var(--rule2, rgba(0,0,0,0.07));
          gap: 12px;
          flex-shrink: 0;
        }
        .dm-pdf-toolbar-left { min-width: 0; flex: 1; }
        .dm-pdf-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .dm-pdf-frame-wrap {
          flex: 1;
          overflow: auto;
          min-height: 0;
        }

        /* ── Image viewer ── */
        .dm-img-wrap {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .dm-img-frame {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          padding: 24px;
        }

        /* ── Text viewer ── */
        .dm-text-wrap {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .dm-text-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: var(--surf2, rgba(248,248,244,0.9));
          border-bottom: 1px solid var(--rule2, rgba(0,0,0,0.07));
          flex-shrink: 0;
        }
        .dm-text-content {
          flex: 1;
          overflow: auto;
          margin: 0;
          padding: 20px 24px;
          font-family: 'Inconsolata', monospace;
          font-size: 12.5px;
          line-height: 1.75;
          color: var(--ink2, #3a3a30);
          background: var(--bg, #f5f5f0);
          white-space: pre-wrap;
          word-break: break-word;
          tab-size: 2;
        }

        /* ── Control button (zoom / rotate) ── */
        .dm-ctrl-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px; height: 28px;
          border-radius: 5px;
          border: 1px solid var(--rule2, rgba(0,0,0,0.10));
          background: transparent;
          color: var(--ink3, #8a8a78);
          cursor: pointer;
          transition: all 0.15s;
        }
        .dm-ctrl-btn:hover {
          background: var(--acc-soft, rgba(34,197,94,0.10));
          border-color: var(--accent, #16a34a);
          color: var(--accent, #16a34a);
        }

        /* ── Shared utility ── */
        .dm-mono {
          font-family: 'Inconsolata', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .dm-muted   { color: var(--ink3, #8a8a78); }
        .dm-filename {
          font-size: 11px;
          color: var(--ink2, #3a3a30);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
          display: block;
        }
        .dm-zoom-label {
          font-size: 11px;
          color: var(--ink3, #8a8a78);
          min-width: 38px;
          text-align: center;
        }
        .dm-vsep {
          width: 1px;
          height: 16px;
          background: var(--rule2, rgba(0,0,0,0.10));
          margin: 0 2px;
        }

        /* ── Centered message (loading / error / unknown) ── */
        .dm-center-msg {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex: 1;
          padding: 40px 24px;
          text-align: center;
        }
        .dm-unknown-wrap { gap: 8px; }
        .dm-unknown-icon {
          width: 72px; height: 72px;
          border-radius: 16px;
          background: var(--acc-soft, rgba(34,197,94,0.10));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
        }
        .dm-unknown-name {
          font-size: 14px; font-weight: 600;
          color: var(--ink, #1a1a16);
          margin: 0;
        }
        .dm-error-icon { margin-bottom: 4px; }

        /* ── Spinner ── */
        .dm-spinner {
          width: 34px; height: 34px;
          border: 3px solid var(--rule2, rgba(0,0,0,0.10));
          border-top-color: var(--accent, #16a34a);
          border-radius: 50%;
          animation: dm-spin 0.85s linear infinite;
        }
        @keyframes dm-spin { to { transform: rotate(360deg); } }

        /* ── Footer navigation ── */
        .dm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          border-top: 1px solid var(--rule2, rgba(0,0,0,0.07));
          background: var(--surf2, rgba(248,248,244,0.9));
          flex-shrink: 0;
          gap: 12px;
        }
        .dm-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--rule2, rgba(0,0,0,0.10));
          background: transparent;
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--ink3, #8a8a78);
          cursor: pointer;
          transition: all 0.15s;
        }
        .dm-nav-btn:hover:not(:disabled) {
          background: var(--surf, #fafaf7);
          border-color: var(--accent, #16a34a);
          color: var(--accent, #16a34a);
        }
        .dm-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ── Pagination dots ── */
        .dm-page-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dm-page-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--rule2, rgba(0,0,0,0.15));
          transition: all 0.2s;
          cursor: default;
        }
        .dm-page-dot.active {
          background: var(--accent, #16a34a);
          width: 18px;
          border-radius: 3px;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .dm-shell {
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%;
            max-height: 100%;
            border-radius: 0;
            transform: none;
          }
          .dm-action-label { display: none; }
          .dm-filename { max-width: 140px; }
          .dm-header-sub { gap: 6px; }
        }
      `}</style>
    </>
  );
};

export default DocumentModal;
