import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addPatent } from '../../store/slices/patentSlice';
import { patentApi } from '../../api/patentApi';

// ─── Step 1: Upload Patent ────────────────────────────────────────────────────

const UploadPatentStep = ({ onClose, onContinue }) => {
  const [activeTab, setActiveTab]     = useState('upload');   // 'upload' | 'patentId'
  const [projectName, setProjectName] = useState('');
  const [patentNumber, setPatentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

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
        // ✅ Matches HTML fetchCasefromUspto() + generatePatentSummary()
        const data = await patentApi.fetchFromUspto(patentNumber.trim());
        if (!data.success) throw new Error(data.message || 'USPTO fetch failed');

        let caseDetails = data.case_data;

        // Generate summary if description is too short (matches HTML logic)
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
        // File upload path — pass file through to step 2
        onContinue({ projectName, activeTab, file: selectedFile, caseDetails: null, caseId: null });
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch patent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      onClose();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#191970]/10 flex items-center justify-center text-xl">📄</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Patent Analysis</h2>
            <p className="text-sm text-gray-500">Step 1: Upload Patent</p>
          </div>
        </div>
        <button onClick={handleCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">✕</button>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* Security banner */}
        <div className="flex items-start gap-3 p-4 mb-6 bg-[#191970]/5 border border-[#191970]/20 rounded-lg">
          <span className="text-xl mt-0.5">🛡️</span>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Secure Upload</h4>
            <p className="text-xs text-gray-500">ISO/SOC2 Compliant. Your data is encrypted and secure.</p>
          </div>
        </div>

        {/* Project Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g., Foldable Display Hinge Analysis"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#191970] focus:ring-2 focus:ring-[#191970]/10 transition-all"
          />
        </div>

        {/* Tabs */}
        <div>
          <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            {['upload', 'patentId'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
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
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-[#191970] hover:bg-[#191970]/5 transition-all"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              >
                <span className="text-6xl text-gray-400 mb-4">📤</span>
                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PDF or Patent Portfolio (Max 50MB)</p>
                <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              </label>
              {selectedFile && (
                <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
                  <span>📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patent ID Tab */}
          {activeTab === 'patentId' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter Patent Number</label>
                <input
                  type="text"
                  value={patentNumber}
                  onChange={e => setPatentNumber(e.target.value)}
                  placeholder="e.g., US10203040"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#191970] focus:ring-2 focus:ring-[#191970]/10 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">We'll automatically fetch patent details from USPTO</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Supported Formats:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• US Patents: US10203040, US-10203040-B2</p>
                  <p>• EP Patents: EP1234567, EP-1234567-A1</p>
                  <p>• WO Patents: WO2023123456, WO-2023/123456</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200">
        <button onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button
          onClick={handleContinue}
          disabled={!isValid || loading}
          className="px-6 py-2.5 bg-[#191970] text-white text-sm font-medium rounded-lg hover:bg-[#191970]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Fetching Patent from USPTO...
            </>
          ) : 'Continue'}
        </button>
      </div>
    </>
  );
};

// ─── Step 2: Add Context ──────────────────────────────────────────────────────

const AddContextStep = ({ step1Data, onBack, onClose, onSuccess }) => {
  const navigate   = useNavigate();
  const dispatch   = useDispatch();

  const [context, setContext]       = useState(step1Data?.caseDetails?.description || '');
  const [loading, setLoading]       = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(''); // 'claims' | 'infringement' | ''
  const [error, setError]           = useState('');

  const isUspto = step1Data?.caseDetails?._id?.includes('uspto');

  const handleBack = () => {
    if (window.confirm('Are you sure you want to go back? Your progress will be lost.')) {
      onBack();
    }
  };

  const handleStartAnalysis = async () => {
    setError('');
    setLoading(true);
    try {
      let caseId = step1Data.caseId;

      // ✅ Matches HTML initAddContextPopup() → fetch /api/create-patent
      if (!caseId) {
        const caseDetails = {
          ...(step1Data.caseDetails || {}),
          title: step1Data.projectName,
          description: context,
        };
        const created = await patentApi.createPatent(caseDetails);
        caseId = created.case_id;
        if (created.case_data) dispatch(addPatent(created.case_data));
      } else {
        // Update context description if changed
        if (context !== step1Data.caseDetails?.description) {
          await patentApi.updateCase(caseId, { description: context }).catch(() => {});
        }
      }

      // ✅ Matches HTML beginSimilarityAnalysis() — Step 1: Claims
      setLoadingStatus('claims');
      const claims = await patentApi.getClaims(caseId);

      // ✅ Step 2: Infringement analysis
      setLoadingStatus('infringement');
      const analysisData = await patentApi.getInfringementAnalysis(caseId);
      const infringements = analysisData.similar_infringements || [];

      // ✅ Step 3: Persist infringements
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
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl overflow-hidden"
            style={{ background: isUspto ? '#003661' : 'rgba(25,25,112,0.1)' }}
          >
            {isUspto
              ? <img src="/images/uspto.jpg" alt="USPTO" className="w-8 h-8 rounded object-cover" />
              : '📄'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Patent Analysis</h2>
            <p className="text-sm text-gray-500">Step 2: Add Context</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) onClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >✕</button>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* Context banner */}
        <div className="bg-gradient-to-br from-[#191970]/10 to-[#191970]/5 border border-[#191970]/20 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">💬</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Put the Armor on the Warrior</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Help our AI understand your patent better. Provide context about the core novelty,
                defensive goals, or specific technical elements you want to focus on.
              </p>
            </div>
          </div>
        </div>

        {/* Patent display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Patent</label>
          <div className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-sm text-gray-700 font-mono">
            {step1Data?.caseDetails?._id || step1Data?.patentNumber || step1Data?.file?.name || '—'}
          </div>
        </div>

        {/* Context textarea */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Context Description</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            rows={6}
            placeholder={`Example:\nFocus on the specific hinge mechanism for foldable displays.\nThe novelty lies in the dual-axis rotation system with friction reduction coating.\nWe should look for material overlaps in competing devices, particularly in the smartphone and tablet markets.`}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-[#191970] focus:ring-2 focus:ring-[#191970]/10 transition-all resize-y"
          />
          <p className="text-xs text-gray-500 mt-2">Be specific about technical details, target markets, and key differentiators</p>
        </div>

        {/* AI refinement questions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-800 mb-3">AI Refinement Questions</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="font-medium text-gray-700 shrink-0">Q:</span>
              <span>Should we also analyze specific material compositions?</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-700 shrink-0">Q:</span>
              <span>Are there particular jurisdictions you're concerned about?</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleStartAnalysis}
          disabled={loading}
          className="px-6 py-2.5 bg-[#191970] text-white text-sm font-medium rounded-lg hover:bg-[#191970]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {loadingStatus === 'claims'       ? 'Isolating Claims...'      :
               loadingStatus === 'infringement' ? 'Finding Infringements...' :
               'Processing...'}
            </>
          ) : 'Start Analysis'}
        </button>
      </div>
    </>
  );
};

// ─── Main Modal Shell ─────────────────────────────────────────────────────────

const ProjectModal = ({ isOpen, onClose }) => {
  const [step, setStep]           = useState(1);  // 1 | 2
  const [step1Data, setStep1Data] = useState(null);

  // Reset to step 1 whenever modal opens
  useEffect(() => {
    if (isOpen) { setStep(1); setStep1Data(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStep1Continue = (data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setStep1Data(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-[slideUp_0.3s_ease]">
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {step === 1 && (
          <UploadPatentStep
            onClose={handleClose}
            onContinue={handleStep1Continue}
          />
        )}

        {step === 2 && (
          <AddContextStep
            step1Data={step1Data}
            onBack={() => setStep(1)}
            onClose={handleClose}
            onSuccess={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectModal;
