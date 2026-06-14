import React, { useEffect, useMemo, useState } from 'react';
import { askReconTower } from './api';
import { USE_MOCK_RESPONSES } from './config';

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
  MATCH: 'Match',
  POST_MATCH: 'Post Match',
  METRICS: 'Metrics',
  REPORTS: 'Reports',
  PRE_PROCESSING: 'Prematch'
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getToolModel(response) {
  const firstTool = safeArray(response?.toolCalls)[0];
  return {
    answer: response?.answer || 'No narrative was returned for this request.',
    toolName: firstTool?.toolName || 'generic',
    result: firstTool?.toolResponse?.result || {},
    hasTool: Boolean(firstTool?.toolName)
  };
}

function normalizeStatus(status = '') {
  return String(status).replace(/_/g, ' ').toLowerCase();
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

function metricValue(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function money(currency, value) {
  return `${currency || '₹'} ${metricValue(value)}`;
}

function App() {
  const [question, setQuestion] = useState('How are today\'s recons performing?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const model = useMemo(() => getToolModel(response), [response]);

  useEffect(() => {
    const targets = document.querySelectorAll(
      '.answer-panel, .loading-card, .generic-response, .glass-card, .kpi-card, .landing-card, .lane-row, .attention-item, .timeline-item, .file-card, .driver-card, .anomaly-card, .action-item, .incident-item, .cost-recon-item, .cost-anomaly-item, .recon-cost-row, .cost-node'
    );

    targets.forEach((element, index) => {
      element.classList.add('reveal-ready');
      element.style.setProperty('--reveal-delay', `${Math.min(index * 28, 260)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -7% 0px' }
    );

    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [response, loading, model.toolName]);

  async function submit(nextQuestion = question) {
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      document.getElementById('workspace-response-anchor')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
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

  return (
    <div className={`app-shell ${response || loading ? 'has-activity' : ''}`}>
      <TopHeader />

      <main className="workspace-shell">
        <section className={`hero-panel ${loading ? 'is-routing' : ''}`}>
          <div className="hero-copy">
            <p className="eyebrow">Unified Recon Tower</p>
            <h1>Predict. Detect. Resolve.</h1>
            <p className="hero-text">
              A single operations workspace that starts with a question and ends with evidence-backed action.
            </p>
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
              <button onClick={() => submit()} disabled={loading}>
                {loading ? 'Routing' : 'Ask'}
              </button>
            </div>
            <div className="suggestion-row">
              {[
                'Show today\'s recon status',
                'Where is PELIX?',
                'Will PELIX meet SLA?',
                'Why did PELIX fail?',
                'What should I do next?',
                'Show cost by recon'
              ].map((item) => (
                <button key={item} type="button" onClick={() => runSuggestion(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div id="workspace-response-anchor" className="workspace-response-anchor" />
        {loading && <LoadingState />}
        {!loading && response && (
          <>
            <AnswerPanel label={WORKFLOW_LABELS[model.toolName] || 'Operational Response'} answer={model.answer} screen={SCREEN_LABELS[model.toolName]} error={error} />
            <WorkflowRouter model={model} />
          </>
        )}
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
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <div className="bank-name">JPMorgan Chase</div>
          <div className="product-line">Unified Recon Tower</div>
        </div>
      </div>
      <nav className="header-nav header-mantra" aria-label="Product promise">
        <span>Predict.</span>
        <span>Detect.</span>
        <span>Resolve.</span>
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
        { label: 'Why did it happen?', detail: 'Evidence-first anomaly investigation across stage runtime, records, and match quality.', prompt: 'Show anomalies for PELIX' },
        { label: 'What should I do next?', detail: 'Recommended actions, owner handoff, similar incidents, and RCA draft.', prompt: 'What should I do next for PELIX?' }
      ].map((item) => (
        <button className="landing-card" key={item.label} onClick={() => onSelect(item.prompt)}>
          <span>{item.label}</span>
          <p>{item.detail}</p>
        </button>
      ))}
    </section>
  );
}

function LoadingState() {
  return (
    <section className="loading-card">
      <div className="route-line">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p>Routing question into the operational workflow...</p>
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
      <p>{answer}</p>
      {error && <div className="error-strip">API unavailable: {error}</div>}
    </section>
  );
}

function WorkflowRouter({ model }) {
  if (!model.hasTool) return <GenericResponse answer={model.answer} />;

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
      return <GenericResponse answer={model.answer} />;
  }
}

function GenericResponse({ answer }) {
  return (
    <section className="generic-response">
      <p className="eyebrow">Generic Answer Mode</p>
      <h2>No workflow tool returned</h2>
      <p>{answer}</p>
    </section>
  );
}

function OperationalBrief({ result }) {
  const recons = safeArray(result?.recons);
  const failed = recons.filter((item) => item.status === 'FAILED');
  const running = recons.filter((item) => item.status === 'IN_PROGRESS');

  return (
    <section className="workflow-grid operational-brief">
      <div className="brief-headline glass-card span-12">
        <div>
          <p className="eyebrow">Business date</p>
          <h3>{metricValue(result?.date)}</h3>
        </div>
        <div>
          <p className="eyebrow">Generated</p>
          <h3>{formatDateTime(result?.generatedAt)}</h3>
        </div>
        <div>
          <p className="eyebrow">Overall progress</p>
          <h3>{metricValue(result?.overallProgress)}%</h3>
        </div>
        <div className="progress-orb" style={{ '--value': `${metricValue(result?.overallProgress, 0)}%` }}>
          <span>{Math.round(metricValue(result?.overallProgress, 0))}%</span>
        </div>
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
          {failed.map((item, index) => (
            <div className="attention-item" key={item.reconId}>
              <span className="rank">0{index + 1}</span>
              <div>
                <strong>{item.name}</strong>
                <p>{item.stages?.find((stage) => stage.status === 'FAILED')?.issue || 'Failure reason unavailable'}</p>
              </div>
              <span className="status-chip failed">{titleCase(item.currentStage)}</span>
            </div>
          ))}
          {!failed.length && <EmptyState text="No failed recons in the current run set." />}
        </div>
      </div>

      <div className="glass-card span-5">
        <SectionTitle eyebrow="Run composition" title="State distribution" />
        <div className="distribution-stack">
          <DistributionRow label="Completed" value={result?.completedCount || 0} total={result?.totalRecons || 1} />
          <DistributionRow label="Running" value={result?.inProgressCount || 0} total={result?.totalRecons || 1} />
          <DistributionRow label="Failed" value={result?.failedCount || 0} total={result?.totalRecons || 1} />
        </div>
      </div>
    </section>
  );
}

function KpiCard({ label, value, detail, tone = 'neutral' }) {
  return (
    <div className={`kpi-card glass-card tone-${tone}`}>
      <p>{label}</p>
      <strong>{metricValue(value)}</strong>
      <span>{detail}</span>
    </div>
  );
}

function SectionTitle({ eyebrow, title, helper }) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      {helper && <span>{helper}</span>}
    </div>
  );
}

function ExecutionLanes({ recons }) {
  return (
    <div className="execution-lanes">
      <div className="lane-header">
        <span>Recon</span>
        {['Prematch', 'Match', 'Post Match', 'Metrics', 'Reports'].map((stage) => <span key={stage}>{stage}</span>)}
        <span>SLA</span>
      </div>
      {recons.map((recon) => (
        <div className="lane-row" key={recon.reconId}>
          <div className="lane-recon">
            <strong>{recon.name}</strong>
            <span>{recon.owner}</span>
          </div>
          {safeArray(recon.stages).map((stage) => (
            <div className={`lane-segment status-${String(stage.status).toLowerCase()}`} key={`${recon.reconId}-${stage.name}`}>
              <span className="segment-line" />
              <span className="segment-dot" />
              <small>{stage.duration ? `${stage.duration}m` : '—'}</small>
            </div>
          ))}
          <div className="lane-sla">
            <span>{recon.sla}</span>
            <em>{recon.predictedCompletion}</em>
          </div>
        </div>
      ))}
      {!recons.length && <EmptyState text="No recon execution lanes returned by the service." />}
    </div>
  );
}

function DistributionRow({ label, value, total }) {
  const width = Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="distribution-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="thin-meter"><span style={{ width: `${width}%` }} /></div>
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
          <p>{titleCase(result?.stage || result?.currentStage || 'Unknown stage')} · {titleCase(result?.status || 'Unknown status')}</p>
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
        <div className="tab-row">
          {['Overview', 'Timeline', 'Files'].map((item) => (
            <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
        {tab === 'Overview' && <InvestigationOverview result={result} stages={stages} />}
        {tab === 'Timeline' && <TimelineView stages={stages} />}
        {tab === 'Files' && <FilesView files={files} />}
      </div>
    </section>
  );
}

function MetricMini({ label, value }) {
  return (
    <div className="metric-mini">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ThinLinePipeline({ stages }) {
  return (
    <div className="thin-pipeline">
      {stages.map((stage, index) => (
        <div className={`thin-stage status-${String(stage.status).toLowerCase()}`} key={`${stage.name}-${index}`}>
          <div className="thin-rail">
            <span className="rail-fill" />
            <i />
          </div>
          <div className="stage-copy">
            <strong>{STAGE_LABELS[stage.name] || titleCase(stage.name)}</strong>
            <span>{titleCase(stage.status || 'Pending')}</span>
            <em>{stage.start || '—'} {stage.end ? `→ ${stage.end}` : ''}</em>
          </div>
          {stage.issue && <p>{stage.issue}</p>}
        </div>
      ))}
      {!stages.length && <EmptyState text="No execution timeline returned." />}
    </div>
  );
}

function InvestigationOverview({ result, stages }) {
  const failedStage = stages.find((stage) => stage.status === 'FAILED');
  return (
    <div className="overview-grid">
      <div className="overview-panel">
        <p className="eyebrow">Current stage</p>
        <h4>{titleCase(result?.currentStage || result?.stage || 'Unavailable')}</h4>
        <p>{failedStage?.issue || 'No blocking stage issue was returned.'}</p>
      </div>
      <div className="overview-panel">
        <p className="eyebrow">Operator readout</p>
        <h4>{titleCase(result?.status || 'Unknown')}</h4>
        <p>{metricValue(result?.name || result?.reconId)} is {normalizeStatus(result?.status || 'unknown')} with {metricValue(result?.progress, 0)}% of the journey completed.</p>
      </div>
    </div>
  );
}

function TimelineView({ stages }) {
  return (
    <div className="timeline-list">
      {stages.map((stage, index) => (
        <div className={`timeline-item status-${String(stage.status).toLowerCase()}`} key={`${stage.name}-${index}`}>
          <span className="timeline-marker" />
          <div>
            <strong>{STAGE_LABELS[stage.name] || titleCase(stage.name)}</strong>
            <p>{titleCase(stage.status)} · {stage.duration ? `${stage.duration} minutes` : 'Duration unavailable'}</p>
            {stage.issue && <em>{stage.issue}</em>}
          </div>
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
      {files.map((file) => (
        <div className="file-card" key={file.fileName}>
          <span>{file.type || 'File'}</span>
          <strong>{file.fileName}</strong>
          <p>{metricValue(file.records)} records · {file.status || 'Status unavailable'}</p>
          <em>{file.receivedAt || 'Time unavailable'}</em>
        </div>
      ))}
      {!files.length && <EmptyState text="No file metadata returned for this recon." />}
    </div>
  );
}

function SlaIntelligence({ result }) {
  const drivers = safeArray(result?.drivers);
  const chart = safeArray(result?.charts);

  return (
    <section className="workflow-grid sla-workspace">
      <div className="glass-card span-5 forecast-card">
        <p className="eyebrow">Risk forecast</p>
        <h3>{titleCase(result?.riskLevel || 'Unknown')}</h3>
        <div className="confidence-ring" style={{ '--value': `${metricValue(result?.confidence, 0)}%` }}>
          <span>{metricValue(result?.confidence, 0)}%</span>
          <em>confidence</em>
        </div>
      </div>
      <div className="glass-card span-7 prediction-card">
        <SectionTitle eyebrow="Predicted outcome" title="SLA trajectory" />
        <div className="prediction-line">
          <MetricMini label="SLA deadline" value={metricValue(result?.slaDeadline)} />
          <MetricMini label="Predicted completion" value={metricValue(result?.predictedCompletion)} />
          <MetricMini label="Recon" value={metricValue(result?.name || result?.reconId)} />
        </div>
        <RiskCurve points={chart} />
      </div>
      <div className="glass-card span-12">
        <SectionTitle eyebrow="Drivers" title="Why the prediction moved" />
        <div className="driver-grid">
          {drivers.map((driver) => (
            <div className="driver-card" key={driver.label}>
              <span>{driver.impact || 'Impact unavailable'}</span>
              <strong>{driver.label}</strong>
              <p>{driver.detail}</p>
            </div>
          ))}
          {!drivers.length && <EmptyState text="No SLA drivers returned." />}
        </div>
      </div>
    </section>
  );
}

function RiskCurve({ points }) {
  if (!points.length) return <EmptyState text="No forecast chart returned." />;
  const width = 620;
  const height = 180;
  const coordinates = points.map((point, index) => {
    const x = (index / Math.max(1, points.length - 1)) * width;
    const y = height - (point.probability / 100) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="risk-curve-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="SLA risk curve">
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#111" />
            <stop offset="100%" stopColor="#777" />
          </linearGradient>
        </defs>
        <line x1="0" y1="126" x2={width} y2="126" className="threshold" />
        <polyline points={coordinates} className="risk-line" />
        {points.map((point, index) => {
          const x = (index / Math.max(1, points.length - 1)) * width;
          const y = height - (point.probability / 100) * height;
          return <circle key={point.time} cx={x} cy={y} r="5" className="risk-dot" />;
        })}
      </svg>
      <div className="curve-labels">
        {points.map((point) => <span key={point.time}>{point.time}</span>)}
      </div>
    </div>
  );
}

function AnomalyInvestigation({ result }) {
  const anomalies = safeArray(result?.anomalies);
  const charts = safeArray(result?.charts);

  return (
    <section className="workflow-grid anomaly-workspace">
      <div className="glass-card span-12 evidence-hero">
        <div>
          <p className="eyebrow">Evidence first</p>
          <h3>{metricValue(result?.name || result?.reconId, 'Recon')} · {titleCase(result?.overallStatus || 'Unknown')}</h3>
        </div>
        <span>{anomalies.length} signals</span>
      </div>
      <div className="span-7 anomaly-stack">
        {anomalies.map((anomaly) => (
          <div className={`glass-card anomaly-card severity-${String(anomaly.severity).toLowerCase()}`} key={`${anomaly.type}-${anomaly.stageType}`}>
            <div>
              <span>{anomaly.severity}</span>
              <strong>{titleCase(anomaly.type)}</strong>
            </div>
            <p>{anomaly.evidence}</p>
            <div className="evidence-metrics">
              <MetricMini label="Stage" value={STAGE_LABELS[anomaly.stageType] || titleCase(anomaly.stageType)} />
              <MetricMini label="Actual" value={anomaly.actual} />
              <MetricMini label="Baseline" value={anomaly.baseline} />
              <MetricMini label="Delta" value={anomaly.delta || '—'} />
            </div>
          </div>
        ))}
        {!anomalies.length && <EmptyState text="No anomalies returned." />}
      </div>
      <div className="glass-card span-5">
        <SectionTitle eyebrow="Supporting view" title="Actual vs baseline" />
        <ComparisonBars data={charts} />
      </div>
    </section>
  );
}

function ComparisonBars({ data }) {
  if (!data.length) return <EmptyState text="No supporting chart returned." />;
  return (
    <div className="comparison-bars">
      {data.map((item) => {
        const max = Math.max(item.actual || 0, item.baseline || 0, 1);
        return (
          <div className="comparison-row" key={item.label}>
            <strong>{item.label}</strong>
            <div className="dual-bars">
              <span style={{ width: `${((item.actual || 0) / max) * 100}%` }}><em>Actual</em></span>
              <span style={{ width: `${((item.baseline || 0) / max) * 100}%` }}><em>Baseline</em></span>
            </div>
          </div>
        );
      })}
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
      <div className="glass-card span-12 resolution-hero">
        <div>
          <p className="eyebrow">Action workspace</p>
          <h3>{titleCase(result?.likelyCauseCategory || 'Likely cause unavailable')}</h3>
          <p>{metricValue(result?.name || result?.reconId)} · {metricValue(result?.confidence, 0)}% confidence</p>
        </div>
        <div className="action-badge">Resolution is the outcome</div>
      </div>

      <div className="glass-card span-7">
        <SectionTitle eyebrow="Recommended actions" title="Operator sequence" />
        <div className="action-list">
          {steps.map((step, index) => (
            <div className="action-item" key={`${step.step}-${index}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.step}</strong>
                <p>{step.owner} · {step.priority} · ETA {step.eta}</p>
              </div>
            </div>
          ))}
          {!steps.length && <EmptyState text="No recommended actions returned." />}
        </div>
      </div>

      <div className="glass-card span-5">
        <SectionTitle eyebrow="Evidence" title="Why this action" />
        <ul className="evidence-list">
          {evidence.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="owner-card">
          <p className="eyebrow">Owner</p>
          <strong>{metricValue(result?.owner?.team)}</strong>
          <span>{metricValue(result?.owner?.primary)} · {metricValue(result?.owner?.channel)}</span>
          <em>Escalation: {metricValue(result?.owner?.escalation)}</em>
        </div>
      </div>

      <div className="glass-card span-6">
        <SectionTitle eyebrow="Memory" title="Similar incidents" />
        <div className="incident-list">
          {incidents.map((incident) => (
            <div className="incident-item" key={incident.id}>
              <strong>{incident.id}</strong>
              <p>{incident.resolution}</p>
              <span>{incident.date} · {incident.duration}</span>
            </div>
          ))}
          {!incidents.length && <EmptyState text="No similar incidents returned." />}
        </div>
      </div>

      <div className="glass-card span-6 rca-card">
        <SectionTitle eyebrow="Draft RCA" title={rca.title || 'RCA draft unavailable'} />
        <p><strong>Summary:</strong> {metricValue(rca.summary)}</p>
        <p><strong>Impact:</strong> {metricValue(rca.impact)}</p>
        <p><strong>Corrective action:</strong> {metricValue(rca.correctiveAction)}</p>
        <p><strong>Prevention:</strong> {metricValue(rca.prevention)}</p>
      </div>
    </section>
  );
}

function CostIntelligence({ result }) {
  const byStage = safeArray(result?.costByStage);
  const byRecon = safeArray(result?.costByRecon);
  const anomalies = safeArray(result?.costAnomalies);
  const currency = result?.currency || '₹';

  return (
    <section className="workflow-grid cost-workspace">
      <div className="glass-card span-4 total-cost-card accent-card">
        <p className="eyebrow">Total run cost</p>
        <h3>{money(currency, result?.totalCost)}</h3>
        <p>Cost is framed as operational drag, not finance reporting.</p>
      </div>
      <div className="glass-card span-8">
        <SectionTitle eyebrow="Cost by stage" title="Where compute is being consumed" />
        <div className="cost-bars">
          {byStage.map((item) => (
            <div className="cost-row" key={item.stage}>
              <span>{STAGE_LABELS[item.stage] || titleCase(item.stage)}</span>
              <div><i style={{ '--bar': `${item.share || 0}%` }} /></div>
              <strong>{money(currency, item.cost)}</strong>
            </div>
          ))}
          {!byStage.length && <EmptyState text="No stage-level cost returned." />}
        </div>
      </div>

      <div className="glass-card span-12 cost-field-card">
        <SectionTitle eyebrow="All recons" title="Recon cost field" helper="Every node is one recon. Larger nodes are consuming more of today’s operational cost." />
        <CostField items={byRecon} currency={currency} />
      </div>

      <div className="glass-card span-7">
        <SectionTitle eyebrow="Per-recon chart" title="Cost drivers across the run set" />
        <ReconCostRows items={byRecon} currency={currency} />
      </div>
      <div className="glass-card span-5">
        <SectionTitle eyebrow="Anomalies" title="Cost outliers" />
        <div className="cost-anomaly-list">
          {anomalies.map((item) => (
            <div className="cost-anomaly-item" key={item.reconId}>
              <span>{item.severity}</span>
              <strong>{item.reconId}</strong>
              <p>{item.evidence}</p>
            </div>
          ))}
          {!anomalies.length && <EmptyState text="No cost anomalies returned." />}
        </div>
      </div>
    </section>
  );
}

function CostField({ items, currency }) {
  const maxCost = Math.max(...items.map((item) => Number(item.cost) || 0), 1);
  if (!items.length) return <EmptyState text="No recon-level cost returned." />;

  return (
    <div className="cost-field">
      {items.map((item, index) => {
        const cost = Number(item.cost) || 0;
        const ratio = cost / maxCost;
        const size = 54 + ratio * 72;
        return (
          <div
            className="cost-node"
            key={item.reconId || item.name || index}
            style={{
              '--size': `${size}px`,
              '--rise': `-${Math.round(ratio * 50)}px`,
              '--node-delay': `${index * 70}ms`
            }}
          >
            <span>{item.reconId || item.name || `Recon ${index + 1}`}</span>
            <strong>{money(currency, cost)}</strong>
            <em>{item.reason || item.status || 'Cost driver unavailable'}</em>
          </div>
        );
      })}
    </div>
  );
}

function ReconCostRows({ items, currency }) {
  const maxCost = Math.max(...items.map((item) => Number(item.cost) || 0), 1);
  if (!items.length) return <EmptyState text="No recon-level cost returned." />;

  return (
    <div className="recon-cost-rows">
      {items.map((item, index) => {
        const cost = Number(item.cost) || 0;
        const width = Math.max(4, Math.round((cost / maxCost) * 100));
        return (
          <div className="recon-cost-row" key={item.reconId || item.name || index}>
            <div>
              <strong>{item.reconId || item.name || `Recon ${index + 1}`}</strong>
              <span>{item.reason || item.status || 'No driver returned'}</span>
            </div>
            <div className="recon-cost-meter"><i style={{ '--bar': `${width}%` }} /></div>
            <em>{money(currency, cost)}</em>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export default App;
