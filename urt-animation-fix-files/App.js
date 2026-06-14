import React, { useEffect, useMemo, useState } from 'react';
import { askReconTower } from './api';
import { USE_MOCK_RESPONSES } from './config';

const TOOL_ALIASES = {
  getDailySummary: 'getDailySummary',
  getDetailsForRecon: 'getDetailsForRecon',
  getPipelineStatusByReconId: 'getDetailsForRecon',
  predictSlaRisk: 'predictSlaRisk',
  predictEtaAndRiskByReconId: 'predictSlaRisk',
  detectAnomaliesByReconId: 'detectAnomaliesByReconId',
  resolveIncidentByReconId: 'resolveIncidentByReconId',
  getCostReport: 'getCostReport'
};

const WORKFLOW_LABELS = {
  getDailySummary: 'Operational Brief',
  getDetailsForRecon: 'Investigation Summary',
  predictSlaRisk: 'AI Prediction',
  detectAnomaliesByReconId: 'AI Findings',
  resolveIncidentByReconId: 'Recommended Resolution',
  getCostReport: 'Cost Analysis'
};

const SCREEN_LABELS = {
  getDailySummary: 'Operational Brief',
  getDetailsForRecon: 'Investigation Workspace',
  predictSlaRisk: 'SLA Intelligence',
  detectAnomaliesByReconId: 'Anomaly Investigation',
  resolveIncidentByReconId: 'Resolution Workspace',
  getCostReport: 'Cost Intelligence'
};

const STAGE_LABELS = {
  PRE_MATCH: 'Prematch',
  PRE_PROCESSING: 'Prematch',
  MATCH: 'Match',
  POST_MATCH: 'Post Match',
  METRICS: 'Metrics',
  REPORTS: 'Reports',
  REPORT: 'Reports'
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '—') {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value?.name) return String(value.name);
  if (value?.label) return String(value.label);
  if (value?.value) return String(value.value);
  return JSON.stringify(value);
}

function normalizeToolName(toolName) {
  return TOOL_ALIASES[toolName] || null;
}

function getToolModel(response) {
  const firstTool = safeArray(response?.toolCalls)[0];
  const rawToolName = firstTool?.toolName;
  const toolName = normalizeToolName(rawToolName);
  const rawResult = firstTool?.toolResponse?.result ?? firstTool?.toolResponse ?? {};

  return {
    answer: response?.answer || 'No narrative was returned for this request.',
    rawToolName,
    toolName,
    result: normalizeResult(toolName, rawResult),
    hasTool: Boolean(rawToolName),
    hasKnownTool: Boolean(toolName)
  };
}

function normalizeResult(toolName, result) {
  switch (toolName) {
    case 'getDailySummary':
      return normalizeDailySummary(result);
    case 'getDetailsForRecon':
      return normalizeInvestigationResult(result);
    case 'predictSlaRisk':
      return normalizeSlaResult(result);
    case 'detectAnomaliesByReconId':
      return normalizeAnomalyResult(result);
    case 'resolveIncidentByReconId':
      return normalizeResolutionResult(result);
    case 'getCostReport':
      return normalizeCostResult(result);
    default:
      return result || {};
  }
}

function normalizeStatus(status = '') {
  return String(status).replace(/_/g, ' ').toLowerCase();
}

function statusClass(status = '') {
  const value = String(status).toUpperCase();
  if (value === 'IN_PROGRESS' || value === 'RUNNING') return 'running';
  if (value === 'COMPLETED' || value === 'SUCCESS') return 'completed';
  if (value === 'FAILED' || value === 'ERROR') return 'failed';
  if (value === 'NOT_STARTED' || value === 'PENDING') return 'pending';
  return 'pending';
}

function titleCase(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return 'Unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getDurationMinutes(start, end) {
  if (!start || !end) return null;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return null;
  return Math.max(0, Math.round((endTime - startTime) / 60000));
}

function getStageDisplayName(stage = {}) {
  const raw = String(stage.type || stage.name || stage.stageType || stage.stage || '');
  if (raw.includes('PRE_PROCESSING') || raw.includes('PRE_MATCH')) return 'Prematch';
  if (raw.includes('POST_MATCH')) return 'Post Match';
  if (raw.includes('MATCH')) return 'Match';
  if (raw.includes('METRIC')) return 'Metrics';
  if (raw.includes('REPORT')) return 'Reports';
  return STAGE_LABELS[raw] || titleCase(raw || 'Stage');
}

