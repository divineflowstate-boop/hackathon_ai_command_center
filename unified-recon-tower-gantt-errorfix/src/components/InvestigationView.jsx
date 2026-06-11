import { useState } from 'react';
import { ArrowLeft, Check, Copy, Download, FileText, XCircle } from 'lucide-react';
import { AiAnswer } from './AiAnswer';
import { StatusBadge } from './StatusBadge';
import { formatUtc, formatTimeUtc } from '../utils/format';

export function InvestigationView({ data, answer, onAsk }) {
  data = data || { identifier: '-', executionId: '-', status: 'UNKNOWN', stages: [], files: [] };
  const hasFiles = Array.isArray(data.files) && data.files.length > 0;
  const [tab, setTab] = useState('overview');
  const availableTabs = ['overview', 'timeline', ...(hasFiles ? ['files'] : [])];
  const activeTab = availableTabs.includes(tab) ? tab : 'overview';

  return <section className="viewScreen fadeIn investigation workspaceSlide">
    <button className="backBtn" onClick={() => onAsk("Summarize today's recon health")}><ArrowLeft size={16}/> Back to summary</button>
    <div className="reconHero"><div><h1>{data.identifier}</h1><StatusBadge status={data.status}/></div><div className="reconMeta"><span>Execution ID</span><b>{data.executionId}</b><button onClick={() => navigator.clipboard?.writeText(data.executionId)}><Copy size={15}/></button><span>Started</span><b>{formatUtc(data.started)}</b><span>Duration</span><b>{data.duration || '-'}</b></div></div>
    <AiAnswer title="Investigation Brief" answer={answer || data.answer}/>
    <div className="tabs tabButtons">
      <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
      <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Timeline</button>
      {hasFiles && <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>Files</button>}
    </div>

    {activeTab === 'overview' && <div className="investGrid">
      <div className="panel"><h3>Overview</h3>{data.currentInsight?.length ? <ul className="insightList">{data.currentInsight.map((x, i) => <li key={`${x}-${i}`}>{i === 0 ? <XCircle size={17}/> : <Check size={17}/>}<span>{formatValue(x)}</span></li>)}</ul> : <div className="emptyBlock">Use the investigation brief above. No additional backend insight list was returned.</div>}</div>
      <div className="panel"><h3>Stage Timeline</h3>{data.stages?.length ? data.stages.map((s, idx) => <StageRow key={`${s.name}-${s.status}-${idx}`} stage={s}/>) : <div className="emptyBlock">No stage timeline returned by API.</div>}</div>
      <div className="panel quickActions"><h3>Actions</h3><button className="primaryBtn" onClick={() => onAsk(`What should I do next for ${data.identifier}?`)}>Resolve</button><button onClick={() => onAsk(`Will ${data.identifier} breach SLA?`)}>Predict SLA Risk</button><button onClick={() => onAsk(`Detect anomalies for ${data.identifier}`)}>Detect Anomalies</button></div>
    </div>}

    {activeTab === 'timeline' && <div className="panel"><h3>Stage Execution Timeline</h3><StageGantt stages={data.stages || []}/></div>}

    {activeTab === 'files' && <div className="panel"><div className="panelHeader"><h3>Files Received</h3></div>{data.files.map((f) => <div className="fileRow" key={f.fileName}><FileText size={18}/><div><b>{f.fileName}</b><small>Received<br/>{formatUtc(f.received)}</small>{f.filePattern && <small>Pattern<br/>{f.filePattern}</small>}</div><div><small>Pattern Match</small><strong className={f.pattern === 'PASS' ? 'successText' : ''}>{f.pattern || '-'}</strong></div><Download size={16}/></div>)}</div>}
  </section>;
}

function StageRow({ stage }) {
  return <div className="stageRow stageRowRich"><span>{stage.name}</span><i><b className={String(stage.status).toLowerCase()} style={{ width: `${Math.max(stage.progress || 0, stage.status === 'FAILED' ? 86 : 0)}%` }}/></i><em>{stage.status}</em><small>{formatUtc(stage.startTime)} → {formatUtc(stage.endTime)}</small></div>;
}

