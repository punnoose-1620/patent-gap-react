import { RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { isAnalysisInFlight } from '../../utils/infringementAnalysisStatus';
// ─────────────────────────────────────────────────────────────
// Pipeline stage order. Per spec: Asserted → Independent → Core → Pivotal.
// "generic_claims_*" flags also exist in the data but weren't named in the
// requested flow — included here as an optional leading stage since it's
// listed first in the flags object. Remove from STAGE_ORDER if it should
// not be part of the displayed pipeline.
// ─────────────────────────────────────────────────────────────
const STAGE_ORDER = [
  { key: 'generic',     label: 'Generic Claims' },
  { key: 'asserted',    label: 'Asserted Claims' },
  { key: 'independent', label: 'Independent Claims' },
  { key: 'core',        label: 'Core Claims' },
  { key: 'pivotal',     label: 'Pivotal Claims' },
];

const flagKey = (stageKey, kind) => `${stageKey}_claims_${kind}_analysis`; // kind: 'patent' | 'product'

/**
 * Given a flags object like:
 * { asserted_claims_patent_analysis: "Started", independent_claims_patent_analysis: "Completed", ... }
 * determine the current stage (first non-Completed stage in pipeline order,
 * respecting that a stage won't run if an earlier one Errored), and overall
 * state for that pipeline.
 */
const deriveStageState = (flags, kind, presentClaimTypes) => {
  if (!flags || typeof flags !== 'object') {
    return { state: 'unknown', currentStage: null, stages: [] };
  }

  const stages = STAGE_ORDER
    .filter(({ key }) => {
      // Must exist in flags
      if (!(flagKey(key, kind) in flags)) return false;
      // If we have claim type info, the stage key must match a present claim type
      if (presentClaimTypes && presentClaimTypes.length > 0) {
        return presentClaimTypes.includes(key); // e.g. 'asserted', 'pivotal', 'core', 'independent', 'generic'
      }
      return true;
    })
    .map(({ key, label }) => ({
      key, label, status: flags[flagKey(key, kind)] || null,
    }));

  
  // Find first stage that errored — pipeline halts there
  const erroredIdx = stages.findIndex(s => s.status === 'Error');
  if (erroredIdx !== -1) {
    return { state: 'error', currentStage: stages[erroredIdx], stages, erroredAt: stages[erroredIdx] };
  }

  // Find first stage that's "Started" (in progress)
  const inProgressIdx = stages.findIndex(s => s.status === 'Started');
  if (inProgressIdx !== -1) {
    return { state: 'in_progress', currentStage: stages[inProgressIdx], stages };
  }

  // If every defined stage (i.e. ones with a non-null status) is Completed
  const definedStages = stages.filter(s => s.status !== null);
  if (definedStages.length > 0 && definedStages.every(s => s.status === 'Completed')) {
    return { state: 'completed', currentStage: null, stages };
  }

  // No flags set at all yet
  if (definedStages.length === 0) {
    return { state: 'idle', currentStage: null, stages };
  }

  // Mixed/unexpected state — fall back to in_progress framing
  return { state: 'in_progress', currentStage: null, stages };
};

const StageDots = ({ stages, accentVar }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
    {stages
    .filter(s => s.status !== null)
    .map((s, i) => {
      const isDone = s.status === 'Completed';
      const isError = s.status === 'Error';
      const isActive = s.status === 'Started';
      const isPending = !s.status;
      return (
        <span
          key={s.key}
          title={`${s.label}: ${s.status || 'Pending'}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 9, fontFamily: "'Inconsolata', monospace", fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            padding: '2px 6px', borderRadius: 4,
            color: isError ? 'var(--red, #B22222)'
                 : isDone ? '#1b5e20'
                 : isActive ? accentVar
                 : 'var(--ink3)',
            background: isError ? 'var(--red-soft, rgba(178,34,34,0.10))'
                      : isDone ? 'rgba(46,125,50,0.10)'
                      : isActive ? 'color-mix(in srgb, ' + accentVar + ' 14%, transparent)'
                      : 'var(--surf2)',
            opacity: isPending ? 0.55 : 1,
          }}
        >
          {isDone && <CheckCircle2 size={10} />}
          {isError && <XCircle size={10} />}
          {isActive && <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} />}
          {s.label}
        </span>
      );
    })}
  </div>
);

/**
 * One side of the dual loader — either Patent or Product.
 */
const AnalysisPipelinePanel = ({
  title,
  icon,
  flags,
  kind,            // 'patent' | 'product'
  timeTaken,       // e.g. "01h 10m 30s"
  accentVar = 'var(--accent)',
  presentClaimTypes,
}) => {
  const { state, currentStage, stages, erroredAt } = deriveStageState(flags, kind, presentClaimTypes);

  const headline =
    state === 'completed' ? `${title} analysis completed`
    : state === 'error'    ? `${title} analysis failed`
    : state === 'idle'     ? `${title} analysis not started`
    : currentStage          ? `Running ${currentStage.label} ${title} Analysis…`
    : `${title} analysis in progress…`;

  const headlineColor =
    state === 'error' ? 'var(--red, #B22222)'
    : state === 'completed' ? 'var(--ink)'
    : 'var(--ink)';

  return (
    <div style={{
      flex: 1, minWidth: 260,
      border: '1px solid var(--rule2)', borderRadius: 10,
      padding: '16px 18px',
      background: state === 'error' ? 'var(--red-soft, rgba(178,34,34,0.05))' : 'var(--surf)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: state === 'error' ? 'var(--red-soft, rgba(178,34,34,0.10))' : 'var(--acc-soft)',
        }}>
          {state === 'in_progress' ? (
            <RefreshCw size={15} color={accentVar} style={{ animation: 'spin 1.2s linear infinite' }} />
          ) : state === 'completed' ? (
            <CheckCircle2 size={16} color="#2E7D32" />
          ) : state === 'error' ? (
            <XCircle size={16} color="var(--red, #B22222)" />
          ) : (
            icon
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: headlineColor, margin: '0 0 3px' }}>
            {headline}
          </p>
          {state === 'error' && erroredAt && (
            <p style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 10.5, color: 'var(--ink3)',
              margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Halted at {erroredAt.label} — later stages were not run
            </p>
          )}
          {timeTaken && (
            <p style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 10.5, color: 'var(--ink3)',
              margin: 0, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Clock size={11} />
              Last run took {timeTaken}
            </p>
          )}
        </div>
      </div>

      {stages.some(s => s.status) && (
        <StageDots stages={stages} accentVar={accentVar} />
      )}
    </div>
  );
};

/**
 * Top-level analysis status block. Replaces the previous single
 * "Analysis in progress" / "Analysis failed" block in Potential Matches.
 *
 * Expected caseData fields (per spec):
 *  - infringement_analysis_status: "Started" | "Completed" | "Error"
 *  - patent_status_flags: { asserted_claims_patent_analysis, independent_claims_patent_analysis,
 *      core_claims_patent_analysis, pivotal_claims_patent_analysis, generic_claims_patent_analysis }
 *  - product_status_flags: { ...same shape with _product_analysis suffix }
 *  - product_analysis_time_taken / patent_analysis_time_taken: "01h 10m 30s"
 *  - last_infringement_analysis_date: ISO/date string
 */
const InfringementAnalysisStatus = ({
  overallStatus,           // caseData.infringement_analysis_status
  patentFlags,              // caseData.patent_status_flags
  productFlags,             // caseData.product_status_flags
  patentTimeTaken,          // caseData.patent_analysis_time_taken
  productTimeTaken,         // caseData.product_analysis_time_taken
  lastAnalysisDate,         // caseData.last_infringement_analysis_date
  progressMsg,
  presentClaimTypes,
  onRetry,
  formatDate,               // optional formatter fn(dateString) => string
}) => {
  const overall = String(overallStatus || '').toLowerCase();
  const isFailed = overall === 'error';

  const isInFlight = isAnalysisInFlight(overallStatus);

  const formattedDate = lastAnalysisDate
    ? (formatDate ? formatDate(lastAnalysisDate) : new Date(lastAnalysisDate).toLocaleString())
    : null;

  return (
    <div className="pd-card-body" style={{ marginBottom: 16 }}>

       {isInFlight && progressMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 14, paddingBottom: 14,
          borderBottom: '1px solid var(--rule2)',
        }}>
          <div style={{
            width: 28, height: 28, flexShrink: 0,
            border: '2.5px solid var(--rule2)',
            borderTop: '2.5px solid var(--amber, #b45309)',
            borderRadius: '50%',
            animation: 'spin 1.2s linear infinite',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', margin: '0 0 2px' }}>
              {progressMsg.title}
            </p>
            <p style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 11, color: 'var(--ink3)', margin: 0,
            }}>
              {progressMsg.detail}
            </p>
          </div>
          <span style={{
            flexShrink: 0,
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
      )}

      {/* ── Last-run summary strip ── */}
      {(formattedDate || patentTimeTaken || productTimeTaken) && (
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14,
          marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--rule2)',
        }}>
          {formattedDate && (
            <span style={{
              fontFamily: "'Inconsolata', monospace", fontSize: 11, color: 'var(--ink3)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Clock size={12} />
              Last analysis: {formattedDate}
            </span>
          )}{/*
          {patentTimeTaken && (
            <span className="pcard-num" style={{ margin: 0 }}>
              Patent run · {patentTimeTaken}
            </span>
          )}
          {productTimeTaken && (
            <span className="pcard-num" style={{ margin: 0 }}>
              Product run · {productTimeTaken}
            </span>
          )}*/}
        </div>
      )}

      {/* ── Dual parallel pipelines ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <AnalysisPipelinePanel
          title="Patent"
          icon={<span style={{ fontSize: 15 }}>📄</span>}
          flags={patentFlags}
          kind="patent"
          timeTaken={patentTimeTaken}
          accentVar="var(--accent)"
          presentClaimTypes={presentClaimTypes}
        />
        <AnalysisPipelinePanel
          title="Product"
          icon={<span style={{ fontSize: 15 }}>🛒</span>}
          flags={productFlags}
          kind="product"
          timeTaken={productTimeTaken}
          accentVar="var(--amber, #b45309)"
          presentClaimTypes={presentClaimTypes}
        />
      </div>

      {/* ── Retry action when overall status errored ── */}
      {isFailed && onRetry && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--rule2)',
        }}>
          <button className="btn-new" onClick={onRetry}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Retry Analysis
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default InfringementAnalysisStatus;
