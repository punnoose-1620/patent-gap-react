// ===========================
// FILE: PatentDetailPage.jsx
// Fully responsive — mobile (320px+), tablet (768px+), desktop (1024px+)
// ===========================

import { Clock, ArrowLeft, FileText, Calendar, User, Tag, Download, Trash2, RefreshCw, Search } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../hooks/useStore';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import InfringementModal from '../../components/dashboard/InfringementModal';
import DocumentModal from '../../components/dashboard/DocumentModal';    // ← NEW
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import MatchCard from '../../components/dashboard/MatchCard';
import { patentApi, normalizeChartRowsToMap } from '../../api/patentApi';
import { deletePatent, updatePatent } from '../../store/slices/patentSlice';
import SearchLimitationEditor from '../../components/dashboard/SearchLimitationEditor';
import NotificationBell from '../../components/dashboard/NotificationBell';
import ClaimsMatrix from '../../components/dashboard/ClaimsMatrix';
import ContextEditor from '../../components/dashboard/ContextEditor';
import ClaimsEditor from '../../components/dashboard/ClaimsEditor';
import EditableInventorsRow from '../../components/dashboard/EditableInventorsRow';
import EditableTitleRow from '../../components/dashboard/EditableTitleRow';

import {
  isAnalysisCompleted,
  isAnalysisFailed,
  isAnalysisInFlight,
  isAnalysisUnknown,
  isAnalysisTerminal,
  getAnalysisProgressMessage,
  isAnalysisPartial,
} from '../../utils/infringementAnalysisStatus';

import InfringementAnalysisStatus from '../../components/dashboard/InfringementAnalysisStatus';



const getStatusShorthand = (status) => {
  status = String(status || '');
  if (status.includes('Expired'))   return 'Expired';
  if (status.includes('Patented'))  return 'Patented';
  if (status.includes('Abandoned')) return 'Abandoned';
  if (status.includes('-')) return status.split('-')[0];
  if (status.includes('_')) return status.split('_')[0];
  return status;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown';
  const diffInSeconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diffInSeconds < 60)     return 'Just now';
  if (diffInSeconds < 3600)   return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)  return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
};

const selectMainColor = (score) => {
  if (score >= 0.9) return '#B22222';
  if (score >= 0.7) return '#FFA500';
  return '#2E7D32';
};

const getRiskTerm = (score) => {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
};

/*const calculateOverallRisk = (similarClaims = []) => {
  if (!similarClaims?.length) return 'low';
  const avg = similarClaims.reduce((sum, c) => sum + c.similarity_score, 0) / similarClaims.length;
  return getRiskTerm(avg);
};

const calculateOverlapScore = (similarClaims = []) => {
  if (!similarClaims?.length) return 0;
  const avg = similarClaims.reduce((sum, c) => sum + c.similarity_score, 0) / similarClaims.length;
  return Math.round(avg * 100 * 100) / 100;
};*/
// AFTER — mirrors InfringementModal exactly
const calculateOverlapScore = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return 0;

  const scores = items
    .map((item) =>
      item?.calculated_similarity_score ?? item?.similarity_score ?? null
    )
    .filter((s) => s !== null && !isNaN(s));

  if (scores.length === 0) return 0;

  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(average * 100);
};