function StageGantt({ stages }) {
  const rows = buildStageRows(stages);
  if (!rows.length) return <div className="emptyBlock">No stage start/end data returned by API.</div>;
  const ticks = rows[0].ticks || [];
  return <div className="ganttWrap realGantt stageGantt">
    <div className="ganttScale"><div className="ganttScaleSpacer"/><div className="ganttScaleTrack">{ticks.map((t) => <span key={t.ms} style={{ left: `${t.left}%` }}>{t.label}</span>)}</div></div>
    {rows.map((r) => <div className="ganttRow" key={r.name}>
      <div className="ganttLabel" title={r.name}>{r.name}</div>
      <div className="ganttTrack">
        {ticks.map((t) => <em key={t.ms} className="ganttGridLine" style={{ left: `${t.left}%` }} />)}
        <i className={`ganttBar ${String(r.status).toLowerCase()}`} style={{ left: `${r.left}%`, width: `${r.width}%` }}>{String(r.status).toUpperCase() === 'IN_PROGRESS' && <b className="runningArrow">›</b>}{String(r.status).toUpperCase() === 'FAILED' && <b className="failedMark">×</b>}</i>
        <div className="ganttTooltip"><strong>{r.name}</strong><span>Status: {r.status}</span><span>Type: {r.type || '-'}</span><span>Start: {formatUtc(r.startTime)}</span><span>End: {r.endTime ? formatUtc(r.endTime) : r.endLabel}</span><span>Tasks: {r.completedTasks ?? 0}/{r.totalTasks ?? '-'}</span></div>
      </div>
    </div>)}
  </div>;
}

function buildStageRows(stages) {
  const starts = (stages || []).map((s) => ({ ...s, startMs: parseMs(s.startTime), actualEndMs: parseMs(s.endTime) })).filter((s) => Number.isFinite(s.startMs));
  if (!starts.length) return [];
  const fallbackEnd = Math.max(...starts.map((s) => Number.isFinite(s.actualEndMs) ? s.actualEndMs : s.startMs + 20 * 60 * 1000));
  const rows = starts.map((s) => {
    let endMs = s.actualEndMs;
    let endLabel = s.endTime;
    if (!Number.isFinite(endMs)) {
      endMs = String(s.status).toUpperCase() === 'IN_PROGRESS' ? fallbackEnd : s.startMs + 10 * 60 * 1000;
      endLabel = String(s.status).toUpperCase() === 'IN_PROGRESS' ? 'Running' : 'No end time returned';
    }
    return { ...s, endMs: Math.max(endMs, s.startMs + 2 * 60 * 1000), endLabel };
  });
  const min = floorMinute(Math.min(...rows.map((r) => r.startMs)));
  const max = ceilMinute(Math.max(...rows.map((r) => r.endMs)) + 5 * 60 * 1000);
  const span = Math.max(max - min, 10 * 60 * 1000);
  const ticks = buildTicks(min, max);
  return rows.map((r) => ({ ...r, left: ((r.startMs - min) / span) * 100, width: Math.max(2, ((r.endMs - r.startMs) / span) * 100), ticks }));
}
function parseMs(value) { const t = value && value !== '-' ? new Date(value).getTime() : NaN; return Number.isFinite(t) ? t : NaN; }
function floorMinute(ms) { const d = new Date(ms); d.setUTCSeconds(0, 0); return d.getTime(); }
function ceilMinute(ms) { const d = new Date(ms); d.setUTCSeconds(0, 0); if (d.getTime() < ms) d.setUTCMinutes(d.getUTCMinutes() + 5); return d.getTime(); }
function buildTicks(min, max) { const span = max - min; const count = 5; return Array.from({ length: count }, (_, i) => { const ms = min + (span * i) / (count - 1); return { ms, label: formatTimeUtc(new Date(ms).toISOString()), left: (i / (count - 1)) * 100 }; }); }
function formatValue(value) { if (value === null || value === undefined) return '-'; if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value); if (Array.isArray(value)) return value.map(formatValue).join(', '); if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v)}`).join(' · '); return String(value); }
