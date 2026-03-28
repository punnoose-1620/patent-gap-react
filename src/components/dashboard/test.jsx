import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addPatent } from '../../store/slices/patentSlice';
import { patentApi } from '../../api/patentApi';

const FILING_DATE_MIN = '1950-01-01';

const CURRENT_STATUS_OPTIONS = [
  'Aborted', 'Patented', 'Expired', 'Payment Pending',
  'Rejected', 'Withdrawn', 'Processing'
];

function formatLocalDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Step 1: Upload Patent ────────────────────────────────────────────────────

const UploadPatentStep = ({ onClose, onContinue }) => {
  const [activeTab, setActiveTab]               = useState('upload');
  const [projectName, setProjectName]           = useState('');
  //const [projectDescription, setProjectDescription] = useState('');
  const [projectKeywords, setProjectKeywords]   = useState('');
  const [filingDate, setFilingDate]             = useState('');
  const [currentStatus, setCurrentStatus]       = useState('Processing');
  const [inventors, setInventors]               = useState('');
  const [patentNumber, setPatentNumber]         = useState('');
  const [selectedFile, setSelectedFile]         = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');

  const filingDateMax = formatLocalDateInputValue(new Date());

  const isValid =
    projectName.trim() &&
    (activeTab === 'upload' ? !!selectedFile : patentNumber.trim());

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File size exceeds 50 MB'); return; }
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File size exceeds 50 MB'); return; }
    if (!file.type.includes('pdf')) { alert('Please upload a PDF file'); return; }
    setSelectedFile(file);
  };

  const handleContinue = async () => {
    setError('');
    setLoading(true);
    try {
      if (activeTab === 'patentId') {
        const data = await patentApi.fetchFromUspto(patentNumber.trim());
        if (!data.success) throw new Error(data.message || 'USPTO fetch failed');
        let caseDetails = data.case_data;
        const desc = caseDetails.description || '';
        const status = caseDetails.status || '';
        if (desc === status || desc.split(' ').length < 10) {
          try {
            const summaryData = await patentApi.generateDescription(data.case_id);
            if (summaryData.summary) caseDetails.description = summaryData.summary;
          } catch (e) {
            console.warn('Summary generation failed, continuing anyway', e);
          }
        }
        onContinue({ projectName, activeTab, patentNumber, caseDetails, caseId: data.case_id });
      } else {
        //onContinue({ projectName, activeTab, file: selectedFile, caseDetails: null, caseId: null });
        onContinue({ projectName, activeTab, file, caseDetails: null, caseId: null,
            inventors: inventors.trim(),
            keywords: projectKeywords.trim(),
            filingDate,
            currentStatus,
          })
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch patent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) onClose();
  };

  return (
    <>
      {/* Header */}
      <div className="pm-header">
        <div className="pm-header-left">
          <div className="pm-icon">📄</div>
          <div>
            <h2 className="pm-title">New Patent Analysis</h2>
            <p className="pm-subtitle">Step 1 of 2 — Upload Patent</p>
          </div>
        </div>
        <button onClick={handleCancel} className="pm-close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Step indicator */}
      <div className="pm-steps">
        <div className="pm-step active">
          <div className="pm-step-dot">1</div>
          <span>Upload</span>
        </div>
        <div className="pm-step-line" />
        <div className="pm-step">
          <div className="pm-step-dot">2</div>
          <span>Context</span>
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="pm-body">

        {/* Project Name */}
        <div className="pm-field">
          <label className="pm-label">Project Name <span className="pm-required">*</span></label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g., Foldable Display Hinge Analysis"
            className="pm-input"
          />
        </div>

        {/* Tabs */}
        <div className="pm-tabs">
          {['upload', 'patentId'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pm-tab${activeTab === tab ? ' active' : ''}`}
            >
              <span>{tab === 'upload' ? '📤' : '📄'}</span>
              {tab === 'upload' ? 'Upload File' : 'Patent ID'}
            </button>
          ))}
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            <label
              htmlFor="file-upload"
              className="pm-dropzone"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="pm-dropzone-icon">📤</div>
              <p className="pm-dropzone-title">Click to upload or drag and drop</p>
              <p className="pm-dropzone-sub">PDF or Patent Portfolio · Max 50 MB</p>
              <input id="file-upload" type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>

            {selectedFile && (
              <div className="pm-file-pill">
                <span>📄</span>
                <div>
                  <p className="pm-file-name">{selectedFile.name}</p>
                  <p className="pm-file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button className="pm-file-remove" onClick={() => setSelectedFile(null)}>×</button>
              </div>
            )}

            {/*<div className="pm-field" style={{ marginTop: 16 }}>
              <label className="pm-label">Project Description</label>
              <input
                type="text"
                value={projectDescription}
                onChange={e => setProjectDescription(e.target.value)}
                placeholder="Describe the project for infringement context"
                className="pm-input"
              />
            </div>
            */}

            <div className="pm-field">
              <label className="pm-label">Keywords</label>
              <input
                type="text"
                value={projectKeywords}
                onChange={e => setProjectKeywords(e.target.value)}
                placeholder="e.g., AI, Machine Learning, Neural Networks"
                className="pm-input"
              />
            </div>

            <div className="pm-row">
              <div className="pm-field">
                <label className="pm-label" htmlFor="filing-date">Filing Date</label>
                <input
                  id="filing-date"
                  type="date"
                  min={FILING_DATE_MIN}
                  max={filingDateMax}
                  value={filingDate}
                  onChange={e => setFilingDate(e.target.value)}
                  className="pm-input"
                />
              </div>
              <div className="pm-field">
                <label className="pm-label" htmlFor="current-status">Status</label>
                <select
                  id="current-status"
                  value={currentStatus}
                  onChange={e => setCurrentStatus(e.target.value)}
                  className="pm-input pm-select"
                >
                  {CURRENT_STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pm-field">
              <label className="pm-label">Inventors</label>
              <input
                type="text"
                value={inventors}
                onChange={e => setInventors(e.target.value)}
                placeholder="e.g., Jane Doe, John Smith"
                className="pm-input"
              />
            </div>
          </div>
        )}

        {/* Patent ID Tab */}
        {activeTab === 'patentId' && (
          <div>
            <div className="pm-field">
              <label className="pm-label">Patent Number <span className="pm-required">*</span></label>
              <input
                type="text"
                value={patentNumber}
                onChange={e => setPatentNumber(e.target.value)}
                placeholder="e.g., US10203040B2"
                className="pm-input pm-mono"
              />
              <p className="pm-hint">We'll automatically fetch patent details from USPTO</p>
            </div>

            <div className="pm-formats">
              <div className="pm-formats-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Supported Formats
              </div>
              <div className="pm-formats-grid">
                {[
                  { label: 'US Granted', examples: 'US10203040B2, US-10203040-B2' },
                  { label: 'US Pre-grant', examples: 'US20240412550A1' },
                  { label: 'EP Patents', examples: 'EP1234567, EP-1234567-A1' },
                  { label: 'WO Patents', examples: 'WO2023123456' },
                ].map(f => (
                  <div key={f.label} className="pm-format-item">
                    <span className="pm-format-label">{f.label}</span>
                    <span className="pm-format-ex">{f.examples}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="pm-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pm-footer">
        <button onClick={handleCancel} className="pm-btn-ghost">Cancel</button>
        <button
          onClick={handleContinue}
          disabled={!isValid || loading}
          className="pm-btn-primary"
        >
          {loading ? (
            <>
              <span className="pm-spinner" />
              Fetching from USPTO...
            </>
          ) : (
            <>
              Continue
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </>
  );
};

// ─── Step 2: Add Context ──────────────────────────────────────────────────────

const AddContextStep = ({ step1Data, onBack, onClose, onSuccess }) => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  const [context, setContext]             = useState(step1Data?.caseDetails?.description || '');
  const [loading, setLoading]             = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError]                 = useState('');

  const isUspto = step1Data?.caseDetails?._id?.includes('uspto');

  const handleBack = () => {
    if (window.confirm('Are you sure you want to go back? Your progress will be lost.')) onBack();
  };

  const handleStartAnalysis = async () => {
    setError('');
    setLoading(true);
    try {
      let caseId = step1Data.caseId;

      if (!caseId) {
        const caseDetails = {
          ...(step1Data.caseDetails || {}),
          title: step1Data.projectName,
          description: context,
        };
        console.log("Start Analysis data",caseDetails);
        const created = await patentApi.createPatent(caseDetails);
        caseId = created.case_id;
        if (created.case_data) dispatch(addPatent(created.case_data));
      } else {
        if (context !== step1Data.caseDetails?.description) {
          await patentApi.updateCase(caseId, { description: context }).catch(() => {});
        }
      }

      setLoadingStatus('claims');
      const claims = await patentApi.getClaims(caseId);

      setLoadingStatus('infringement');
      const analysisData = await patentApi.getInfringementAnalysis(caseId);
      const infringements = analysisData.similar_infringements || [];

      if (infringements.length > 0) {
        await patentApi.updateCase(caseId, { infringements, claims });
      }

      onSuccess?.();
      navigate(`/patent-detail?id=${caseId}`);
    } catch (err) {
      setError(err?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="pm-header">
        <div className="pm-header-left">
          <div className="pm-icon" style={isUspto ? { background: '#003661', padding: 0, overflow: 'hidden' } : {}}>
            {isUspto
              ? <img src="/images/uspto.jpg" alt="USPTO" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🔍'}
          </div>
          <div>
            <h2 className="pm-title">New Patent Analysis</h2>
            <p className="pm-subtitle">Step 2 of 2 — Add Context</p>
          </div>
        </div>
        <button
          onClick={() => { if (window.confirm('Cancel? Progress will be lost.')) onClose(); }}
          className="pm-close" aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Step indicator */}
      <div className="pm-steps">
        <div className="pm-step done">
          <div className="pm-step-dot">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span>Upload</span>
        </div>
        <div className="pm-step-line active" />
        <div className="pm-step active">
          <div className="pm-step-dot">2</div>
          <span>Context</span>
        </div>
      </div>

      {/* Body */}
      <div className="pm-body">

        {/* Context banner */}
        <div className="pm-banner">
          <div className="pm-banner-ico">💬</div>
          <div>
            <h3 className="pm-banner-title">Put the Armor on the Warrior</h3>
            <p className="pm-banner-desc">
              Help our AI understand your patent better. Provide context about core novelty,
              defensive goals, or specific technical elements to focus on.
            </p>
          </div>
        </div>

        {/* Patent reference */}
        <div className="pm-field">
          <label className="pm-label">Patent Reference</label>
          <div className="pm-readonly">
            {step1Data?.caseDetails?._id || step1Data?.patentNumber || step1Data?.file?.name || '—'}
          </div>
        </div>

        {/* Context textarea */}
        <div className="pm-field">
          <label className="pm-label">Context Description</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            rows={5}
            placeholder={`Focus on the specific hinge mechanism for foldable displays.\nThe novelty lies in the dual-axis rotation system with friction reduction coating.\nLook for material overlaps in competing devices in smartphone and tablet markets.`}
            className="pm-input pm-textarea"
          />
          <p className="pm-hint">Be specific about technical details, target markets, and key differentiators</p>
        </div>

        {/* AI refinement */}
        <div className="pm-ai-questions">
          <div className="pm-ai-title">
            <span className="pm-ai-badge">AI</span>
            Refinement Questions
          </div>
          <div className="pm-ai-list">
            {[
              'Should we also analyze specific material compositions?',
              'Are there particular jurisdictions you\'re concerned about?',
            ].map((q, i) => (
              <div key={i} className="pm-ai-q">
                <span className="pm-ai-q-label">Q{i + 1}</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="pm-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pm-footer">
        <button onClick={handleBack} disabled={loading} className="pm-btn-ghost">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </button>
        <button onClick={handleStartAnalysis} disabled={loading} className="pm-btn-primary">
          {loading ? (
            <>
              <span className="pm-spinner" />
              {loadingStatus === 'claims'       ? 'Isolating Claims...'      :
               loadingStatus === 'infringement' ? 'Finding Infringements...' :
               'Processing...'}
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Analysis
            </>
          )}
        </button>
      </div>
    </>
  );
};

// ─── Main Modal Shell ─────────────────────────────────────────────────────────

const ProjectModal = ({ isOpen, onClose }) => {
  const [step, setStep]           = useState(1);
  const [step1Data, setStep1Data] = useState(null);

  useEffect(() => {
    if (isOpen) { setStep(1); setStep1Data(null); }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStep1Continue = (data) => { setStep1Data(data); setStep(2); };
  const handleClose = () => { setStep(1); setStep1Data(null); onClose(); };

  return (
    <div className="pm-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="pm-shell">
        {step === 1 && <UploadPatentStep onClose={handleClose} onContinue={handleStep1Continue} />}
        {step === 2 && <AddContextStep step1Data={step1Data} onBack={() => setStep(1)} onClose={handleClose} onSuccess={handleClose} />}
      </div>

      <style>{`
        /* ── Overlay ── */
        .pm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(13, 40, 24, 0.60);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
        }

        /* ── Modal shell ── */
        .pm-shell {
          background: var(--bg, #FAFAF7);
          border: 1px solid var(--rule, rgba(13,40,24,0.10));
          border-radius: 18px;
          box-shadow: 0 24px 80px rgba(13,40,24,0.22), 0 4px 16px rgba(13,40,24,0.10);
          width: 100%;
          max-width: 560px;
          /* KEY FIX: never taller than viewport minus padding */
          max-height: calc(100vh - 32px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: pmSlideUp 0.32s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes pmSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* ── Header ── */
        .pm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--rule, rgba(13,40,24,0.08));
          flex-shrink: 0;
          background: var(--bg, #FAFAF7);
        }

        .pm-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pm-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(46,125,50,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          border: 1px solid rgba(46,125,50,0.18);
        }

        .pm-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--deep, #0D2818);
          margin: 0;
          line-height: 1.2;
        }

        .pm-subtitle {
          font-family: 'Inconsolata', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          color: var(--accent, #2E7D32);
          margin: 3px 0 0;
        }

        .pm-close {
          all: unset;
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink3, #5a6b5e);
          transition: background 0.14s, color 0.14s;
          flex-shrink: 0;
        }
        .pm-close:hover { background: rgba(13,40,24,0.07); color: var(--deep, #0D2818); }

        /* ── Step indicator ── */
        .pm-steps {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          gap: 8px;
          border-bottom: 1px solid var(--rule, rgba(13,40,24,0.06));
          flex-shrink: 0;
          background: var(--surf, #F5F2EC);
        }

        .pm-step {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--ink3, #5a6b5e);
        }
        .pm-step.active { color: var(--accent, #2E7D32); font-weight: 600; }
        .pm-step.done   { color: var(--accent, #2E7D32); }

        .pm-step-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          font-weight: 700;
          border: 1.5px solid var(--rule, rgba(13,40,24,0.15));
          color: var(--ink3);
          background: transparent;
        }
        .pm-step.active .pm-step-dot {
          background: var(--accent, #2E7D32);
          border-color: var(--accent, #2E7D32);
          color: #fff;
        }
        .pm-step.done .pm-step-dot {
          background: var(--accent, #2E7D32);
          border-color: var(--accent, #2E7D32);
          color: #fff;
        }

        .pm-step-line {
          flex: 1;
          height: 1.5px;
          background: var(--rule, rgba(13,40,24,0.12));
          border-radius: 2px;
        }
        .pm-step-line.active {
          background: var(--accent, #2E7D32);
        }

        /* ── Body — the only scrollable region ── */
        .pm-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
          /* custom scrollbar */
          scrollbar-width: thin;
          scrollbar-color: rgba(46,125,50,0.25) transparent;
        }
        .pm-body::-webkit-scrollbar { width: 4px; }
        .pm-body::-webkit-scrollbar-thumb { background: rgba(46,125,50,0.25); border-radius: 4px; }

        /* ── Footer ── */
        .pm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-top: 1px solid var(--rule, rgba(13,40,24,0.08));
          flex-shrink: 0;
          background: var(--bg, #FAFAF7);
          gap: 10px;
        }

        /* ── Form fields ── */
        .pm-field {
          margin-bottom: 14px;
        }

        .pm-label {
          display: block;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink2, #2a3d2e);
          margin-bottom: 6px;
          letter-spacing: 0.01em;
        }

        .pm-required {
          color: var(--accent, #2E7D32);
          margin-left: 2px;
        }

        .pm-input {
          width: 100%;
          border: 1.5px solid var(--rule, rgba(13,40,24,0.14));
          border-radius: 9px;
          padding: 9px 13px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          color: var(--deep, #0D2818);
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
          box-sizing: border-box;
        }
        .pm-input:focus {
          border-color: var(--accent, #2E7D32);
          box-shadow: 0 0 0 3px rgba(46,125,50,0.10);
        }
        .pm-input::placeholder { color: var(--ink3, #9aaa9e); }

        .pm-mono  { font-family: 'Inconsolata', monospace; font-size: 14px; }
        .pm-select { cursor: pointer; appearance: auto; }

        .pm-textarea {
          resize: vertical;
          min-height: 110px;
          line-height: 1.6;
        }

        .pm-hint {
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          color: var(--ink3, #9aaa9e);
          margin-top: 5px;
        }

        .pm-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ── Tabs ── */
        .pm-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: var(--surf, #F5F2EC);
          border: 1px solid var(--rule, rgba(13,40,24,0.08));
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 16px;
        }

        .pm-tab {
          all: unset;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 7px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink3, #5a6b5e);
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .pm-tab.active {
          background: var(--bg, #FAFAF7);
          color: var(--deep, #0D2818);
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(13,40,24,0.10);
        }
        .pm-tab:not(.active):hover { color: var(--ink, #1a2e1e); }

        /* ── Dropzone ── */
        .pm-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed rgba(46,125,50,0.28);
          border-radius: 12px;
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 14px;
          background: rgba(46,125,50,0.025);
        }
        .pm-dropzone:hover {
          border-color: var(--accent, #2E7D32);
          background: rgba(46,125,50,0.055);
        }

        .pm-dropzone-icon { font-size: 36px; margin-bottom: 8px; }
        .pm-dropzone-title {
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink, #1a2e1e);
          margin-bottom: 4px;
        }
        .pm-dropzone-sub {
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          color: var(--ink3, #9aaa9e);
        }

        /* ── File pill ── */
        .pm-file-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(46,125,50,0.07);
          border: 1px solid rgba(46,125,50,0.20);
          border-radius: 9px;
          margin-bottom: 14px;
        }
        .pm-file-name {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--deep, #0D2818);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        .pm-file-size {
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          color: var(--ink3);
          margin: 0;
        }
        .pm-file-remove {
          all: unset;
          cursor: pointer;
          margin-left: auto;
          font-size: 18px;
          line-height: 1;
          color: var(--ink3);
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          transition: background 0.13s, color 0.13s;
        }
        .pm-file-remove:hover { background: rgba(185,28,28,0.10); color: #b91c1c; }

        /* ── Formats box ── */
        .pm-formats {
          background: var(--surf, #F5F2EC);
          border: 1px solid var(--rule, rgba(13,40,24,0.09));
          border-radius: 10px;
          padding: 14px 16px;
          margin-top: 4px;
        }

        .pm-formats-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inconsolata', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          color: var(--ink3);
          margin-bottom: 10px;
        }

        .pm-formats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .pm-format-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pm-format-label {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--ink2, #2a3d2e);
        }

        .pm-format-ex {
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          color: var(--ink3);
        }

        /* ── Context banner ── */
        .pm-banner {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          background: linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(46,125,50,0.04) 100%);
          border: 1px solid rgba(46,125,50,0.18);
          border-left: 3px solid var(--accent, #2E7D32);
          border-radius: 0 10px 10px 0;
          padding: 14px 16px;
          margin-bottom: 16px;
        }

        .pm-banner-ico { font-size: 22px; flex-shrink: 0; margin-top: 1px; }

        .pm-banner-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--deep, #0D2818);
          margin: 0 0 5px;
        }

        .pm-banner-desc {
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          color: var(--ink2, #2a3d2e);
          line-height: 1.6;
          margin: 0;
        }

        /* ── Readonly field ── */
        .pm-readonly {
          width: 100%;
          border: 1.5px solid var(--rule, rgba(13,40,24,0.10));
          border-radius: 9px;
          padding: 9px 13px;
          font-family: 'Inconsolata', monospace;
          font-size: 13px;
          color: var(--ink2, #2a3d2e);
          background: var(--surf, #F5F2EC);
          box-sizing: border-box;
        }

        /* ── AI questions ── */
        .pm-ai-questions {
          background: rgba(255, 193, 7, 0.06);
          border: 1px solid rgba(255, 193, 7, 0.25);
          border-radius: 10px;
          padding: 14px 16px;
          margin-top: 4px;
        }

        .pm-ai-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink, #1a2e1e);
          margin-bottom: 10px;
        }

        .pm-ai-badge {
          font-family: 'Inconsolata', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          background: rgba(255,193,7,0.25);
          color: #7a5c00;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .pm-ai-list { display: flex; flex-direction: column; gap: 8px; }

        .pm-ai-q {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-family: 'Jost', sans-serif;
          font-size: 12.5px;
          color: var(--ink2, #2a3d2e);
          line-height: 1.5;
        }

        .pm-ai-q-label {
          font-family: 'Inconsolata', monospace;
          font-size: 10px;
          font-weight: 700;
          color: #7a5c00;
          background: rgba(255,193,7,0.20);
          padding: 2px 6px;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── Error ── */
        .pm-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          background: rgba(185,28,28,0.05);
          border: 1px solid rgba(185,28,28,0.18);
          border-left: 3px solid #b91c1c;
          border-radius: 0 8px 8px 0;
          padding: 11px 14px;
          margin-top: 14px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: #b91c1c;
          line-height: 1.55;
        }

        /* ── Buttons ── */
        .pm-btn-primary {
          all: unset;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 22px;
          background: var(--accent, #2E7D32);
          color: #fff;
          border-radius: 9px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
          box-shadow: 0 2px 10px rgba(46,125,50,0.25);
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }
        .pm-btn-primary:hover:not(:disabled) {
          background: #256427;
          box-shadow: 0 4px 16px rgba(46,125,50,0.30);
        }
        .pm-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .pm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .pm-btn-ghost {
          all: unset;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 9px;
          font-family: 'Jost', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--ink2, #2a3d2e);
          border: 1.5px solid var(--rule, rgba(13,40,24,0.14));
          transition: background 0.14s, border-color 0.14s;
          -webkit-tap-highlight-color: transparent;
        }
        .pm-btn-ghost:hover:not(:disabled) {
          background: var(--surf, #F5F2EC);
          border-color: rgba(13,40,24,0.22);
        }
        .pm-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Spinner ── */
        .pm-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.30);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pmSpin 0.75s linear infinite;
          flex-shrink: 0;
        }

        @keyframes pmSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ══════════════
           RESPONSIVE
        ══════════════ */
        @media (max-width: 599px) {
          .pm-overlay { padding: 0; align-items: flex-end; }
          .pm-shell {
            max-width: 100%;
            max-height: 96vh;
            border-radius: 20px 20px 0 0;
            animation: pmSlideUpMobile 0.32s cubic-bezier(0.22,1,0.36,1) both;
          }
          @keyframes pmSlideUpMobile {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .pm-header { padding: 16px 18px 14px; }
          .pm-title  { font-size: 15px; }
          .pm-body   { padding: 16px 18px; }
          .pm-footer { padding: 12px 18px; }
          .pm-row    { grid-template-columns: 1fr; }
          .pm-formats-grid { grid-template-columns: 1fr; }
          .pm-btn-primary  { flex: 1; justify-content: center; }
          .pm-btn-ghost    { padding: 9px 12px; }
          .pm-dropzone     { padding: 20px 16px; }
          .pm-dropzone-icon { font-size: 28px; }
        }

        @media (max-width: 400px) {
          .pm-title    { font-size: 14px; }
          .pm-subtitle { font-size: 9px; }
          .pm-icon     { width: 34px; height: 34px; font-size: 16px; }
          .pm-steps    { padding: 10px 16px; }
          .pm-step     { font-size: 11px; }
        }
      `}</style>
    </div>
  );
};

export default ProjectModal;
