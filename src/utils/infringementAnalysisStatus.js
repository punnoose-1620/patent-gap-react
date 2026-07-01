/**
 * Shared infringement-analysis status helpers.
 * Supports legacy statuses (Failed during …) and new backend flags
 * (Started, Patent/Product Sources Completed, Completed, Error: …).
 */

export function normalizeAnalysisStatus(status) {
  return String(status ?? '').trim().toLowerCase();
}

export function isAnalysisUnknown(status) {
  const s = normalizeAnalysisStatus(status);
  return s === 'unknown' || s === 'none' || s === '';
}

export function isAnalysisFailed(status) {
  const s = normalizeAnalysisStatus(status);
  return s.includes('failed') || s.startsWith('error');
}

/** Both patent and product threads finished. */
export function isAnalysisCompleted(status) {
  return normalizeAnalysisStatus(status) === 'completed';
}

/** One thread finished; the other may still be running (new backend flow). */
export function isAnalysisPartial(status) {
  const s = normalizeAnalysisStatus(status);
  return s === 'patent sources completed' || s === 'product sources completed';
}

/** Legacy-only: old runs that never set final Completed. */
export function isLegacyAnalysisDone(status) {
  const s = normalizeAnalysisStatus(status);
  return (
    s === 'patent sources completed' ||
    s === 'product sources completed'
  );
}

export function isAnalysisInFlight(status) {
  if (isAnalysisUnknown(status) || isAnalysisCompleted(status) || isAnalysisFailed(status) || isAnalysisPartial(status)) {
    return false;
  }
  return true;
}

export function getAnalysisProgressMessage(status) {
  const s = normalizeAnalysisStatus(status);
  const raw = String(status ?? '').trim();

  if (s === 'patent sources completed') {
    return {
      title: 'Patent analysis complete',
      detail:
        'Infringing patents found and analysis completed. Searching for infringing products…',
    };
  }
  if (s === 'product sources completed') {
    return {
      title: 'Product analysis complete',
      detail:
        'Infringing products found and analysis completed. Searching for infringing patents…',
    };
  }
  if (s === 'started') {
    return {
      title: 'Analysis in progress',
      detail:
        'Searching for infringing patents and products. This may take a while.',
    };
  }
  if (s === 'pending') {
    return { title: 'Analysis pending…', detail: 'Your analysis is queued.' };
  }
  if (s === 'processing') {
    return { title: 'Processing analysis…', detail: 'Processing your infringement analysis.' };
  }
  if (s === 'running' || s === 'in_progress') {
    return { title: 'Running infringement analysis…', detail: 'Analysis is in progress.' };
  }
  if (s === 'queued') {
    return { title: 'Analysis queued…', detail: 'Your analysis will start shortly.' };
  }

  return {
    title: 'Analysis in progress',
    detail: raw
      ? `Status: ${raw}. We are working on your infringement analysis.`
      : 'We are working on your infringement analysis.',
  };
}

/** Stop polling when analysis reaches a terminal state. */
export function isAnalysisTerminal(status) {
  return isAnalysisCompleted(status) || isAnalysisFailed(status) || isAnalysisPartial(status);
}