const calculateOverallRisk = (items = []) => {
  const score = calculateOverlapScore(items) / 100;
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
};
/*const calculateOverlapScore = (items = []) => {
  console.log('Calculating overlap score for items:', items);
  if (!Array.isArray(items) || items.length === 0) return 0;

  const hasCalculatedScore = items.some(
    (item) => item?.calculated_similarity_score !== undefined && item?.calculated_similarity_score !== null
  );
  console.log('Has calculated_similarity_score?', hasCalculatedScore);

  if (hasCalculatedScore) {
    console.log('🔍 Calculating overlap score using calculated_similarity_score for items:', items);
    // New format: use calculated_similarity_score
    const scores = items
      .map((item) => item?.calculated_similarity_score ?? item?.similarity_score ?? null)
      .filter((s) => s !== null && !isNaN(s));
    if (scores.length === 0) return 0;
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round(average * 100);
  } else {
    console.log('🔍 Calculating overlap score using similarity_score for items:', items);
    // Old format: use similarity_score only
    const avg = items.reduce((sum, c) => sum + (c.similarity_score || 0), 0) / items.length;
    return Math.round(avg * 100 * 100) / 100;
  }
};

const calculateOverallRisk = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return 'low';

  const hasCalculatedScore = items.some(
    (item) => item?.calculated_similarity_score !== undefined && item?.calculated_similarity_score !== null
  );

  if (hasCalculatedScore) {
    const score = calculateOverlapScore(items) / 100;
    if (score >= 0.9) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  } else {
    console.log('🔍 Calculating overall risk using similarity_score for items:', items);
    const avg = items.reduce((sum, c) => sum + (c.similarity_score || 0), 0) / items.length;
    return getRiskTerm(avg);
  }
};*/
// to format the source field by making it more human-readable (e.g. "uspto_bulk_import" → "US Patent Office Bulk Import")
const formatStatus = (str) => {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getSourceName = (id = '') => {
  if (id.includes('uspto'))     return 'US Patent Office';
  if (id.includes('google'))    return 'Google';
  if (id.includes('espacenet')) return 'Espacenet';
  if (id.includes('local')) return 'Manual Entry';
  if (id.includes('freepatentsonline')) return 'Free Patents Online';
  return 'Patent Gap';
};

/** True when /infringement-chart should run (legacy or not yet embedding-scored). */
const needsInfringementChartApi = (caseInfringements) => {
  // No infringements → no chart needed at all
  if (!Array.isArray(caseInfringements) || caseInfringements.length === 0) {
    return false;

  }
  // Look inside the first infringement's nested infringements[]
  const nested = caseInfringements[0]?.infringements;
  // If there are no nested infringements → old format, needs API
  if (!Array.isArray(nested) || nested.length === 0) {
    return true;
  }
  // If the nested rows DON'T have calculated_similarity_score → old format, needs API
  return !('calculated_similarity_score' in nested[0]);
};

const flattenInfringementScoreRows = (caseInfringements) =>
  (caseInfringements || []).flatMap((entry) =>
    Array.isArray(entry?.infringements) ? entry.infringements : []
  );

const buildClaimsChartFromStoredRows = (caseInfringements, parentClaims = []) =>
  normalizeChartRowsToMap(flattenInfringementScoreRows(caseInfringements), parentClaims);

// ─────────────────────────────────────────────────────────────
// Normalise a raw infringement object into a consistent shape
// regardless of whether it came from the patent or product format.
//
// Patent format  → has entry_id, entry_title, entry_url
// Product format → has product_id, product_name, product_url
// ─────────────────────────────────────────────────────────────
// AFTER — mirrors InfringementModal's normaliseInfringement exactly,
// plus keeps the extra fields PatentDetailPage needs (badge, company, matchedClaims, _entryId)
const normaliseMatch = (m) => {
  if (!m) return null;

  // ── Nested-case format: has case_id + infringements[] with calculated_similarity_score ──
  if (m.case_id && Array.isArray(m.infringements)) {
    console.log('entered 1');
    return {
      type:          'patent',
      title:         m.entry_title || m.title || `Case ${m.case_id}`,
      id:            m.case_id,
      url:           m.document_urls?.[0] || m.entry_url || null,
      source:        m.source || 'unknown',
      score:         calculateOverlapScore(m.infringements),
      badge:         calculateOverallRisk(m.infringements),
      riskLevel:     calculateOverallRisk(m.infringements),
      similarClaims: m.infringements,
      claims:        m.infringements.map(i => i.claim).filter(Boolean),
      company:       null,
      matchedClaims: m.infringements.map(i => i.claim).filter(Boolean),
      sameAsPatent:  m.same_as_patent || false,
      _isNestedCase: true,
      _entryId:      m.case_id,
    };
  }

  // ── Product format: has product_id ──
  if (m.product_id) {
    console.log('entered 2');
    return {
      type:          'product',
      title:         m.product_name || 'Untitled Product',
      id:            m.product_id   || 'N/A',
      url:           m.product_url  || null,
      source:        m.source       || 'unknown',
      score:         calculateOverlapScore(m.similar_claims),
      badge:         calculateOverallRisk(m.similar_claims),
      riskLevel:     calculateOverallRisk(m.similar_claims),
      similarClaims: m.similar_claims  || [],
      claims:        m.claims || m.similar_claims?.map(c => c.claim).filter(Boolean) || [],
      company:       null,
      matchedClaims: m.similar_claims?.map(c => c.claim) || null,
      _entryId:      m.product_id,
    };
  }
 console.log('entered 3');
  // ── Standard patent format: has entry_id / entry_title ──
  return {
    type:          'patent',
    title:         m.entry_title || m.title || 'Untitled',
    id:            m.entry_id   || m.patent || m.case_id || 'N/A',
    url:           m.document_urls?.[0] || m.documents?.[0]?.url || m.entry_url || m.url || null,
    source:        m.source || m.documents?.[0]?.source || 'unknown',
    score:         calculateOverlapScore(m.similar_claims),
    badge:         calculateOverallRisk(m.similar_claims),
    riskLevel:     calculateOverallRisk(m.similar_claims),
    similarClaims: m.similar_claims || [],
    claims: Array.isArray(m.claims) && m.claims.length > 0
        ? m.claims
        : m.similar_claims?.map(c => c.claim).filter(Boolean) ?? [],
    company:       m.company || null,
    matchedClaims: m.similar_claims?.map(c => c.claim) || null,
    sameAsPatent:  m.same_as_patent || false,
    _entryId:      m.entry_id || m.patent || m.case_id,
  };
};
// ─────────────────────────────────────────────────────────────
// Derive a human-readable label for an in-progress analysis status
// ─────────────────────────────────────────────────────────────
const getAnalysisStatusLabel = (status) => {
  return getAnalysisProgressMessage(status).title;
};

const StatusPill = ({ status }) => {
  const s   = String(status || '').toLowerCase();
  const cls = s === 'expired' ? 'expired' : s === 'abandoned' ? 'abandoned' : 'patented';
  return (
    <span className={`pd-badge ${cls}`}>
      <span className="pd-badge-dot" />
      {status || 'Patented'}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="pd-info-row">
    <div className="pd-info-label-wrap">
      <Icon size={13} color="var(--ink3)" style={{ flexShrink: 0 }} />
      <span className="pd-info-label">{label}</span>
    </div>
    <span className="pd-info-value">{value}</span>
  </div>
);



const SectionCard = ({ title, eyebrow, icon: Icon, children, actions }) => (
  <div style={{ marginBottom: 20 }}>
    <div className="sec-hd" style={{ marginBottom: 12 }}>
      <div className="sec-hd-left">
        <div className="sec-ico">
          {Icon && <Icon size={16} color="var(--accent)" strokeWidth={1.5} />}
        </div>
        <div>
          {eyebrow && (
            <div className="sec-eye">
              <div className="live-dot" />
              {eyebrow}
            </div>
          )}
          <div className="sec-title">{title}</div>
        </div>
      </div>
      {actions && <div className="sec-hd-right">{actions}</div>}
    </div>
    <div className="pd-card-body">{children}</div>
  </div>
);




const PatentDetailPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [matchesExpanded, setMatchesExpanded] = useState(true); // collapsed by default
  const [claimsExpanded, setClaimsExpanded] = useState(true); // collapsed by default

  const [matchTypeFilter, setMatchTypeFilter] = useState('product'); // default: product

  const caseIdFromUrl = searchParams.get('id');
  const projectData   = location.state || {};
  const caseId        = caseIdFromUrl || projectData.id;

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef   = useRef();
  
  const { patents } = useStore();

  
  const handleAddDocument = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          setUploadingDoc(true);
          const result = await patentApi.uploadFileToCase(caseId, file);
          if (result) { // ← guard: only add if upload actually returned data
            setCaseData(prev => ({
              ...prev,
              documents: [...(prev?.documents || []), result],
            }));
          }
        } catch (err) {
          alert(`Upload failed: ${err?.message || 'Unknown error'}`);
        } finally {
          setUploadingDoc(false);
          e.target.value = '';
        }
    };

  

  const [caseData,        setCaseData]        = useState(null);
  const [pageLoading,     setPageLoading]     = useState(true);
  const [pageError,       setPageError]       = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStatus,  setAnalysisStatus]  = useState('idle');
  const [selectedMatch,   setSelectedMatch]   = useState(null);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [activeItem,      setActiveItem]      = useState('projects');
  // ── CHANGED: replaced loadingDocIndex with docModalIndex ──────────────── //
  const [docModalIndex,   setDocModalIndex]   = useState(null); // null = closed

  // ── Ref for the background polling interval ──
  const pollIntervalRef = useRef(null);

  const mappedPatentsForBell = patents.patents.map(p => {
    /*const lastViewed  = p.last_viewed  ? new Date(p.last_viewed)  : null;
    const lastUpdated = p.last_updated || p.updated_date || p.lastUpdated;
    const hasUpdates = lastUpdated && lastViewed
      ? new Date(lastUpdated) > lastViewed
      : false;  // ← if either is missing, no badge*/
     /* const lastViewed  = p.last_viewed  ? new Date(p.last_viewed)  : null;

      const rawUpdated  = p.last_updated || p.updated_date || p.lastUpdated;

      // Normalize RFC 2822 → safe ISO string before parsing
      const lastUpdated = rawUpdated
        ? new Date(rawUpdated.replace(/^(\w+), (\d+) (\w+) (\d+) ([\d:]+) GMT$/, '$4-$3-$2T$5Z'))
        : null;

      // Guard against NaN from bad date strings
      const isValid = (d) => d instanceof Date && !isNaN(d);

      const hasUpdates = isValid(lastUpdated) && isValid(lastViewed)
        ? lastUpdated > lastViewed
        : false;*/
        const MONTHS = {
                    Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
                    Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12'
                  };

                 /* const parseRFC2822 = (str) => {
                    // "Sat, 23 May 2026 10:06:53 GMT"
                    const m = str.match(/^(\w+), (\d+) (\w+) (\d+) ([\d:]+) GMT$/);
                    if (!m) return null;
                    const [, , day, mon, year, time] = m;
                    const mm = MONTHS[mon];
                    if (!mm) return null;
                    return new Date(`${year}-${mm}-${day.padStart(2, '0')}T${time}Z`);
                  };

                  const lastViewed  = p.last_viewed  ? new Date(p.last_viewed)  : null;
                  const rawUpdated  = p.last_updated || p.updated_date || p.lastUpdated;
                  const lastUpdated = rawUpdated ? parseRFC2822(rawUpdated) : null;*/

                  const parseAnyDate = (str) => {
                  if (!str) return null;
                  // Try RFC 2822: "Sun, 24 May 2026 17:22:54 GMT"
                  const m = str.match(/^(\w+), (\d+) (\w+) (\d+) ([\d:]+) GMT$/);
                  if (m) {
                    const [, , day, mon, year, time] = m;
                    const mm = MONTHS[mon];
                    if (!mm) return null;
                    return new Date(`${year}-${mm}-${day.padStart(2, '0')}T${time}Z`);
                  }
                  // Fallback: ISO or any other format new Date() can handle
                  const d = new Date(str);
                  return isNaN(d.getTime()) ? null : d;
                };

                const lastViewed  = p.last_viewed  ? parseAnyDate(p.last_viewed)  : null;
                 const rawUpdated  = p.last_updated || p.updated_date || p.lastUpdated;
                const lastUpdated = rawUpdated     ? parseAnyDate(rawUpdated)      : null;
                 console.log(`⏰ Patent ${p._id}: last_viewed="${p.last_viewed}" →`, lastViewed, '; last_updated=', rawUpdated, '→', lastUpdated);

                  const isValid = (d) => d instanceof Date && !isNaN(d);
                  const analysisCompleted = isAnalysisCompleted(p.infringement_analysis_status);

                
                    // Instead of strict greater-than:
                const hasUpdates = analysisCompleted && isValid(lastUpdated) && isValid(lastViewed)
                  ? (lastUpdated - lastViewed) > 2000  // only flag if > 2 seconds difference
                  : false;

                /*  const hasUpdates = isValid(lastUpdated) && isValid(lastViewed)
                    ? lastUpdated > lastViewed
                    : false;*/

    return {
      id:             p._id,
      title:          p.title || p.name || 'Untitled Project',
      //patentNumber:   p.patentId || String(p._id || '').split('_')[1] || 'N/A',
      patentNumber: p.patentId || (p._id ? String(p._id).split('_').pop() : 'N/A'),
      status:         p.status,
      updatedAt:      p.lastUpdated || p.updated_date || p.created_date,
      inventors:      p.inventors,
      filedDate:      p.filedDate || p.filed_date,
      keywords:       p.keywords,
      description:    p.description,
      matchesCount:   p.matchCount || p.match_count || 0,
      documentsCount: p.documentsCount,
      progress:       0,
      hasUpdates,     // ← replaces Boolean(p.last_updated || p.updated_date)
    };
  });

  //console.log('📊 Raw patent fields:', patents.patents[0]);
  //console.log('📋 All statuses notification bell:', mappedPatentsForBell.map(p => ({ title: p.title, status: p.status, id: p.patentNumber, updates: p.hasUpdates, last_viewed: p.last_viewed, last_updated: p.last_updated })));
  


  const title          = caseData?.title    || projectData.title        || 'Untitled Case';
  //const patentNumber   = caseData?.patentId || projectData.patentNumber || caseData?._id?.split('_')[1] || 'N/A';
  const patentNumber = caseData?.patentId || (caseData?._id ? String(caseData._id).split('_').pop() : 'N/A');
  const status         = getStatusShorthand(caseData?.status || projectData.status || 'draft');
  const updatedAt      = caseData ? formatTimeAgo(caseData.updated_date || caseData.created_date) : (projectData.updatedAt || '—');
 // const inventors      = caseData?.inventors?.join(', ') || projectData.inventors || 'Not specified';
 const inventors = Array.isArray(caseData?.inventors)
  ? caseData.inventors.join(', ')
  : caseData?.inventors || projectData.inventors || 'Not specified';
  const filedDate      = formatDate(caseData?.filingDate || caseData?.filedAt) || projectData.filedDate || '—';
  //const keywords       = caseData?.keywords?.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ') || projectData.keywords || 'No keywords available';
  const keywords = Array.isArray(caseData?.keywords)
  ? caseData.keywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')
  : caseData?.keywords || projectData.keywords || 'No keywords available';
  const source         = caseData?.source || projectData.source || 'Unknown source';
  const description    = caseData?.context || caseData?.description || projectData.description || 'No description available';
  const matchesCount   = caseData?.infringements?.length ?? projectData.matchesCount ?? 0;
  const documentsCount = caseData?.documents?.length || projectData.documentsCount || 0;
  const isProcessing   = (caseData?.status || '').toLowerCase().includes('processing');
  const claimsChart    = caseData?.claimsChart || {};
  //const infringementAnalysisStatus = caseData?.infringementAnalysisStatus || 'unknown';
  const infringementAnalysisStatus = caseData?.infringement_analysis_status || 'unknown';

  const patentStatusFlags  = caseData?.patent_status_flags  || {};
  const productStatusFlags = caseData?.product_status_flags || {};
  const patentTimeTaken    = caseData?.patent_analysis_time_taken  || null;
  const productTimeTaken   = caseData?.product_analysis_time_taken || null;
  const lastAnalysisDate   = caseData?.last_infringement_analysis_date || null;
  console.log('📅 lastAnalysisDate:', lastAnalysisDate);

  //const displayClaims = caseData?.claims || [];
  /*const rawClaims = caseData?.claims;
const displayClaims = rawClaims
  ? (Array.isArray(rawClaims) ? rawClaims : Object.keys(rawClaims))
  : [];*/

  const rawClaims = caseData?.claims;


  // Derive which claim types actually exist in the claims data
  const presentClaimTypes = (() => {
  if (!rawClaims) return null;
  const values = Array.isArray(rawClaims)
    ? rawClaims
    : Object.values(rawClaims);
  const types = values
    .map(v => (typeof v === 'object' && v !== null ? v?.claim_type : null))
    .filter(Boolean)
    .map(t => 
      String(t)
        .toLowerCase()
        .trim()
        .replace(/_claim$/, '')   // ← strip trailing _claim: 'independent_claim' → 'independent'
        .replace(/\s+claim$/, '') // ← also handle 'independent claim' → 'independent'
    );
  return types.length > 0 ? [...new Set(types)] : null;
})();

  console.log('🏷️ presentClaimTypes:', presentClaimTypes);