function metricValue(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function currencySymbol(currency) {
  const code = String(currency || 'USD').toUpperCase();
  if (code === 'USD') return '$';
  if (code === 'INR') return '₹';
  if (code === 'EUR') return '€';
  if (code === 'GBP') return '£';
  return `${code} `;
}

function money(currency, value) {
  const symbol = currencySymbol(currency || 'USD');
  const numeric = Number(value);
  const amount = value === undefined || value === null || value === '' || Number.isNaN(numeric)
    ? '—'
    : numeric.toLocaleString('en-US', { minimumFractionDigits: numeric < 1 && numeric > 0 ? 2 : 0, maximumFractionDigits: 4 });
  return symbol.endsWith(' ') ? `${symbol}${amount}` : `${symbol}${amount}`;
}

function normalizeDailySummary(result = {}) {
  const rawRecons = safeArray(result.recons);
  const recons = rawRecons.map((recon) => {
    const progress = Number(recon.progress || 0);
    return {
      ...recon,
      reconId: recon.reconId || recon.identifier || recon.executionId,
      name: recon.name || recon.reconName || recon.identifier || recon.reconId || 'Recon',
      owner: recon.owner || recon.team || 'Ops',
      currentStage: recon.currentStage || inferStageFromProgress(progress, recon.status),
      sla: recon.sla || (recon.status === 'FAILED' ? 'Attention' : recon.status === 'IN_PROGRESS' ? 'Tracking' : 'Complete'),
      predictedCompletion: recon.predictedCompletion || (recon.endTime ? formatDateTime(recon.endTime) : 'Pending'),
      stages: safeArray(recon.stages).length ? safeArray(recon.stages) : buildLaneStages(progress, recon.status)
    };
  });

  return {
    ...result,
    generatedAt: result.generatedAt || result.meta?.generatedAt,
    recons,
    charts: normalizeGenericCharts(result.charts)
  };
}

function inferStageFromProgress(progress, status) {
  if (status === 'FAILED') return 'Prematch';
  if (progress >= 90) return 'Reports';
  if (progress >= 70) return 'Post Match';
  if (progress >= 45) return 'Match';
  if (progress > 0) return 'Prematch';
  return 'Prematch';
}

function buildLaneStages(progress = 0, status = '') {
  const stageKeys = ['PRE_PROCESSING', 'MATCH', 'POST_MATCH', 'METRICS', 'REPORT'];
  const thresholds = [10, 35, 65, 85, 100];
  const activeIndex = thresholds.findIndex((threshold) => Number(progress) < threshold);
  const inferredActive = activeIndex === -1 ? 4 : activeIndex;

  return stageKeys.map((stage, index) => {
    let stageStatus = 'NOT_STARTED';
    if (status === 'FAILED' && index === inferredActive) stageStatus = 'FAILED';
    else if (index < inferredActive || progress >= 100) stageStatus = 'COMPLETED';
    else if (index === inferredActive && status === 'IN_PROGRESS') stageStatus = 'IN_PROGRESS';
    else if (index === inferredActive && status === 'FAILED') stageStatus = 'FAILED';
    return {
      name: stage,
      type: stage,
      status: stageStatus,
      duration: null
    };
  });
}

function normalizeInvestigationResult(result = {}) {
  const stages = safeArray(result.stages);
  const nodes = safeArray(result.nodes);
  const stageNodes = nodes.filter((node) => node.nodeType === 'STAGE');
  const sourceStages = stages.length ? stages : stageNodes;

  const activeStage =
    sourceStages.find((stage) => stage.status === 'IN_PROGRESS') ||
    sourceStages.find((stage) => stage.status === 'FAILED') ||
    sourceStages[sourceStages.length - 1];

  const timelineStages = sourceStages.map((stage) => ({
    ...stage,
    name: stage.name || stage.stageName || stage.type,
    type: stage.type || stage.stageType,
    status: stage.status || 'NOT_STARTED',
    start: formatDateTime(stage.startTime),
    end: stage.endTime ? formatDateTime(stage.endTime) : null,
    duration: stage.duration || getDurationMinutes(stage.startTime, stage.endTime),
    issue: stage.issue || stage.failureReason || stage.error
  }));

  return {
    ...result,
    reconId: result.reconId || result.identifier,
    name: result.name || result.reconName || result.identifier || result.reconId,
    status: result.status || result.overallStatus,
    currentStage: result.currentStage || activeStage?.name,
    stage: result.stage || activeStage?.type || activeStage?.name,
    runtimeMinutes: result.runtimeMinutes || getDurationMinutes(result.startTime, result.endTime || new Date().toISOString()),
    executionTimeline: result.executionTimeline || timelineStages,
    stageHistory: result.stageHistory || timelineStages,
    files: safeArray(result.files).length ? safeArray(result.files) : safeArray(result.filesReceived),
    owner: result.owner || result.team || 'Ops',
    sla: result.sla || (result.isLatest ? 'Latest execution' : 'Unavailable')
  };
}

function normalizeSlaResult(result = {}) {
  const drivers = safeArray(result.drivers).length
    ? result.drivers
    : safeArray(result.reasons).map((reason, index) => ({
        label: `Reason ${index + 1}`,
        detail: safeText(reason),
        impact: result.riskLevel || 'Risk driver'
      }));

  return {
    ...result,
    name: result.name || result.reconId,
    riskLevel: result.riskLevel,
    confidence: result.confidence ?? (result.available ? 82 : 0),
    predictedCompletion: result.predictedCompletion || result.etaIsoP50 || result.etaIsoP90,
    slaDeadline: result.slaDeadline || `${metricValue(result.slaSec)} sec SLA`,
    drivers,
    charts: normalizeGenericCharts(result.charts)
  };
}

function normalizeAnomalyResult(result = {}) {
  return {
    ...result,
    name: result.name || result.reconId,
    anomalies: safeArray(result.anomalies).map((anomaly) => ({
      ...anomaly,
      delta: anomaly.delta || calculateDelta(anomaly.actual, anomaly.baseline)
    })),
    charts: normalizeGenericCharts(result.charts)
  };
}

function normalizeResolutionResult(result = {}) {
  return {
    ...result,
    name: result.name || result.reconId,
    recommendedNextSteps: safeArray(result.recommendedNextSteps).map((step) => {
      if (typeof step === 'string') {
        return { step, owner: result.owner?.team || 'Ops', priority: 'Recommended', eta: 'Next' };
      }
      return step;
    }),
    evidence: safeArray(result.evidence),
    similarIncidents: safeArray(result.similarIncidents),
    rcaDraft: result.rcaDraft || {}
  };
}

function normalizeCostResult(result = {}) {
  const byRecon = safeArray(result.costByRecon).map((item) => ({
    ...item,
    cost: item.cost ?? item.totalCost,
    reason: item.reason || item.primaryDriver || item.evidence
  }));
  const byStage = safeArray(result.costByStage).map((item) => ({
    ...item,
    share: item.share ?? item.percentage ?? item.percentageOfTotal
  }));
  return { ...result, costByRecon: byRecon, costByStage: byStage };
}

function normalizeGenericCharts(charts) {
  return safeArray(charts).map((chart) => ({
    ...chart,
    x: safeArray(chart.x),
    series: safeArray(chart.series)
  }));
}

function calculateDelta(actual, baseline) {
  const actualNumber = extractNumber(actual);
  if (actualNumber === null) return 'Not calculated';

  const baselineText = String(baseline || '');
  const p90Match = baselineText.match(/p90\s*[=:]\s*([\d,.]+)/i);
  const p10Match = baselineText.match(/p10\s*[=:]\s*([\d,.]+)/i);
  const directBaseline = extractNumber(baseline);

  if (p90Match) {
    const p90 = Number(p90Match[1].replace(/,/g, ''));
    if (actualNumber > p90 && p90 > 0) return `+${formatNumber(((actualNumber - p90) / p90) * 100)}% vs p90`;
    if (p10Match) {
      const p10 = Number(p10Match[1].replace(/,/g, ''));
      if (actualNumber < p10 && p10 > 0) return `-${formatNumber(((p10 - actualNumber) / p10) * 100)}% vs p10`;
    }
    return 'Within band';
  }

  if (directBaseline !== null && directBaseline > 0) {
    const deltaPct = ((actualNumber - directBaseline) / directBaseline) * 100;
    return `${deltaPct >= 0 ? '+' : ''}${formatNumber(deltaPct)}%`;
  }

  return 'Not calculated';
}

function extractNumber(value) {
  if (typeof value === 'number') return value;
  const match = String(value || '').match(/[\d,.]+/);
  return match ? Number(match[0].replace(/,/g, '')) : null;
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatSeconds(value) {
  const number = extractNumber(value);
  if (number === null) return safeText(value);
  if (number < 60) return `${Math.round(number)}s`;
  if (number < 3600) return `${Math.floor(number / 60)}m ${Math.round(number % 60)}s`;
  return `${Math.floor(number / 3600)}h ${Math.round((number % 3600) / 60)}m`;
}

function formatMetricForContext(value, context = '') {
  const text = safeText(value);
  if (/sec|duration|time/i.test(context) || /seconds?|p90=\d+s?/i.test(text)) {
    return text.replace(/([\d,.]+)\s*seconds?/i, (_, n) => formatSeconds(n)).replace(/p90\s*=\s*([\d,.]+)s?/i, (_, n) => `p90 ${formatSeconds(n)}`).replace(/p10\s*=\s*([\d,.]+)s?/i, (_, n) => `p10 ${formatSeconds(n)}`);
  }
  return text;
}

function App() {
  const [question, setQuestion] = useState('How are today\'s recons performing?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const model = useMemo(() => getToolModel(response), [response]);

  useEffect(() => {
    document.documentElement.classList.add('urt-motion');

    const selector = [
      '.answer-panel',
      '.loading-card',
      '.generic-response',
      '.glass-card',
      '.kpi-card',
      '.landing-card',
      '.lane-row',
      '.attention-item',
      '.timeline-item',
      '.file-card',
      '.driver-card',
      '.anomaly-card',
      '.action-item',
      '.incident-item',
      '.cost-anomaly-item',
      '.recon-cost-row',
      '.cost-grid-card',
      '.cost-stage-row',
      '.generic-chart-row',
      '.daily-chart-mini',
      '.daily-mini-row',
      '.thin-stage',
      '.overview-panel',
      '.metric-mini'
    ].join(', ');

    const targets = Array.from(document.querySelectorAll(selector));

    targets.forEach((element, index) => {
      element.classList.remove('is-visible');
      element.classList.add('reveal-ready');
      element.style.setProperty('--reveal-delay', `${Math.min(index * 92, 920)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.requestAnimationFrame(() => {
              entry.target.classList.add('is-visible');
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.22, rootMargin: '0px 0px -18% 0px' }
    );

    const observeTimer = window.setTimeout(() => {
      targets.forEach((element) => observer.observe(element));
    }, 120);

    return () => {
      window.clearTimeout(observeTimer);
      observer.disconnect();
    };
  }, [response, loading, model.toolName]);

  async function submit(nextQuestion = question) {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      document.getElementById('workspace-response-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    try {
      const payload = await askReconTower(nextQuestion);
      setResponse(payload || { answer: 'No response returned.', toolCalls: [] });
    } catch (err) {
      setError(err?.message || 'The operational service is unavailable.');
      setResponse({
        answer: 'The workspace could not reach the operational intelligence service. No data was changed. Retry when the API is available.',
        toolCalls: []
      });
    } finally {
      setLoading(false);
    }
  }

  function runSuggestion(text) {
    setQuestion(text);
    submit(text);
  }

  const showWorkflow = response && model.hasKnownTool;
  const showGeneric = response && !model.hasKnownTool;

  return (
    <div className={`app-shell ${response || loading ? 'has-activity' : ''}`}>
      <TopHeader />
      <main className="workspace-shell">
        <section className={`hero-panel ${loading ? 'is-routing' : ''}`}>
          <div className="hero-copy">
            <p className="eyebrow">Unified Recon Tower</p>
            <h1>Predict. Detect. Resolve.</h1>
            <p className="hero-text">A single operations workspace that starts with a question and ends with evidence-backed action.</p>
          </div>

          <div className="ask-console">
            <div className="ask-console-topline">
              <span>Question</span>
              <span className="mode-pill">{USE_MOCK_RESPONSES ? 'Mock mode' : 'API mode'}</span>
            </div>
            <div className="ask-row">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submit();
                }}
                placeholder="Ask where a recon is, SLA risk, anomaly reason, or next action..."
              />
              <button onClick={() => submit()} disabled={loading}>{loading ? 'Routing' : 'Ask'}</button>
            </div>
            <div className="suggestion-row">
              {[
                'Show today\'s recon status',
                'Where is MFSCPP_POS?',
                'Will MFSCPP_POS meet SLA?',
                'Why did MFSCPP_POS fail?',
                'What should I do next?',
                'Show cost by recon'
              ].map((item) => (
                <button key={item} type="button" onClick={() => runSuggestion(item)}>{item}</button>
              ))}
            </div>
          </div>
        </section>

        <div id="workspace-response-anchor" className="workspace-response-anchor" />
        {loading && <LoadingState />}
        {!loading && showWorkflow && (
          <>
            <AnswerPanel label={WORKFLOW_LABELS[model.toolName]} answer={model.answer} screen={SCREEN_LABELS[model.toolName]} error={error} />
            <WorkflowRouter model={model} />
          </>
        )}
        {!loading && showGeneric && <GenericResponse answer={model.answer} rawToolName={model.rawToolName} error={error} />}
        {!loading && !response && <DefaultLanding onSelect={runSuggestion} />}
      </main>
    </div>
  );
}

function TopHeader() {
  return (
    <header className="top-header">
      <ScrollProgress />
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <div>
          <div className="bank-name">JPMorgan Chase</div>
          <div className="product-line">Unified Recon Tower</div>
        </div>
      </div>
      <nav className="header-nav header-mantra" aria-label="Product promise">
        <span>Predict.</span><span>Detect.</span><span>Resolve.</span>
      </nav>
    </header>
  );
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return <span className="scroll-progress" style={{ '--scroll': progress / 100 }} aria-hidden="true" />;
}

function DefaultLanding({ onSelect }) {
  return (
    <section className="landing-grid">
      {[
        { label: 'What is happening?', detail: 'Daily recon pulse, failures, run state, and operational throughput.', prompt: 'Show today\'s recon status' },
        { label: 'What will happen?', detail: 'SLA forecasts, confidence, risk drivers, and predicted completion.', prompt: 'Which recons are at risk?' },
        { label: 'Why did it happen?', detail: 'Evidence-first anomaly investigation across stage runtime, records, and match quality.', prompt: 'Show anomalies for MFSCPP_POS' },
        { label: 'What should I do next?', detail: 'Recommended actions, owner handoff, similar incidents, and RCA draft.', prompt: 'What should I do next for MFSCPP_POS?' }
      ].map((item) => (
        <button className="landing-card" key={item.label} onClick={() => onSelect(item.prompt)}>
          <span>{item.label}</span><p>{item.detail}</p>
        </button>
      ))}
    </section>
  );
}

function LoadingState() {
  const messages = ['Classifying question', 'Selecting workflow', 'Fetching execution evidence', 'Normalizing response', 'Building workspace'];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setMessageIndex((value) => (value + 1) % messages.length), 1350);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="loading-card">
      <div className="scan-loader">
        <span />
        <i />
      </div>
      <p>{messages[messageIndex]}</p>
      <small>Keeping the scan alive until the API response returns.</small>
    </section>
  );
}

function AnswerPanel({ label, answer, screen, error }) {
  return (
    <section className={`answer-panel ${error ? 'is-error' : ''}`}>
      <div>
        <p className="eyebrow">{label}</p>
        <h2>{screen || 'Generic Response'}</h2>
      </div>
      <MarkdownText value={answer} />
      {error && <div className="error-strip">API unavailable: {error}</div>}
    </section>
  );
}

function WorkflowRouter({ model }) {
  switch (model.toolName) {
    case 'getDailySummary':
      return <OperationalBrief result={model.result} />;
    case 'getDetailsForRecon':
      return <InvestigationWorkspace result={model.result} />;
    case 'predictSlaRisk':
      return <SlaIntelligence result={model.result} />;
    case 'detectAnomaliesByReconId':
      return <AnomalyInvestigation result={model.result} />;
    case 'resolveIncidentByReconId':
      return <ResolutionWorkspace result={model.result} />;
    case 'getCostReport':
      return <CostIntelligence result={model.result} />;
    default:
      return null;
  }
}

function GenericResponse({ answer, rawToolName, error }) {
  return (
    <section className={`generic-response ${error ? 'is-error' : ''}`}>
      <p className="eyebrow">Generic Answer Mode</p>
      <h2>{rawToolName ? `Unsupported tool: ${rawToolName}` : 'No workflow tool returned'}</h2>
      <MarkdownText value={answer} />
      {error && <div className="error-strip">API unavailable: {error}</div>}
    </section>
  );
}

function MarkdownText({ value }) {
  const text = safeText(value, '');
  const lines = text.replace(/\\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return <p>—</p>;

  return (
    <div className="md-text">
      {lines.map((line, index) => {
        const heading = line.match(/^(#{2,4})\s*(.*)$/);
        if (heading) return <h4 key={index}>{renderInline(heading[2])}</h4>;
        const bullet = line.match(/^[-*]\s+(.*)$/);
        if (bullet) return <p className="md-bullet" key={index}>{renderInline(bullet[1])}</p>;
        const numbered = line.match(/^(\d+)\.\s+(.*)$/);
        if (numbered) return <p className="md-number" key={index}><span>{numbered[1]}</span>{renderInline(numbered[2])}</p>;
        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function OperationalBrief({ result }) {
  const recons = safeArray(result?.recons);
  const failed = recons.filter((item) => item.status === 'FAILED');
  const running = recons.filter((item) => item.status === 'IN_PROGRESS');
  const attention = [...failed, ...running].slice(0, 5);

  return (
    <section className="workflow-grid operational-brief">
      <div className="brief-headline glass-card span-12">
        <div><p className="eyebrow">Business date</p><h3>{metricValue(result?.date)}</h3></div>
        <div><p className="eyebrow">Generated</p><h3>{formatDateTime(result?.generatedAt)}</h3></div>
        <div><p className="eyebrow">Overall progress</p><h3>{metricValue(result?.overallProgress)}%</h3></div>
        <div className="progress-orb" style={{ '--value': `${metricValue(result?.overallProgress, 0)}%` }}><span>{Math.round(metricValue(result?.overallProgress, 0))}%</span></div>
      </div>

      <KpiCard label="Total recons" value={result?.totalRecons} detail="In today’s run set" />
      <KpiCard label="Running" value={result?.inProgressCount} detail={`${running.length} active execution lanes`} tone="amber" />
      <KpiCard label="Failed" value={result?.failedCount} detail={`${failed.length} require operator attention`} tone="red" />
      <KpiCard label="Completed" value={result?.completedCount} detail="Reports generated" tone="green" />

      <div className="glass-card span-12 lanes-card">
        <SectionTitle eyebrow="Daily view" title="Execution lanes" helper="Each lane shows a recon moving through prematch, match, post match, metrics, and reports." />
        <ExecutionLanes recons={recons} />
      </div>

      <div className="glass-card span-7">
        <SectionTitle eyebrow="Attention queue" title="Where operators should look first" />
        <div className="attention-list">
          {attention.map((item, index) => (
            <div className="attention-item" key={item.reconId || item.executionId || index}>
              <span className="rank">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{item.name}</strong>
                <p>{getAttentionReason(item)}</p>
              </div>
              <span className={`status-chip ${statusClass(item.status)}`}>{titleCase(item.currentStage || item.status)}</span>
            </div>
          ))}
          {!attention.length && <EmptyState text="No failed or running recons in the current run set." />}
        </div>
      </div>

      <div className="glass-card span-5">
        <SectionTitle eyebrow="Run composition" title="State distribution" />
        <div className="distribution-stack">
          <DistributionRow label="Completed" value={result?.completedCount || 0} total={result?.totalRecons || 1} />
          <DistributionRow label="Running" value={result?.inProgressCount || 0} total={result?.totalRecons || 1} />
          <DistributionRow label="Failed" value={result?.failedCount || 0} total={result?.totalRecons || 1} />
          <DistributionRow label="Other" value={result?.otherCount || 0} total={result?.totalRecons || 1} />
        </div>
      </div>

      {!!result?.charts?.length && (
        <div className="glass-card span-12 daily-chart-card">
          <SectionTitle eyebrow="Supporting data" title="Run signal charts" />
          <DailySummaryCharts charts={result.charts} />
        </div>
      )}
    </section>
  );
}

function getAttentionReason(item) {
  const failedStage = safeArray(item.stages).find((stage) => stage.status === 'FAILED');
  if (failedStage?.issue) return failedStage.issue;
  if (item.status === 'FAILED') return `Failed execution. Investigate executionId=${safeText(item.executionId || item.reconId)}`;
  if (item.status === 'IN_PROGRESS') return `${metricValue(item.progress, 0)}% complete. Current stage: ${titleCase(item.currentStage || 'tracking')}.`;
  return 'Operator review recommended.';
}

function KpiCard({ label, value, detail, tone = 'neutral' }) {
  return <div className={`kpi-card glass-card tone-${tone}`}><p>{label}</p><strong>{metricValue(value)}</strong><span>{detail}</span></div>;
}

function SectionTitle({ eyebrow, title, helper }) {
  return <div className="section-title"><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div>{helper && <span>{helper}</span>}</div>;
}

function ExecutionLanes({ recons }) {
  return (
    <div className="execution-lanes">
      <div className="lane-header"><span>Recon</span>{['Prematch', 'Match', 'Post Match', 'Metrics', 'Reports'].map((stage) => <span key={stage}>{stage}</span>)}<span>SLA</span></div>
      {recons.map((recon, index) => (
        <div className="lane-row" key={recon.reconId || recon.executionId || index}>
          <div className="lane-recon"><strong>{recon.name}</strong><span>{recon.owner}</span></div>
          {safeArray(recon.stages).slice(0, 5).map((stage, stageIndex) => (
            <div className={`lane-segment status-${statusClass(stage.status)}`} key={`${recon.reconId}-${stage.name}-${stageIndex}`}>
              <span className="segment-line" /><span className="segment-dot" /><small>{stage.duration ? `${stage.duration}m` : titleCase(stage.status)}</small>
            </div>
          ))}
          <div className="lane-sla"><span>{recon.sla}</span><em>{recon.predictedCompletion}</em></div>
        </div>
      ))}
      {!recons.length && <EmptyState text="No recon execution lanes returned by the service." />}
    </div>
  );
}

function DistributionRow({ label, value, total }) {
  const width = Math.min(100, Math.round((value / total) * 100));
  return <div className="distribution-row"><div><span>{label}</span><strong>{value}</strong></div><div className="thin-meter"><span style={{ width: `${width}%` }} /></div></div>;
}


function DailySummaryCharts({ charts }) {
  if (!charts?.length) return <EmptyState text="No supporting chart returned." />;
  return (
    <div className="daily-chart-grid">
      {charts.map((chart, index) => {
        const labels = safeArray(chart.x);
        const series = safeArray(chart.series)[0] || { data: [] };
        const values = safeArray(series.data);
        const max = Math.max(...values.map((value) => Number(value) || 0), 1);
        return (
          <div className="daily-chart-mini" key={`${chart.title}-${index}`}>
            <strong>{chart.title || 'Chart'}</strong>
            <div className="daily-mini-bars">
              {labels.map((label, rowIndex) => {
                const value = Number(values[rowIndex]) || 0;
                const width = Math.max(value > 0 ? 8 : 2, (value / max) * 100);
                return (
                  <div className="daily-mini-row" key={`${label}-${rowIndex}`}>
                    <span>{titleCase(label)}</span>
                    <div><i style={{ '--bar': `${width}%` }} /></div>
                    <em>{formatNumber(value)}</em>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InvestigationWorkspace({ result }) {
  const [tab, setTab] = useState('Overview');
  const stages = safeArray(result?.executionTimeline || result?.stageHistory || result?.stages);
  const files = safeArray(result?.files);

  return (
    <section className="workflow-grid investigation-workspace">
      <div className="glass-card span-12 recon-identity-card">
        <div>
          <p className="eyebrow">Recon investigation</p>
          <h3>{metricValue(result?.name || result?.reconId, 'Recon unavailable')}</h3>
          <p>{getStageDisplayName({ name: result?.stage || result?.currentStage })} · {titleCase(result?.status || 'Unknown status')}</p>
        </div>
        <div className="identity-metrics">
          <MetricMini label="Progress" value={`${metricValue(result?.progress, 0)}%`} />
          <MetricMini label="Runtime" value={`${metricValue(result?.runtimeMinutes, '—')}m`} />
          <MetricMini label="Owner" value={metricValue(result?.owner)} />
          <MetricMini label="SLA" value={metricValue(result?.sla)} />
        </div>
      </div>

      <div className="glass-card span-12 pipeline-card">
        <SectionTitle eyebrow="Execution journey" title="Thin-line stage flow" helper="The active run is rendered as a modern left-to-right operational pipeline." />
        <ThinLinePipeline stages={stages} />
      </div>

      <div className="glass-card span-12 tab-card">
        <div className="tab-row">{['Overview', 'Timeline', 'Files'].map((item) => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
        {tab === 'Overview' && <InvestigationOverview result={result} stages={stages} />}
        {tab === 'Timeline' && <TimelineView stages={stages} />}
        {tab === 'Files' && <FilesView files={files} />}
      </div>
    </section>
  );
}

function MetricMini({ label, value }) {
  return <div className="metric-mini"><span>{label}</span><strong>{safeText(value)}</strong></div>;
}

function ThinLinePipeline({ stages }) {
  return (
    <div className="thin-pipeline">
      {stages.map((stage, index) => (
        <div className={`thin-stage status-${statusClass(stage.status)}`} key={`${stage.name}-${index}`}>
          <div className="thin-rail"><span className="rail-fill" /><i /></div>
          <div className="stage-copy"><strong>{getStageDisplayName(stage)}</strong><span>{titleCase(stage.status || 'Pending')}</span><em>{stage.start || '—'} {stage.end ? `→ ${stage.end}` : ''}</em></div>
          {stage.issue && <p>{stage.issue}</p>}
        </div>
      ))}
      {!stages.length && <EmptyState text="No execution timeline returned." />}
    </div>
  );
}

function InvestigationOverview({ result, stages }) {
  const failedStage = stages.find((stage) => stage.status === 'FAILED');
  const activeStage = stages.find((stage) => stage.status === 'IN_PROGRESS') || failedStage || stages[stages.length - 1];
  const nextStage = stages.find((stage) => stage.status === 'NOT_STARTED');
  const completedCount = stages.filter((stage) => stage.status === 'COMPLETED').length;
  const totalTasks = stages.reduce((sum, stage) => sum + Number(stage.totalTasks || 0), 0);
  const activeTasks = stages.reduce((sum, stage) => sum + Number(stage.inProgressTasks || 0), 0);
  return (
    <div className="overview-grid investigation-overview-grid">
      <div className="overview-panel overview-primary">
        <p className="eyebrow">Current stage</p>
        <h4>{getStageDisplayName(activeStage || { name: result?.currentStage || result?.stage })}</h4>
        <p>{failedStage?.issue || (nextStage ? `${getStageDisplayName(nextStage)} is waiting for ${getStageDisplayName(activeStage)} to complete.` : 'No blocking stage issue was returned.')}</p>
      </div>
      <div className="overview-panel">
        <p className="eyebrow">Operator readout</p>
        <h4>{titleCase(result?.status || 'Unknown')}</h4>
        <p>{metricValue(result?.name || result?.reconId)} is {normalizeStatus(result?.status || 'unknown')} with {metricValue(result?.progress, 0)}% of the journey completed.</p>
      </div>
      <div className="overview-panel compact-signal">
        <p className="eyebrow">Stage coverage</p>
        <h4>{completedCount}/{stages.length || 0}</h4>
        <p>Completed stages</p>
      </div>
      <div className="overview-panel compact-signal">
        <p className="eyebrow">Tasks active</p>
        <h4>{activeTasks || '—'}</h4>
        <p>{totalTasks ? `${totalTasks} total tasks in stage model` : 'Task count not returned'}</p>
      </div>
    </div>
  );
}

function TimelineView({ stages }) {
  return (
    <div className="timeline-list">
      {stages.map((stage, index) => (
        <div className={`timeline-item status-${statusClass(stage.status)}`} key={`${stage.name}-${index}`}>
          <span className="timeline-marker" />
          <div><strong>{getStageDisplayName(stage)}</strong><p>{titleCase(stage.status)} · {stage.duration ? `${stage.duration} minutes` : 'Duration unavailable'}</p>{stage.issue && <em>{stage.issue}</em>}</div>
          <aside>{stage.start || '—'} {stage.end ? `→ ${stage.end}` : ''}</aside>
        </div>
      ))}
      {!stages.length && <EmptyState text="No timeline data available." />}
    </div>
  );
}

function FilesView({ files }) {
  return (
    <div className="files-grid">
      {files.map((file, index) => (
        <div className="file-card" key={file.fileName || index}>
          <span>{file.type || 'File'}</span><strong>{file.fileName}</strong>
          <p>{metricValue(file.records)} records · {file.status || 'Status unavailable'}</p><em>{file.receivedAt || file.receivedTime || 'Time unavailable'}</em>
        </div>
      ))}
      {!files.length && <EmptyState text="No file metadata returned for this recon." />}
    </div>
  );
}

function SlaIntelligence({ result }) {
  const drivers = safeArray(result?.drivers);
  const charts = safeArray(result?.charts);
  return (
    <section className="workflow-grid sla-workspace">
      <div className="glass-card span-5 forecast-card"><p className="eyebrow">Risk forecast</p><h3>{titleCase(result?.riskLevel || 'Unknown')}</h3><div className="confidence-ring" style={{ '--value': `${metricValue(result?.confidence, 0)}%` }}><span>{metricValue(result?.confidence, 0)}%</span><em>confidence</em></div></div>
      <div className="glass-card span-7 prediction-card">
        <SectionTitle eyebrow="Predicted outcome" title="SLA trajectory" />
        <div className="prediction-line">
          <MetricMini label="SLA" value={metricValue(result?.slaDeadline)} />
          <MetricMini label="ETA P50" value={formatDateTime(result?.etaIsoP50 || result?.predictedCompletion)} />
          <MetricMini label="ETA P90" value={formatDateTime(result?.etaIsoP90)} />
          <MetricMini label="Breach" value={result?.predictedSlaBreachP90 ? 'Yes' : 'No'} />
        </div>
        <SlaTrajectory result={result} charts={charts} />
      </div>
      <div className="glass-card span-12"><SectionTitle eyebrow="Drivers" title="Why the prediction moved" /><div className="driver-grid">{drivers.map((driver, index) => <div className="driver-card" key={driver.label || index}><span>{driver.impact || 'Impact unavailable'}</span><strong>{driver.label}</strong><p>{driver.detail}</p></div>)}{!drivers.length && <EmptyState text="No SLA drivers returned." />}</div></div>
    </section>
  );
}

function SlaTrajectory({ result, charts }) {
  const p50 = Number(result?.remainingP50Sec ?? 0);
  const p90 = Number(result?.remainingP90Sec ?? 0);
  const sla = Number(result?.slaSec ?? extractNumber(result?.slaDeadline) ?? 0);
  const breach = result?.predictedSlaBreachP90 || result?.predictedSlaBreachP50;
  const points = breach
    ? '10,88 145,74 280,52 420,26'
    : '10,72 145,66 280,58 420,48';
  const stage = result?.currentStageName || result?.currentStageType || result?.name || 'Current stage';
  return (
    <div className="sla-trajectory-card">
      <svg viewBox="0 0 440 112" role="img" aria-label="SLA trajectory chart">
        <path className="sla-grid-line" d="M10 88 H430" />
        <path className="sla-grid-line muted" d="M10 28 H430" />
        <path className="risk-line sla-risk-path" d={`M ${points}`} fill="none" />
        {[10, 145, 280, 420].map((x, index) => <circle className="risk-dot" key={x} cx={x} cy={[88, 74, 52, 26][index]} r="5" />)}
      </svg>
      <div className="sla-trajectory-meta">
        <span>{getStageDisplayName({ type: stage })}</span>
        <span>SLA {sla ? formatSeconds(sla) : '—'}</span>
        <span>P50 {formatSeconds(p50)}</span>
        <span>P90 {formatSeconds(p90)}</span>
      </div>
      <p>{breach ? 'Trajectory is above the SLA threshold. Active operator monitoring required.' : 'Trajectory is currently inside the SLA envelope.'}</p>
      {!!charts?.length && <GenericSeriesCharts charts={charts} compact />}
    </div>
  );
}

function AnomalyInvestigation({ result }) {
  const anomalies = safeArray(result?.anomalies);
  const charts = safeArray(result?.charts);
  return (
    <section className="workflow-grid anomaly-workspace">
      <div className="glass-card span-12 evidence-hero"><div><p className="eyebrow">Evidence first</p><h3>{metricValue(result?.name || result?.reconId, 'Recon')} · {titleCase(result?.overallStatus || 'Unknown')}</h3></div><span>{anomalies.length} signals</span></div>
      <div className="span-7 anomaly-stack">
        {anomalies.map((anomaly, index) => (
          <div className={`glass-card anomaly-card severity-${String(anomaly.severity).toLowerCase()}`} key={`${anomaly.type}-${anomaly.stageType}-${index}`}>
            <div><span>{anomaly.severity}</span><strong>{titleCase(anomaly.type)}</strong></div>
            <p>{anomaly.evidence}</p>
            <div className="evidence-metrics"><MetricMini label="Stage" value={getStageDisplayName({ type: anomaly.stageType })} /><MetricMini label="Actual" value={formatMetricForContext(anomaly.actual, anomaly.type)} /><MetricMini label="Baseline" value={formatMetricForContext(anomaly.baseline, anomaly.type)} /><MetricMini label="Delta" value={anomaly.delta} /></div>
          </div>
        ))}
        {!anomalies.length && <EmptyState text="No anomalies returned." />}
      </div>
      <div className="glass-card span-5"><SectionTitle eyebrow="Supporting view" title="Actual vs baseline" /><GenericSeriesCharts charts={charts} compact /></div>
    </section>
  );
}

function GenericSeriesCharts({ charts, compact = false }) {
  if (!charts?.length) return <EmptyState text="No supporting chart returned." />;
  return <div className={`generic-charts ${compact ? 'is-compact' : ''}`}>{charts.map((chart, index) => <GenericSeriesChart chart={chart} key={`${chart.title}-${index}`} />)}</div>;
}

function GenericSeriesChart({ chart }) {
  const labels = safeArray(chart.x);
  const series = safeArray(chart.series);
  const rawValues = series.flatMap((item) => safeArray(item.data).map((value) => Number(value) || 0));
  const max = Math.max(...rawValues, 1);
  const useLog = max > 10000;
  const widthFor = (value) => {
    const numeric = Number(value) || 0;
    if (useLog) return Math.max(4, (Math.log10(numeric + 1) / Math.log10(max + 1)) * 100);
    return Math.max(4, (numeric / max) * 100);
  };
  const isSecondsChart = series.some((item) => /sec|time|duration/i.test(item.name || chart.title || ''));
  return (
    <div className="generic-chart-block readable-chart">
      <strong>{chart.title || titleCase(chart.chartType || 'Chart')}</strong>
      <div className="generic-chart-legend">{series.map((item) => <span key={item.name}>{item.name}</span>)}</div>
      <div className="generic-chart-rows">
        {labels.map((label, rowIndex) => (
          <div className="generic-chart-row" key={`${label}-${rowIndex}`}>
            <span>{getStageDisplayName({ type: label })}</span>
            <div>
              {series.map((item) => {
                const value = Number(safeArray(item.data)[rowIndex]) || 0;
                const labelText = isSecondsChart ? formatSeconds(value) : formatNumber(value);
                return <i key={item.name} style={{ '--bar': `${widthFor(value)}%` }} title={`${item.name}: ${labelText}`}><em>{labelText}</em></i>;
              })}
            </div>
          </div>
        ))}
      </div>
      {useLog && <small className="chart-note">Large outliers are scaled for readability; values remain exact.</small>}
    </div>
  );
}

function ResolutionWorkspace({ result }) {
  const steps = safeArray(result?.recommendedNextSteps);
  const evidence = safeArray(result?.evidence);
  const incidents = safeArray(result?.similarIncidents);
  const rca = result?.rcaDraft || {};
  return (
    <section className="workflow-grid resolution-workspace">
      <div className="glass-card span-12 resolution-hero"><div><p className="eyebrow">Action workspace</p><h3>{titleCase(result?.likelyCauseCategory || 'Likely cause unavailable')}</h3><p>{metricValue(result?.name || result?.reconId)} · {metricValue(result?.confidence, 0)}% confidence</p></div><div className="action-badge">Resolution is the outcome</div></div>
      <div className="glass-card span-7"><SectionTitle eyebrow="Recommended actions" title="Operator sequence" /><div className="action-list">{steps.map((step, index) => <div className="action-item" key={`${step.step}-${index}`}><span>{index + 1}</span><div><strong>{safeText(step.step)}</strong><p>{safeText(step.owner)} · {safeText(step.priority)} · ETA {safeText(step.eta)}</p></div></div>)}{!steps.length && <EmptyState text="No recommended actions returned." />}</div></div>
      <div className="glass-card span-5"><SectionTitle eyebrow="Evidence" title="Why this action" /><div className="evidence-list structured">{evidence.map((item, index) => <EvidenceItem item={item} key={index} />)}{!evidence.length && <EmptyState text="No evidence returned." />}</div><OwnerCard owner={result?.owner} /></div>
      <div className="glass-card span-6"><SectionTitle eyebrow="Memory" title="Similar incidents" /><div className="incident-list">{incidents.map((incident, index) => <div className="incident-item" key={incident.id || index}><strong>{incident.id || incident.title}</strong><p>{incident.resolution}</p><span>{incident.date || incident.occurredOn || 'Date unavailable'} · {incident.duration || incident.outcome || 'Outcome unavailable'}</span></div>)}{!incidents.length && <EmptyState text="No similar incidents returned." />}</div></div>
      <div className="glass-card span-6 rca-card"><SectionTitle eyebrow="Draft RCA" title={rca.title || 'RCA draft'} /><p><strong>Summary:</strong> {metricValue(rca.summary)}</p><p><strong>Impact:</strong> {metricValue(rca.impact)}</p><p><strong>Fix:</strong> {metricValue(rca.fix || rca.correctiveAction)}</p><p><strong>Prevention:</strong> {metricValue(rca.prevention)}</p><p><strong>Root cause:</strong> {metricValue(rca.rootCause)}</p>{safeArray(rca.timeline).length > 0 && <p><strong>Timeline:</strong> {rca.timeline.join(' → ')}</p>}</div>
    </section>
  );
}

function EvidenceItem({ item }) {
  if (typeof item === 'string') return <div className="evidence-object"><p>{item}</p></div>;
  return <div className="evidence-object"><span>{safeText(item.source || 'Evidence')}</span><strong>{safeText(item.field || item.type || 'Signal')}</strong><p>{safeText(item.value || item.evidence || item.detail)}</p></div>;
}

function OwnerCard({ owner = {} }) {
  return <div className="owner-card"><p className="eyebrow">Owner</p><strong>{metricValue(owner.team)}</strong><span>{metricValue(owner.primary || owner.contact)} · {metricValue(owner.channel || owner.email)}</span><em>Escalation: {metricValue(owner.escalation || owner.contact)}</em></div>;
}

function CostIntelligence({ result }) {
  const byStage = safeArray(result?.costByStage);
  const byRecon = safeArray(result?.costByRecon);
  const anomalies = safeArray(result?.costAnomalies);
  const currency = result?.currency || 'USD';
  return (
    <section className="workflow-grid cost-workspace">
      <div className="glass-card span-4 total-cost-card accent-card"><p className="eyebrow">Total run cost</p><h3>{money(currency, result?.totalCost)}</h3><p>Cost is framed as operational drag, not finance reporting.</p></div>
      <div className="glass-card span-8"><SectionTitle eyebrow="Cost by stage" title="Where compute is being consumed" /><div className="cost-bars">{byStage.map((item, index) => <div className="cost-row cost-stage-row" key={item.stage || index}><span>{getStageDisplayName({ type: item.stage })}</span><div><i style={{ '--bar': `${item.share || 0}%` }} /></div><strong>{money(currency, item.cost)}</strong></div>)}{!byStage.length && <EmptyState text="No stage-level cost returned." />}</div></div>
      <div className="glass-card span-12 cost-field-card"><SectionTitle eyebrow="All recons" title="Recon cost field" helper="Ranked recons by operational cost. Widths are normalized so small USD values remain readable." /><CostField items={byRecon} currency={currency} /></div>
      <div className="glass-card span-7"><SectionTitle eyebrow="Per-recon chart" title="Cost drivers across the run set" /><ReconCostRows items={byRecon} currency={currency} /></div>
      <div className="glass-card span-5"><SectionTitle eyebrow="Anomalies" title="Cost outliers" /><div className="cost-anomaly-list">{anomalies.map((item, index) => <div className="cost-anomaly-item" key={item.reconId || index}><span>{item.severity}</span><strong>{item.reconId}</strong><p>{item.evidence}</p></div>)}{!anomalies.length && <EmptyState text="No cost anomalies returned." />}</div></div>
    </section>
  );
}

function CostField({ items, currency }) {
  const maxCost = Math.max(...items.map((item) => Number(item.cost) || 0), 1);
  if (!items.length) return <EmptyState text="No recon-level cost returned." />;
  return (
    <div className="cost-field cost-grid-field">
      {items.map((item, index) => {
        const cost = Number(item.cost) || 0;
        const width = Math.max(8, Math.round((cost / maxCost) * 100));
        return (
          <div className="cost-grid-card" key={item.reconId || item.name || index}>
            <div>
              <strong>{item.reconId || item.name || `Recon ${index + 1}`}</strong>
              <span>{titleCase(item.status || 'Unknown')}</span>
            </div>
            <em>{money(currency, cost)}</em>
            <div className="cost-grid-meter"><i style={{ '--bar': `${width}%` }} /></div>
            <p>{item.reason || item.primaryDriver || 'Cost driver unavailable'}</p>
          </div>
        );
      })}
    </div>
  );
}

function ReconCostRows({ items, currency }) {
  const maxCost = Math.max(...items.map((item) => Number(item.cost) || 0), 1);
  if (!items.length) return <EmptyState text="No recon-level cost returned." />;
  return <div className="recon-cost-rows">{items.map((item, index) => { const cost = Number(item.cost) || 0; const width = Math.max(4, Math.round((cost / maxCost) * 100)); return <div className="recon-cost-row" key={item.reconId || item.name || index}><div><strong>{item.reconId || item.name || `Recon ${index + 1}`}</strong><span>{item.reason || item.status || 'No driver returned'}</span></div><div className="recon-cost-meter"><i style={{ '--bar': `${width}%` }} /></div><em>{money(currency, cost)}</em></div>; })}</div>;
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export default App;