console.log('🚩 patentStatusFlags:', patentStatusFlags);
console.log('🚩 productStatusFlags:', productStatusFlags);

// displayClaims: always a flat string array used for the legacy ClaimsMatrix tab
// and for the ClaimsEditor. If claims is an object {"0":{documented_claim,...}},
// pull the documented_claim string for each entry.
const displayClaims = (() => {
  if (!rawClaims) return [];
  if (Array.isArray(rawClaims)) return rawClaims;
  // Object form: {"0":{documented_claim, market_language_claim}, ...}
  return Object.values(rawClaims).map(v =>
    typeof v === 'object' ? (v.documented_claim ?? String(v)) : String(v)
  );
})();

  //const displayClaims = caseData?.claims || [];
console.log('🧾 displayClaims at render:', displayClaims, typeof displayClaims, displayClaims?.length);





  const realMatches = caseData?.infringements || [];
  /*const realMatches = (caseData?.infringements || []).filter(
      infringement => !new Set(caseData?.excluded_case_ids ?? []).has(infringement.case_id)
    );*/
  console.log('📋 Raw infringements from API:', realMatches);

  console.log('🔢 total:', realMatches.length);
console.log('🔢 nested-case (case_id + infringements[]):',
  realMatches.filter(i => i.case_id && Array.isArray(i.infringements) && i.infringements.length > 0).length);
console.log('🔢 nested-case but EMPTY infringements[]:',
  realMatches.filter(i => i.case_id && Array.isArray(i.infringements) && i.infringements.length === 0).length);
console.log('🔢 product_id:', realMatches.filter(i => i.product_id).length);
console.log('🔢 standard patent (entry_id, no nested infringements[]):',
  realMatches.filter(i => !i.product_id && !(i.case_id && Array.isArray(i.infringements)) && (i.entry_id || i.patent || i.case_id)).length);

  const potentialMatches = realMatches.length > 0
    ? realMatches.map(m => {
        const normalised = normaliseMatch(m);
        console.log(`🔍 [${normalised.type.toUpperCase()}] Normalised match789:`, normalised);
        return normalised;
      })
    : [];

    console.log('🃏 All potential matches:', JSON.stringify(potentialMatches, null, 2));

    const filteredMatches = potentialMatches.filter(m => m.type === matchTypeFilter);


    // always shows matches if they exist
    const shouldShowMatches = realMatches.length > 0;
    const shouldShowEmpty   = !analysisLoading && realMatches.length === 0;
    // iaIsInFlight is only used for the polling — keep it for that
    /*const iaStatus     = String(infringementAnalysisStatus || '').toLowerCase();
    const iaIsCompleted = iaStatus === 'completed';
    const iaIsUnknown  = iaStatus === 'unknown' || iaStatus === 'none' || iaStatus === '';
    const iaIsInFlight = !iaIsCompleted && !iaIsUnknown;*/

    const iaIsCompleted = isAnalysisCompleted(infringementAnalysisStatus);
    const iaIsUnknown   = isAnalysisUnknown(infringementAnalysisStatus);
    const iaIsFailed    = isAnalysisFailed(infringementAnalysisStatus);
    const iaIsInFlight  = isAnalysisInFlight(infringementAnalysisStatus);
    const iaProgressMsg = getAnalysisProgressMessage(infringementAnalysisStatus);

    console.log('⚖️ infringementAnalysisStatus:', infringementAnalysisStatus, '; iaIsCompleted:', iaIsCompleted, '; iaIsUnknown:', iaIsUnknown, '; iaIsInFlight:', iaIsInFlight, '; iaProgressMsg:', iaProgressMsg);

        const loadCase = useCallback(async () => {
          const c = await patentApi.getCaseById(caseId);
          console.log('📦 Loaded case data:', c);
          if (!c) {
            console.warn('⚠️ loadCase: getCaseById returned null');
            return null; // ← stop here, don't proceed to chart calls
          }

          // ── Generate description if missing or too short ──────────────────────
          /*  const desc   = c.description || '';
            const status = c.status      || '';
            if (!desc || desc === status || desc.split(' ').length < 10) {
              try {
                const summaryData = await patentApi.generateDescription(caseId);
                if (summaryData?.summary) c.description = summaryData.summary;
              } catch (e) {
                console.warn('generateDescription failed (non-blocking):', e.message);
              }
            }*/

            // ── Fetch & store claims if not already present ───────────────────────
           /* const hasClaims = Array.isArray(c?.claims) && c.claims.length > 0;
            if (!hasClaims) {
              try {
                const claims = await patentApi.getClaims(caseId);
                if (Array.isArray(claims) && claims.length > 0) {
                  c.claims = claims;
                  await patentApi.updateCase(caseId, { claims }).catch(() => {});
                }
              } catch (e) {
                console.warn('getClaims failed (non-blocking):', e.message);
              }
            }
*/
            const hasInfringements = Array.isArray(c?.infringements) && c.infringements.length > 0;
           // const hasClaims2 = Array.isArray(c?.claims) && c.claims.length > 0; 
           const hasClaims2 = c?.claims && (
            (Array.isArray(c.claims) && c.claims.length > 0) ||
            (typeof c.claims === 'object' && Object.keys(c.claims).length > 0)
          );


          //const hasInfringements = Array.isArray(c?.infringements) && c.infringements.length > 0;
          //const hasClaims = Array.isArray(c?.claims) && c.claims.length > 0;

          console.log('🔍 hasInfringements:', hasInfringements, '; hasClaims2:', hasClaims2);

          if (hasInfringements && hasClaims2) {
            if (needsInfringementChartApi(c.infringements)) {
              console.log('🟡 needsInfringementChartApi = TRUE → calling API');
              try {
                // Add a race with a timeout so it can't block forever 
                //const chart = await patentApi.getInfringementChart(caseId, c.claims);
                const chartPromise = patentApi.getInfringementChart(caseId);
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Chart timeout')), 60000)
                );
                const chart = await Promise.race([chartPromise, timeoutPromise]);
                console.log('📊 chart output:', JSON.stringify(chart, null, 2));
                if (chart && Object.keys(chart).length > 0) c.claimsChart = chart;
              } catch (e) { 
                console.warn('Chart load skipped:', e.message);/* silent continue*/
              console.error('📛 Full chart error:', e);
              console.error('📛 Error name:', e.name);
              console.error('📛 Error stack:', e.stack);
              }
                
            } else {
              console.log('🟢 needsInfringementChartApi = FALSE → using stored rows');
              const chart = buildClaimsChartFromStoredRows(c.infringements, c.claims);
              console.log('📊 chart output (from stored rows):', JSON.stringify(chart, null, 2));
              if (Object.keys(chart).length > 0) c.claimsChart = chart;
            }
          }

          return c;
        }, [caseId]);

  const fetchCaseDetails = useCallback(async () => {
    if (!caseId) { setPageLoading(false); return; }
    try {
      setPageLoading(true);

      //  Timeout the entire load if it takes more than 15s, to avoid hanging the UI indefinitely
      //const c = await loadCase();
      const c = await Promise.race([
        loadCase(),
       /* new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Loading timed out after 20s')), 20000)
        )*/
       new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Loading timed out after 5 minutes')), 5 * 60 * 1000)
        )
      ]);

      if (!c) { 
      setPageError('Could not load case data. Please try again.');
      return;
    }

    
      setCaseData(c);

      console.log('🔍 last_viewed from DB:', c?.last_viewed);  // ← add this
        console.log('🔍 last_updated from DB:', c?.last_updated);
        console.log('⚖️ hasUpdates should be:', 
          c?.last_updated && c?.last_viewed 
            ? new Date(c.last_updated) > new Date(c.last_viewed) 
            : 'missing one of the fields'
        );


      console.log('🆔 caseData._id:', c?._id);           
      console.log('🏷️ getSourceName result:', getSourceName(c?._id || ''));     

      
      console.log('🗂️ caseData keys:', Object.keys(c));
      console.log('🗂️ caseData.claims:', c?.claims);
      console.log('🗂️ caseData.infringements:', c?.infringements);
      console.log('🗂️ caseData.documents:', c?.documents);
      console.log('🗂️ caseData.infringementAnalysisStatus:', c?.infringement_analysis_status);
      console.log('🗂️ FULL caseData:', JSON.stringify(c, null, 2));

      


        //  Add  for infringement analysis display
      console.log('🔍 status:', c?.status);
      console.log('🔍 infringementAnalysisStatus:', c?.infringement_analysis_status);
      console.log('🔍 infringements count:', c?.infringements?.length);
      console.log('🔍 infringements sample:', c?.infringements?.[0]);



    } catch (err) {
      console.error('Error fetching case details:', err);
      setPageError(err?.message || 'Failed to load case');
    } finally {
      setPageLoading(false);
    }
  }, [caseId, loadCase]);

  const pollCaseDetails = useCallback(async () => {
    if (!caseId) return;
    try {
      const c = await loadCase();
      console.log('🔄 Poll — infringementAnalysisStatus:', c?.infringement_analysis_status);
      setCaseData(c);

      if (isAnalysisTerminal(c?.infringement_analysis_status)) {
        console.log('✅ Poll: analysis reached terminal state — stopping interval');
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    } catch (err) {
      console.warn('Poll error (non-fatal):', err?.message);
    }
  }, [caseId, loadCase]);


useEffect(() => {
  const status = caseData?.infringement_analysis_status;
  const shouldPoll =
    !pageLoading &&
    (analysisLoading || isAnalysisInFlight(status));

  if (shouldPoll && !pollIntervalRef.current) {
    pollIntervalRef.current = setInterval(pollCaseDetails, 15 * 1000);
  }

  if (!shouldPoll && pollIntervalRef.current) {
    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = null;
  }

  return () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };
}, [analysisLoading, pageLoading, pollCaseDetails, caseData?.infringement_analysis_status]);

  useEffect(() => { fetchCaseDetails(); }, [fetchCaseDetails]);


  // ── Last Viewed tracking ─────────────────────────────────────
useEffect(() => {
  if (!caseId || pageLoading) return;

console.log('📅 Tracking last_viewed for caseId:', caseId);
  const updateLastViewed = () => {
    const timestamp = new Date().toISOString();
    patentApi.updateCase(caseId, {
      last_viewed: timestamp,
    })
    .then(res => {
      //console.log('✅ last_viewed updated successfully:', res);
      //console.log('📅 last_viewed set to:', timestamp);
      dispatch(updatePatent({ _id: caseId, last_viewed: timestamp }));
    })
    .catch(err => {
      console.warn('Failed to update last_viewed:', err.message);
    });
  };

  // ── 1. On page open ──────────────────────────────────────────
  updateLastViewed();

  // ── 2. Browser close / tab close / refresh ───────────────────
  const handleBeforeUnload = () => {
    const blob = new Blob(
      [JSON.stringify({ _id: caseId, last_viewed: new Date().toISOString() })],
      { type: 'application/json' }
    );
    navigator.sendBeacon('/api/update-patent', blob);
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  // ── 3. Browser back button ───────────────────────────────────
  const handlePopState = () => updateLastViewed();
    window.addEventListener('popstate', handlePopState);

    return () => {
      // ── 4. React Router navigation (your Back button, Link, navigate) ──
     // updateLastViewed();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [caseId, pageLoading]); // ← only re-runs if caseId changes

  // ── Auto-reset analysis status to 'completed' when stale or both pipelines done ──
useEffect(() => {
  if (!caseData || pageLoading) return;

  const currentStatus = caseData?.infringement_analysis_status || 'unknown';
  const pTaken  = caseData?.patent_analysis_time_taken;
  const prTaken = caseData?.product_analysis_time_taken;
  const lastDate = caseData?.last_infringement_analysis_date;

  const bothTimeTakenPresent =
    pTaken  != null && pTaken  !== '' &&
    prTaken != null && prTaken !== '';

  // ── Case 1: both pipelines have a recorded finish time → definitely done ──
  const bothDone = bothTimeTakenPresent;

  // ── Case 2: status is stuck on a partial state ──
  const isStuckPartial = isAnalysisPartial(currentStatus);

  // ── Case 3: last analysis date is older than 6 hours → stale, reset it ──
  const isOlderThan6h = lastDate
    ? (Date.now() - new Date(lastDate).getTime()) > 6 * 60 * 60 * 1000
    : false; // null lastDate = never run → don't reset

  const shouldReset = bothDone || isStuckPartial || isOlderThan6h;

  if (!shouldReset) return;
  if (currentStatus === 'completed') return; // already correct, skip API call

  console.log('🔄 Resetting analysis status → completed', {
    bothDone, isStuckPartial, isOlderThan6h,
    currentStatus, pTaken, prTaken, lastDate,
  });

  patentApi.updateCase(caseId, { infringement_analysis_status: 'completed' })
    .then(() => setCaseData(prev => ({
      ...prev,
      infringement_analysis_status: 'completed',
    })))
    .catch(err => console.warn('Failed to reset analysis status:', err.message));

}, [
  caseId,
  pageLoading,
  caseData?.infringement_analysis_status,
  caseData?.last_infringement_analysis_date,
  caseData?.patent_analysis_time_taken,
  caseData?.product_analysis_time_taken,
]);

  const beginSimilarityAnalysis = async () => {
    const keywords = caseData?.keywords       || [];
    const urls     = caseData?.documents?.map(d => d.url) || [];
    const context  = caseData?.context        || caseData?.description || '';
    const country  = caseData?.countries?.[0] || 'US';
   // const claims   = (caseData?.claims?.length > 0) ? caseData.claims : ['No claims available'];
    const claimsPayload = caseData?.claims;
    const claims = (() => {
      if (!claimsPayload) return ['No claims available'];
      if (Array.isArray(claimsPayload) && claimsPayload.length > 0) return claimsPayload;
      if (typeof claimsPayload === 'object') {
        const flat = Object.values(claimsPayload)
          .map(v => typeof v === 'object' ? (v.documented_claim ?? String(v)) : String(v))
          .filter(Boolean);
        return flat.length > 0 ? flat : ['No claims available'];
      }
      return ['No claims available'];
    })();
    //const owners   = caseData?.inventors || caseData?.companies || [];
     const owners = (() => {
     const base = caseData?.inventors || [];
      if (base.length > 0) return base;
      // Fallback: pull from assignee and applicant when inventors is empty
      return [
          ...(Array.isArray(caseData?.applicant)
            ? caseData.applicant
            : caseData?.applicant ? [caseData.applicant] : []),
          ...(Array.isArray(caseData?.companies)
            ? caseData.companies
            : caseData?.companies ? [caseData.companies] : []),
        ].filter(Boolean);
    })();
    const source   = caseData?.source || '';

    console.log('🔍 Analysis payload:', { keywords, document_urls: urls, context, country, claims, owners });

    if (!keywords?.length || !urls?.length) {
      alert('Cannot run analysis: missing keywords or documents.');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisStatus('infringement');

    // ── ADD  optimistically set status to in-flight ──
    setCaseData(prev => ({
      ...prev,
      infringement_analysis_status: 'processing',
      patent_status_flags: {},
      product_status_flags: {},
      patent_analysis_time_taken: null,
      product_analysis_time_taken: null,
    }));


    try {
      const analysisData  = await patentApi.getInfringementAnalysis(
        caseId, keywords, urls, context, country, claims, owners
      );

      // ── GUARD ──
      if (!analysisData) {
        console.error('❌ getInfringementAnalysis returned undefined/null');
        alert('Analysis returned no data. Please check the API.');
        return;
      }

      console.log('✅ Raw analysisData:', JSON.stringify(analysisData, null, 2));
      // ── END GUARD ──


      const infringements = analysisData.similar_infringements || [];
      const newClaims     = analysisData.claims || [];

      //await patentApi.updateCase(caseId, { infringements, claims: newClaims });

      let claimsChart = {};
      if (newClaims.length > 0 && infringements.length > 0) {
       console.log('📊 Determining how to build claims chart for caseId:', caseId);
        if (needsInfringementChartApi(infringements)) {
          console.log('📊 Fetching claims chart from API for caseId:', caseId);
          try {
           claimsChart = await patentApi.getInfringementChart(caseId, newClaims) || {};
          } catch (e) { console.warn('Claims chart unavailable', e); }
        } else {
          console.log('📊 Building claims chart from stored rows for caseId:', caseId);
           claimsChart = buildClaimsChartFromStoredRows(infringements, newClaims);
        }
      }

      setCaseData(prev => ({ ...prev, infringements, claims: newClaims, claimsChart,infringement_analysis_status: analysisData.infringement_analysis_status || prev.infringement_analysis_status, }));
      dispatch(updatePatent({ _id: caseId, infringements, claims: newClaims }));

    } catch (err) {
      console.error('Analysis failed:', err);

      if (err?.response) {
        console.error('❌ Response error:', {
          status:     err.response.status,
          statusText: err.response.statusText,
          data:       err.response.data,
          headers:    err.response.headers,
        });
      } else if (err?.request) {
        console.error('📡 No response received:', {
          message:     err.message,
          code:        err.code,
          url:         err.config?.url,
          method:      err.config?.method,
          baseURL:     err.config?.baseURL,
          timeout:     err.config?.timeout,
          requestData: err.config?.data,
        });
      } else {
        console.error('⚙️ Request setup error:', err.message);
      }

      const msg         = err?.response?.data?.message || err?.message || 'Unknown error';
      const isRateLimit = msg.toLowerCase().includes('rate') || msg.includes('429');
      //alert(isRateLimit ? 'Rate limit hit, please wait.' : `Analysis failed: ${msg}`);
      // ── ADD THIS: on error reset status so UI doesn't show stale failed state ──
      setCaseData(prev => ({
        ...prev,
        infringement_analysis_status: 'failed',
      }));
    } finally {
      setAnalysisLoading(false);
      setAnalysisStatus('idle');
    }
  };

  const exportCase = () => alert(`Exporting case for ${title}`);

  const deleteCase = async () => {
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) return;
    try {
      await patentApi.deleteCase(caseId);
      dispatch(deletePatent(caseId));
      navigate('/dashboard');
    } catch (err) { alert(`Error: ${err?.message}`); }
  };
  const classifyDocUrl = (url = '') => {
  const firstHalf = url.split('.')[0]; // everything before the first dot
  if (firstHalf.includes('uspto'))      return 'uspto';
  if (firstHalf.includes('document/')) return 'local';
  return 'external';
};

  // ── CHANGED: just sets the modal index — no blob fetch ────────────────── //
  const openDocument = (index) => {
    const doc    = caseData?.documents?.[index];
    const source = (doc?.source || '').toLowerCase();
    const url    = doc?.url || '';

    console.log('📄 Opening doc [' + index + ']:', doc);
    console.log('📌 source:', source, '| url:', url);

    

     // const firstHalf = url.split('.')[0];
     const kind = classifyDocUrl(url);


      // USPTO domain — check if it's a direct file or a search/app page
      if (kind === 'uspto') {
        
        // Direct USPTO file (pdfpiw, etc.) → modal
        setDocModalIndex(index);
        return;
      }

      // Local document stored on your server → modal
      if (kind === 'local') {
        setDocModalIndex(index);
        return;
      }

      // Everything else → new tab
      window.open(url, '_blank', 'noopener,noreferrer');
   
  };
  // 1. Loading state
  if (pageLoading) {
    return (
      <div className="dash-shell">
        <DashboardSidebar activeItem={activeItem} onItemClick={setActiveItem} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="dash-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, border: '3px solid var(--rule2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--ink3)' }}>Loading case details...</p>
            </div>
          </div>
        </main>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // 2. Error state (timeout, server error, etc.)
  if (pageError) { 
      const isTimeout = pageError.toLowerCase().includes('timed out');
      
      return (
        <div className="dash-shell">
          <DashboardSidebar activeItem={activeItem} onItemClick={setActiveItem} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="dash-main">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, padding: '0 20px', textAlign: 'center' }}>
              
              {/* Icon */}
              <div style={{ fontSize: 40 }}>
                {isTimeout ? '⏱️' : '⚠️'}
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                {isTimeout ? 'Server is taking too long' : 'Failed to load case'}
              </h2>

              {/* Message */}
              <p style={{ color: 'var(--ink3)', fontSize: 14, margin: 0, maxWidth: 360 }}>
                {isTimeout
                  ? 'The server may be waking up from sleep. Please wait a moment and try again.'
                  : pageError}
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  className="btn-new"
                  onClick={() => {
                    setPageError(null);      // ← clear error first
                    fetchCaseDetails();      // ← then retry
                  }}
                >
                  ↺ Retry
                </button>
                <button
                  className="btn-export"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </button>
              </div>

            </div>
          </main>
        </div>
      );
    }


  // 3. ← No patent data (no caseId or no caseData)
    //if (pageError && !projectData.title) {
    // To show error even if we have no project data:
    if (!caseId && !projectData.title) {
      return (
        <div className="dash-shell">
          <DashboardSidebar activeItem={activeItem} onItemClick={setActiveItem} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="dash-main">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, padding: '0 20px', textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>No Patent Data Found</h2>
              <p style={{ color: 'var(--ink3)', fontSize: 14 }}>Please select a patent from the dashboard.</p>
              <button className="btn-new" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            </div>
          </main>
        </div>
      );
    }

  const sLower      = String(status).toLowerCase();
  const fillClass   = sLower === 'expired' ? 'red' : sLower === 'abandoned' ? 'grey' : 'green';
  const dotColor    = sLower === 'expired' ? 'var(--red)' : sLower === 'abandoned' ? 'var(--ink3)' : 'var(--accent)';
  const progressPct = Math.min(100, Math.max(0, projectData.progress || caseData?.progress || 0));
  const filledDots  = Math.round((progressPct / 100) * 5);
  // 4. Normal page render
  return (
    <div className="dash-shell">
      <DashboardSidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="dash-main">

        {/* ── Top Nav ── */}
        <header className="topnav">
          <div className="tn-left">
            <button className="tn-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="tn-title">Patent Gap AI</span>
            <div className="tn-sep pd-tn-sep" />
            <span className="tn-sub pd-tn-sub">Patent Detail</span>
          </div>

          <div className="tn-right">
            <NotificationBell
              patents={mappedPatentsForBell}
              onPatentClick={(patent) =>
                navigate(`/patent-detail?id=${patent.id}`)
              }
            />
            <div className="tn-vsep" />
            <Link to="/dashboard" className="tn-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="pd-tn-label">Dashboard</span>
            </Link>
            <button className="tn-btn" onClick={() => logout()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="pd-tn-label">Log out</span>
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="dash-content">

          {/* ── Page Header ── */}
          <div className="page-hd pd-page-hd">
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="page-eyebrow">Patent Detail</div>
              <h1 className="page-title pd-page-title" style={{ margin: 0 }}>
              <EditableTitleRow
                caseId={caseId}
                initialValue={title}
                onSave={(newTitle) => setCaseData(prev => ({ ...prev, title: newTitle }))}
              />
            </h1>
            </div>
            <div className="hd-actions pd-hd-actions">
              <button className="tn-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <button className="btn-export" onClick={exportCase}>
                <Download size={14} />
                <span className="pd-btn-label">Export</span>
              </button>


              {!iaIsInFlight && (
            <button
              className="btn-new"
              onClick={beginSimilarityAnalysis}
              disabled={analysisLoading}
              style={{ opacity: analysisLoading ? 0.7 : 1 }}
            >
              {analysisLoading ? (
                <>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span className="pd-btn-label">
                    {analysisStatus === 'claims' ? 'Isolating…' : 'Matching…'}
                  </span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                              </svg>
                  <span className="pd-btn-label">Run Analysis</span>
                </>
              )}
            </button>
          )}



            </div>
          </div>

          {/* ── Hero patent card ── */}
          <div
            className={`pcard ${sLower === 'expired' ? 'expired' : sLower === 'abandoned' ? 'abandoned' : 'patented'}`}
            style={{ marginBottom: 20, cursor: 'default' }}
          >
            <div className="pcard-top">
              <StatusPill status={status} />
              <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, color: 'var(--ink3)' }}>
                {formatStatus(source)}
              </span>
            </div>
            <div className="pcard-title" style={{ fontSize: 13, textTransform: 'none', letterSpacing: 0 }}>{title}</div>
            <div className="pd-chips">
              <div className="pcard-num">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                {patentNumber}
              </div>
              <div className="pcard-num">
                <Clock size={9} />
                {updatedAt}
              </div>
              {matchesCount > 0 && (
                <div className="pcard-num" style={{ color: 'var(--amber)', background: 'var(--amber-soft)' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  </svg>
                  {matchesCount} match{matchesCount !== 1 ? 'es' : ''}
                </div>
              )}
            </div>
            {/*<div className="pcard-progress">
              <div className="prog-track">
                <div className={`prog-fill ${fillClass}`} style={{ width: `${progressPct}%` }} />
              </div>
              <div className="prog-dots" style={{ color: dotColor }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="pdot" style={{ opacity: i < filledDots ? 0.35 : 0.1 }} />
                ))}
              </div>
            </div>
            <div className="pcard-foot">
              <div className="pcard-time">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {updatedAt}
              </div>
              <div className="pcard-live">
                <div className="live-bars"><span /><span /><span /><span /></div>
                Live
              </div>
            </div>*/}
          </div>

          {/* ── Processing progress ── */}
          {isProcessing && caseData?.progress !== undefined && (
            <div className="pd-card-body" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)' }}>Analysis Progress</span>
                <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{caseData.progress}%</span>
              </div>
              <div className="prog-track" style={{ height: 6 }}>
                <div className="prog-fill green" style={{ width: `${caseData.progress}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {/* ── Two-column info grid ── */}
          <div className="pd-two-col">
            <SectionCard title="Case Information" eyebrow="Patent Data" icon={FileText}>
              <InfoRow icon={Calendar} label="Created"      value={formatDate(caseData?.created_date || caseData?.createdAt) || updatedAt} />
              <InfoRow icon={FileText} label="Filed"        value={filedDate} />
              <InfoRow icon={Clock}    label="Last Updated" value={updatedAt} />
              {/*<InfoRow icon={User}     label="Inventors"    value={inventors} />*/}
              <EditableInventorsRow
                    caseId={caseId}
                    initialValue={
                      Array.isArray(caseData?.inventors)
                        ? caseData.inventors.join(', ')
                        : caseData?.inventors || ''
                    }
                    onSave={(newInventors) =>
                      setCaseData(prev => ({ ...prev, inventors: newInventors }))
                    }
                  />
              <InfoRow icon={Tag}      label="Keywords"     value={keywords} />
              <InfoRow icon={Tag}      label="Source"       value={formatStatus(source)} />
            </SectionCard>

            {/* Context & Description — editable */}
            <SectionCard title="Context & Description" eyebrow="Overview" icon={FileText}>
              <ContextEditor
                caseId={caseId}
                initialValue={description}
                onSave={(newDesc) => setCaseData(prev => ({ ...prev, context: newDesc }))}
              />

              {(caseData?.companies?.length > 0 || caseData?.countries?.length > 0 || caseData?.terms?.length > 0) && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule2)' }}>
                  <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: 10 }}>Search Strategy</div>
                  {caseData.companies?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 5 }}>Target Companies</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {caseData.companies.map((c, i) => <span key={i} className="pcard-num" style={{ margin: 0 }}>{c}</span>)}
                      </div>
                    </div>
                  )}
                  {caseData.terms?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 5 }}>Search Terms</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {caseData.terms.map((t, i) => <span key={i} className="pcard-num" style={{ margin: 0 }}>{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Search Limitations + Related IDs — side by side ── */}
          <div className="pd-sl-ri-row">

            {/* ── Search Limitations ── */}
            <SectionCard title="Search Limitations" eyebrow="User Defined" icon={Search}>
              <SearchLimitationEditor
                caseId={caseId}
                initialData={caseData?.searchLimitations}
                onSave={(data) =>
                  setCaseData(prev => {
                    // ── Keywords that came from the previous search limitations save ──
                    const prevLimitationKeywords = Array.isArray(prev.searchLimitations?.keywords)
                      ? prev.searchLimitations.keywords
                      : [];

                    // ── Current metadata keywords, minus any that came from the old limitations ──
                    // (so we don't keep deleted limitation keywords in metadata)
                    const existingKeywords = Array.isArray(prev.keywords)
                      ? prev.keywords.filter(k => !prevLimitationKeywords.includes(k))
                      : prev.keywords
                        ? [prev.keywords].filter(k => !prevLimitationKeywords.includes(k))
                        : [];

                    // ── Merge cleaned metadata keywords with new limitation keywords ──
                    const newLimitationKeywords = Array.isArray(data?.keywords) ? data.keywords : [];
                    const newKeywords = [...new Set([...existingKeywords, ...newLimitationKeywords])];

                    return {
                      ...prev,
                      searchLimitations: data,
                      keywords: newKeywords,
                    };
                  })
                }
              />
            </SectionCard>

            {/* ── Related IDs ── */}
            <SectionCard title="Related IDs" eyebrow="Patent Family" icon={FileText}>
                {caseData?.other_ids?.filter(item =>
                  Array.isArray(item.value) ? item.value.length > 0 : Boolean(item.value)
                ).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {caseData.other_ids
                      .filter(item =>
                        Array.isArray(item.value) ? item.value.length > 0 : Boolean(item.value)
                      )
                      .map((item, i, arr) => {
                       /* const values = Array.isArray(item.value)
                          ? item.value
                          : item.value
                          ? [item.value]
                          : [];*/

                          const values = Array.isArray(item.value)
                            ? item.value.map(v => typeof v === 'object' ? JSON.stringify(v) : v)
                            : item.value && typeof item.value === 'object'
                            ? Object.values(item.value).flat().map(v => String(v))
                            : item.value
                            ? [String(item.value)]
                            : [];

                        return (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              padding: '9px 0',
                              borderBottom: i < arr.length - 1 ? '1px solid var(--rule2)' : 'none',
                            }}
                          >
                            {/* Label */}
                            <span style={{
                              fontFamily: "'Inconsolata', monospace",
                              fontSize: 10,
                              textTransform: 'uppercase',
                              letterSpacing: '0.10em',
                              color: 'var(--ink3)',
                              flexShrink: 0,
                              width: 160,
                              paddingTop: 4,
                            }}>
                              {item.title || '—'}
                            </span>

                            {/* Values — pill per entry */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {values.map((v, vi) => (
                                <span key={vi} style={{
                                  fontFamily: "'Inconsolata', monospace",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: 'var(--accent)',
                                  background: 'var(--acc-soft)',
                                  border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                                  borderRadius: 5,
                                  padding: '2px 9px',
                                  letterSpacing: '0.04em',
                                  wordBreak: 'break-all',
                                }}>
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p style={{ fontSize: 13.5, color: 'var(--ink3)', margin: 0, fontStyle: 'italic' }}>
                    No related IDs available.
                  </p>
                )}
              </SectionCard>

          </div>

          {/* ── Documents ── */}
          <SectionCard
            title="Documents"
            eyebrow="Files"
            icon={FileText}
            
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pcard-num" style={{ margin: 0, color: 'var(--accent)' }}>
                  {documentsCount} doc{documentsCount !== 1 ? 's' : ''}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleAddDocument}
                />
                <button
                  className="btn-new"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  style={{ opacity: uploadingDoc ? 0.7 : 1,
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 11px', fontSize: 11 }}
                >
                  {uploadingDoc ? (
                    <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg> Add Document</>
                  )}
                </button>
              </div>
            }
          >
            <div className="pd-docs-grid">
              {caseData?.documents?.length > 0
                ? caseData.documents.map((doc, i) => {
                    // ── Thumbnail visuals are 100% unchanged ──────────────── //
                    const url            = doc.url || '';
                    console.log('📄 Processing doc url:', url);
                    //const ext            = url.split('.').pop();
                    //const ext   = url.split('/').pop().split('.').pop(); // ← use split('/').pop() not split('.')
                    const src            = doc.source || '';
                    console.log('📄 doc.source raw value:', JSON.stringify(doc.source));
                    console.log('📄 full doc object:', doc);
                    //const bgImg          = src === 'uspto' ? 'uspto.jpg' : 'uspto.jpg';
                    // ── Safe ext extraction ──────────────────────────────
                    const rawExt = url.split('/').pop().split('.').pop();
                    // Only use it if it looks like a real extension (≤5 chars, no spaces/?)
                    const ext = rawExt && rawExt.length <= 5 && !/[?&\s]/.test(rawExt)
                      ? rawExt
                      : 'pdf'; // ← fallback

                    const srcLower = src.toLowerCase();
                    const bgImg = 
                      srcLower.includes('uspto')          ? 'uspto.jpg'        :
                      srcLower.includes('espacenet')      ? 'espacenet.png'    :
                      srcLower.includes('google patents')  ? 'googlepatents.png'       :
                      srcLower.includes('global dossier') ? 'espacenet.png':
                      srcLower.includes('local')        ? 'local.png'      :
                      srcLower.includes('freepatents')        ? 'freepatentsonline.png'      :
                      'default.png';
                    return (
                      <div key={i} onClick={() => openDocument(i)} className="pd-doc-thumb">
                        <div
                          className="pd-doc-inner"
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* original image — untouched */}
                          <img src={`/images/${bgImg}`} alt={src} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45, }} />
                          <div className="pd-doc-blur" />
                          <div className="pd-doc-label" style={{
                              flexDirection: 'column',
                              gap: 6,
                              padding: '0 6px',
                              textAlign: 'center',
                            }}>
                              {/* big index number */}
                              <span style={{
                                fontSize: '2rem',
                                fontWeight: 900,
                                color: 'var(--ink)',
                                lineHeight: 1,
                                letterSpacing: '-0.02em',
                              }}>
                                {i + 1}
                              </span>

                              {/* source name */}
                              <span style={{
                                fontSize: 10,
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.10em',
                                color: 'var(--ink)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '92%',
                                lineHeight: 1.2,
                              }}>
                                {src || `doc ${i + 1}`}
                              </span>

                              {/* extension */}
                              <span style={{
                                fontSize: 10,
                                fontWeight: 900,
                                color: 'var(--ink2)',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                              }}>
                                .{ext}
                              </span>
                            </div>
                        </div>
                      </div>
                    );
                  })
                : documentsCount > 0
                  ? Array.from({ length: documentsCount }, (_, i) => (
                    <div key={i} className="pd-doc-thumb">
                      <div className="pd-doc-inner pd-doc-placeholder">
                        <FileText size={28} color="var(--accent)" strokeWidth={1.5} />
                        <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 13, fontWeight: 600, color: 'var(--ink2)' }}>{i + 1}.xml</span>
                      </div>
                    </div>
                  ))
                  : <p style={{ fontSize: 13.5, color: 'var(--ink3)', fontStyle: 'italic' }}>
                    No documents uploaded yet.
                  </p>
              }
            </div>
          </SectionCard>

          {/* ── Claims — only shown when real claims exist from the API ── 
          {displayClaims.length > 0 && (
           <SectionCard title="Claims for Analysis" eyebrow="Patent Claims" icon={FileText}>
            <ClaimsEditor
              caseId={caseId}
              initialClaims={displayClaims}
              onSave={(newClaims) => setCaseData(prev => ({ ...prev, claims: newClaims }))}
            />
          </SectionCard>
          )*/}

          {/* ── Claims — only shown when real claims exist from the API ── */}
{displayClaims.length > 0 && (
  <div style={{ marginBottom: 20 }}>
    <div className="sec-hd" style={{ marginBottom: claimsExpanded ? 12 : 0 }}>
      <div className="sec-hd-left">
        <div className="sec-ico">
          <FileText size={16} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <div className="sec-eye"><div className="live-dot" />Patent Claims</div>
          <div className="sec-title">Claims for Analysis</div>
        </div>
      </div>

      <div className="sec-hd-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="pcard-num" style={{ margin: 0, color: 'var(--accent)' }}>
          {displayClaims.length} claim{displayClaims.length !== 1 ? 's' : ''}
        </span>

        <button
          onClick={() => setClaimsExpanded(prev => !prev)}
          className="btn-export"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 11 }}
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{
              transition: 'transform 0.2s ease',
              transform: claimsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          {claimsExpanded ? 'Collapse' : 'View Claims'}
        </button>
      </div>
    </div>

    {claimsExpanded && (
      <div className="pd-card-body">
        <ClaimsEditor
          caseId={caseId}
          initialClaims={rawClaims}
          onSave={(newClaims) => setCaseData(prev => ({ ...prev, claims: newClaims }))}
        />
      </div>
    )}
  </div>
)}

          {/* ── Claims Chart — only shown when chart data exists ── */}
          {/*Object.keys(claimsChart).length > 0 && (
            console.log('📊 Rendering Claims Chart with data:', claimsChart) ||
            <SectionCard title="Claims Chart" eyebrow="Analysis" icon={FileText}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(claimsChart).map(([key, items]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 600, color: 'var(--ink2)', minWidth: 64 }}>Claim {key}</span>
                    {(items || []).map((item, idx) => (
                      <div key={idx} style={{ border: `1.5px solid ${selectMainColor(item.similarity_score)}`, borderRadius: 5, padding: '2px 8px', color: selectMainColor(item.similarity_score), fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 600 }}>
                        {item.entry_id}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </SectionCard>
          )*/}

          
          {/* ── Claims Coverage Matrix ──        
          {displayClaims.length > 0 && potentialMatches.length > 0 && (
            <ClaimsMatrix
              displayClaims={displayClaims}
              potentialMatches={potentialMatches}
            />
          )}
              */} 
          {displayClaims.length > 0 && potentialMatches.length > 0 && (
          <ClaimsMatrix
            displayClaims={displayClaims}
            potentialMatches={potentialMatches}
            rawClaimsObj={rawClaims}
            rawInfringements={realMatches}
          />
        )}

   
{/* ── Potential Matches ── */}
<div style={{ marginBottom: 20 }}>
  <div className="sec-hd" style={{ marginBottom: matchesExpanded ? 12 : 0 }}>
    <div className="sec-hd-left">
      <div className="sec-ico">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <div className="sec-eye"><div className="live-dot" />Infringement Analysis</div>
        <div className="sec-title">Potential Matches</div>
      </div>
    </div>

    <div className="sec-hd-right">
      {!iaIsInFlight && (
        <button className="btn-refresh" onClick={beginSimilarityAnalysis} title="Re-run analysis">
          <RefreshCw size={13} style={{ animation: analysisLoading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      )}

      <span className="pcard-num" style={{
        margin: 0,
        color: matchesCount > 0 ? 'var(--amber)' : 'var(--accent)',
        background: matchesCount > 0 ? 'var(--amber-soft)' : 'var(--acc-soft)',
      }}>
        {matchesCount} match{matchesCount !== 1 ? 'es' : ''}
      </span>

      <button
        onClick={() => setMatchesExpanded(prev => !prev)}
        className="btn-export"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 11 }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{
            transition: 'transform 0.2s ease',
            transform: matchesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        {matchesExpanded ? 'Collapse' : 'Show Matches'}
      </button>
    </div>
  </div>

  
 
  {/* ── Infringement Sources ── */}
      {(() => {
        // Derive sources from infringements if the top-level field is missing
        const sources = caseData?.infringement_sources?.length
          ? caseData.infringement_sources
          : (caseData?.infringements || [])
              .flatMap(inf => {
                // nested-case format: infringements[].infringements[].source
                if (Array.isArray(inf.infringements)) {
                  return inf.infringements.map(i => i.source).filter(Boolean);
                }
                // product / patent format: top-level source field
                return inf.source ? [inf.source] : [];
              });

        const uniqueSources = [...new Set(sources)].filter(Boolean);
        if (!uniqueSources.length) return null;

        return (
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
            marginBottom: 10, paddingLeft: 2,
          }}>
            <span style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.10em',
              color: 'var(--ink3)', flexShrink: 0, marginRight: 4,
            }}>
              Infringement sources
            </span>
            {uniqueSources.map((src, i) => (
              <span key={i} className="pcard-num" style={{ margin: 0 }}>{src}</span>
            ))}
          </div>
        );
      })()}
  {/* ── Filter tabs ── */}
  {matchesExpanded && (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 14,
      borderBottom: '1px solid var(--rule2)', paddingBottom: 0,
    }}>
      {[
        { key: 'product', label: '🛒 Products', count: potentialMatches.filter(m => m.type === 'product').length },
        { key: 'patent',  label: '📄 Patents',  count: potentialMatches.filter(m => m.type === 'patent').length  },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setMatchTypeFilter(tab.key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: matchTypeFilter === tab.key ? 'var(--accent)' : 'var(--ink3)',
            borderBottom: matchTypeFilter === tab.key
              ? '2px solid var(--accent)'
              : '2px solid transparent',
            marginBottom: -1, // sits flush on the border
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          {tab.label}
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 18, height: 18, borderRadius: 99,
            background: matchTypeFilter === tab.key ? 'var(--acc-soft)' : 'var(--surf2)',
            color: matchTypeFilter === tab.key ? 'var(--accent)' : 'var(--ink3)',
            fontSize: 10, fontWeight: 700, padding: '0 5px',
            transition: 'background 0.15s, color 0.15s',
          }}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )}

  {/* ── Collapsible content ── */}
  {matchesExpanded && (
    <>

      {/* ── Dual-pipeline analysis status (replaces CASE 1, 1b, 2) ── */}
      {(analysisLoading || iaIsInFlight || iaIsFailed || iaIsCompleted) && (
        <InfringementAnalysisStatus
          overallStatus={infringementAnalysisStatus}
          patentFlags={patentStatusFlags}
          productFlags={productStatusFlags}
          patentTimeTaken={patentTimeTaken}
          productTimeTaken={productTimeTaken}
          lastAnalysisDate={lastAnalysisDate}
          progressMsg={iaProgressMsg}
          presentClaimTypes={presentClaimTypes}
          onRetry={beginSimilarityAnalysis}
          formatDate={formatDate}
        />
      )}
      {/* CASE 1: user clicked Run Analysis 
      {analysisLoading && (
        <div className="pd-card-body" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--rule2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '0 0 4px' }}>
            {analysisStatus === 'claims' ? 'Isolating Claims…' : 'Finding Infringements…'}
          </p>
        </div>
      )}*/}

      {/* CASE 1b: analysis failed on backend 
      {!analysisLoading && iaIsFailed && (
          <div className="pd-card-body" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap', marginBottom: 16,
              borderColor: 'rgba(178,34,34,0.25)',
            }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', margin: '0 0 3px' }}>
                Analysis failed
              </p>
              <p style={{
                  fontFamily: "'Inconsolata', monospace",
                  fontSize: 11, color: 'var(--ink3)', margin: 0,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                {infringementAnalysisStatus}
              </p>
            </div>
          </div>
          <button className="btn-new" onClick={beginSimilarityAnalysis}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Retry Analysis
          </button>
        </div>
      )}*/}

      {/* CASE 2: analysis in-flight on backend 
      {!analysisLoading && iaIsInFlight  && (
        <div className="pd-card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px', marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0,
            border: '3px solid var(--rule2)',
            borderTop: '3px solid var(--amber, #b45309)',
            borderRadius: '50%', animation: 'spin 1.2s linear infinite',
          }} />
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', margin: '0 0 3px' }}>
              {iaProgressMsg.title}
            </p>
            <p style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 11, color: 'var(--ink3)', margin: 0,
              letterSpacing: '0.04em',
            }}>
              {iaProgressMsg.detail}<br />
              This analysis can take a while. We will notify you once the results are ready.
            </p>
          </div>
          <span style={{
            marginLeft: 'auto', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: "'Inconsolata', monospace",
            fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.10em',
            padding: '4px 10px', borderRadius: 5,
            background: 'var(--amber-soft, rgba(251,191,36,0.12))',
            color: 'var(--amber, #b45309)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--amber, #b45309)',
              animation: 'ia-pulse 1.4s ease-in-out infinite',
            }} />
            Processing
          </span>
        </div>
      )}*/}

      {/* CASE 3: no matches for this filter tab */}
      {!analysisLoading && !iaIsInFlight && !iaIsFailed && filteredMatches.length === 0 && (
        <div className="pd-card-body pd-no-matches">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>
              {potentialMatches.length > 0 ? '🔍' : ''}
            </span>
            <p style={{ fontSize: 13.5, color: 'var(--ink2)', margin: 0 }}>
              {potentialMatches.length > 0
                ? `No ${matchTypeFilter} matches found. Try the other tab.`
                : 'No potential infringement matches found.'}
            </p>
          </div>
          {potentialMatches.length === 0 && (
            <button className="btn-new" onClick={beginSimilarityAnalysis}>Start Analysis</button>
          )}
        </div>
      )}

      {/* CASE 4: show filtered matches */}
      {filteredMatches.length > 0 && (
        <div className="cards-grid">
          {filteredMatches.map((match, index) => (
            <MatchCard
              key={index}
              match={match}
              updatedAt={updatedAt}
              caseId={caseId}
              onSelect={setSelectedMatch}
              onExclude={(excludedId) => {
                const updatedInfringements = (caseData?.infringements || []).filter(
                  inf => (inf.product_id || inf.entry_id || inf.patent || inf.case_id) !== excludedId
                );
                const updatedExcludedIds = [...(caseData?.excluded_case_ids || []), excludedId];
                const updatedExcludedTitles = [
                  ...(caseData?.excluded_titles || []),
                  caseData?.infringements?.find(
                    inf => (inf.product_id || inf.entry_id || inf.patent || inf.case_id) === excludedId
                  )?.entry_title || ''
                ];
                patentApi.updateCase(caseId, {
                  infringements: updatedInfringements,
                  excluded_case_ids: [excludedId],
                  excluded_titles: [
                    caseData?.infringements?.find(
                      inf => (inf.product_id || inf.entry_id || inf.patent || inf.case_id) === excludedId
                    )?.entry_title || ''
                  ],
                });
                setCaseData(prev => ({
                  ...prev,
                  infringements: updatedInfringements,
                  excluded_case_ids: updatedExcludedIds,
                  excluded_titles: updatedExcludedTitles,
                }));
              }}
            />
          ))}
        </div>
      )}

      <div className="pd-action-btns">
        <button className="btn-export" onClick={exportCase}>
          <Download size={14} /> Export Case
        </button>
        <button
          className="btn-export"
          onClick={deleteCase}
          style={{ color: 'var(--red)', borderColor: 'rgba(185,28,28,0.22)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--red-soft)'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <Trash2 size={14} /> Delete Case
        </button>
      </div>
    </>
  )}
</div>

        </div>
      </main>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        /* ── Type pill ── */
        .pd-type-pill {
          font-family: 'Inconsolata', monospace;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--surf2);
          color: var(--ink3);
        }
        .pd-type-pill[data-type="product"] {
          background: var(--amber-soft);
          color: var(--amber, #b45309);
        }
        .pd-type-pill[data-type="patent"] {
          background: var(--acc-soft);
          color: var(--accent);
        }

      
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  /* ── ADD THESE THREE LINES ── */
  .prog-fill.red   { background: var(--red,   #B22222); }
  .prog-fill.amber { background: var(--amber, #b45309); }
  .prog-fill.green { background: var(--accent,#2E7D32); }

  /* ── Also fix pcard-badge for amber (medium risk) ── */
  .pcard-badge.expired   { background: var(--red-soft);   color: var(--red);    }
  .pcard-badge.abandoned { background: var(--amber-soft); color: var(--amber);  }
  .pcard-badge.patented  { background: var(--acc-soft);   color: var(--accent); }

  /* ── And pcard border colors ── */
  .pcard.expired   { border-color: rgba(178,34,34,0.25);  }
  .pcard.abandoned { border-color: rgba(180,83,9,0.25);   }
  .pcard.patented  { border-color: rgba(46,125,50,0.25);  }


        /* ── Badges ── */
        .pd-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inconsolata', monospace; font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.10em; padding: 4px 9px; border-radius: 5px;
        }
        .pd-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .pd-badge.patented  { background: rgba(46,125,50,0.10); color: #1b5e20; }
        .pd-badge.abandoned { background: var(--amber-soft);  color: var(--amber); }
        .pd-badge.expired   { background: var(--red-soft);  color: var(--red); }

        /* ── Shared card body ── */
        .pd-card-body {
          background: var(--surf);
          border-radius: var(--radius);
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow: var(--shadow-sm);
          padding: 20px 24px;
        }

        /* ── Info row ── */
        .pd-info-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid var(--rule2);
        }
        .pd-info-label-wrap {
          display: flex; align-items: center; gap: 7px;
          width: 130px; flex-shrink: 0;
        }
        .pd-info-label {
          font-family: 'Inconsolata', monospace; font-size: 10px;
          text-transform: uppercase; letter-spacing: 0.10em; color: var(--ink3);
        }
        .pd-info-value {
          font-size: 13.5px; color: var(--ink); line-height: 1.55; word-break: break-word;
        }

        /* ── Chips ── */
        .pd-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

        /* ── Page header ── */
        .pd-page-hd { align-items: flex-start !important; flex-wrap: wrap; gap: 12px; }
        .pd-page-title { word-break: break-word; }
        .pd-hd-actions { flex-shrink: 0; }

        /* ── Two-column grid ── */
        .pd-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px; margin-bottom: 20px;
        }

        /* ── Docs ── */
        .pd-docs-grid { display: flex; flex-wrap: wrap; gap: 14px; }
        .pd-doc-thumb { cursor: pointer; }
        .pd-doc-inner {
          position: relative; width: 8rem; height: 10.5rem;
          border: 2px solid var(--surf2); border-radius: 10px;
          overflow: hidden; box-shadow: var(--shadow-sm); transition: transform 0.2s;
        }
        .pd-doc-blur {
          position: absolute; inset: 0;
          backdrop-filter: blur(3px); background: rgba(250,250,247,0.3); z-index: 1;
        }
        .pd-doc-label {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-family: 'Inconsolata', monospace; font-weight: 600; font-size: 1.1rem;
          color: var(--ink); z-index: 2;
        }
        .pd-doc-placeholder {
          background: linear-gradient(135deg, var(--acc-soft), var(--surf2));
          border-color: var(--acc-border);
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 8px;
        }
        .pd-doc-placeholder .pd-doc-label { position: static; font-size: 13px; }

        /* ── No-matches ── */
        .pd-no-matches {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }

        /* ── In-flight analysis status loader ── */
        .pd-ia-status-loader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 24px !important;
        }
        .pd-ia-spinner-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pd-ia-status-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 3px;
        }
        .pd-ia-status-sub {
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          color: var(--ink3);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .pd-ia-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inconsolata', monospace;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          padding: 4px 10px;
          border-radius: 5px;
          background: var(--amber-soft, rgba(251,191,36,0.12));
          color: var(--amber, #b45309);
          flex-shrink: 0;
        }
        .pd-ia-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--amber, #b45309);
          animation: ia-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ia-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            align-items: start;  /* ← ADD THIS */
          }

        /* ── Action buttons ── */
        .pd-action-btns { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }

        /* ══════════════════════════════
           TABLET  ≤ 900px
        ══════════════════════════════ */
        @media (max-width: 900px) {
          .pd-two-col { grid-template-columns: 1fr; }
          .pd-tn-sep, .pd-tn-sub { display: none; }
        }

        /* ══════════════════════════════
           MOBILE  ≤ 640px
        ══════════════════════════════ */
        @media (max-width: 640px) {
          .dash-content { padding: 14px 14px 32px !important; }
          .pd-page-hd { flex-direction: column !important; align-items: stretch !important; }
          .pd-hd-actions { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
          .pd-hd-actions > * { flex: 1; justify-content: center; min-width: 80px; }
          .pd-card-body { padding: 14px 16px; }
          .pd-info-row { flex-direction: column; gap: 4px; }
          .pd-info-label-wrap { width: auto; }
          .pd-doc-inner { width: 6.5rem; height: 8.5rem; }
          
          .cards-grid { grid-template-columns: 1fr !important; }
          .pd-action-btns { flex-direction: column; }
          .pd-action-btns .btn-export { width: 100%; justify-content: center; }
          .pd-tn-label { display: none; }
          .tn-title { font-size: 13px; }
          .pd-tn-center { display: none; }
          .pd-ia-status-loader { flex-direction: column; align-items: flex-start; }
        }

        /* ══════════════════════════════
           VERY SMALL  ≤ 380px
        ══════════════════════════════ */
        @media (max-width: 380px) {
          .dash-content { padding: 10px 10px 24px !important; }
          .pd-doc-inner { width: 5.5rem; height: 7rem; }
          .page-title { font-size: clamp(15px, 5vw, 24px) !important; }
        }
          /* ── Search Limitations + Related IDs row ── */
        .pd-sl-ri-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 0;  /* SectionCard already adds margin-bottom: 20px */
        }

        @media (max-width: 900px) {
          .pd-sl-ri-row { grid-template-columns: 1fr; }
        }
          @media (max-width: 640px) {
          .claims-v2-cols {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>

      {/* ── Infringement match modal (unchanged) ── */}
      {selectedMatch && (
        <InfringementModal
          match={selectedMatch}
          patentTitle={title}
          patentNumber={patentNumber}
          caseId={caseId}
          infringementId={selectedMatch._entryId || null}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* ── Document modal — mounts when a thumbnail is clicked ── */}
      {docModalIndex !== null 
        && caseData?.documents?.[docModalIndex] !== undefined
        && (
        <DocumentModal
          doc={caseData.documents[docModalIndex]}
          index={docModalIndex}
          total={caseData.documents.length}
          onClose={() => setDocModalIndex(null)}
          onNext={() => setDocModalIndex(i => Math.min(i + 1, caseData.documents.length - 1))}
          onPrev={() => setDocModalIndex(i => Math.max(i - 1, 0))}
          fetchBlob={async (doc) => {
              const url  = doc?.url || '';
              const kind = classifyDocUrl(url);

              if (kind === 'uspto') {
                try {
                  return await patentApi.proxyDocument(url);
                } catch (err) {
                  throw new Error(
                    err?.message?.includes('HTML page')
                      ? 'This document link points to a USPTO search page, not a direct file. Open it in a new tab instead.'
                      : `Could not load USPTO document: ${err?.message || 'Unknown error'}`
                  );
                }
              }

              if (kind === 'local') {
                return await patentApi.getDocumentStream(`/${url}`);
              }

              throw new Error(`Unsupported document source for URL: ${url}`);
            }}
        />
      )}

    </div>
  );
};

export default PatentDetailPage;
