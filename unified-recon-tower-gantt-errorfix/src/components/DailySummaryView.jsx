import { CheckCircle2, Download, Search, XCircle } from 'lucide-react';
import { Cell, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AiAnswer } from './AiAnswer';
import { StatusBadge } from './StatusBadge';
import { formatDate, formatUtc, formatTimeUtc } from '../utils/format';

export function DailySummaryView({ data, answer, onOpenRecon }) {
  data = data || { recons: [] };
  const chartData = [
    { name: 'Failed', count: data.failedCount, color: '#B8323B' },
    { name: 'In Progress', count: data.inProgressCount, color: '#B8860B' },
    { name: 'Completed', count: data.completedCount, color: '#237A4B' },
    { name: 'Other', count: data.otherCount || 0, color: '#A7A7A7' }
  ];
  const timeline = buildTimeline(data.recons || [], data.generatedAt);

  function exportCsv() {
    const headers = ['identifier', 'status', 'progress', 'startTime', 'endTime', 'duration', 'currentStage', 'owner', 'executionId'];
    const rows = (data.recons || []).map((r) => headers.map((h) => csvEscape(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-summary-${data.date || 'today'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return <section className="viewScreen fadeIn">
    <div className="viewHeader">
      <div><h1>Daily Summary</h1><p>Business date {formatDate(data.date)}</p></div>
      <button className="secondaryBtn" onClick={exportCsv}><Download size={16}/> Export CSV</button>
    </div>
    <AiAnswer title="Operational Brief" answer={answer || data.answer}/>
    <div className="metadataStrip">
      <span><b>Business date</b> {formatDate(data.date)}</span>
      <span><b>Generated</b> {formatUtc(data.generatedAt)}</span>
      <span><b>Source</b> DynamoDB</span>
      {data.tableName && <span><b>Table</b> {data.tableName}</span>}
    </div>
    <div className="kpiRow centeredKpis">
      <Kpi label="Total Recons" value={data.totalRecons} tone="neutral" note="For selected business date" />
      <Kpi label="Completed" value={data.completedCount} tone="success" note={`${pct(data.completedCount, data.totalRecons)} of total`} icon={<CheckCircle2 size={24}/>} />
      <Kpi label="In Progress" value={data.inProgressCount} tone="info" note="Active executions" />
      <Kpi label="Failed" value={data.failedCount} tone="danger" note="Requires attention" icon={<XCircle size={24}/>} />
      <Kpi label="Overall Progress" value={`${data.overallProgress}%`} tone="info" note="API reported progress" />
    </div>
    <div className="summaryGrid">
      <div className="panel"><div className="panelHeader"><h3>Recon Status Distribution</h3></div><ResponsiveContainer width="100%" height={260}><BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 24 }}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false}/><YAxis dataKey="name" type="category" width={120}/><Tooltip/><Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={16}>{chartData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div className="panel"><h3>Recon Execution Timeline</h3><TimelineChart rows={timeline} onOpenRecon={onOpenRecon}/></div>
    </div>
    <div className="panel tablePanel"><div className="panelHeader"><h3>Recon Executions ({data.recons?.length || 0})</h3><div className="tableActions"><span><Search size={15}/> Search recons...</span><button onClick={exportCsv}><Download size={16}/></button></div></div><table><thead><tr><th>Identifier</th><th>Status</th><th>Progress</th><th>Start Time</th><th>End Time</th><th>Duration</th><th>Current Stage</th><th>Owner</th></tr></thead><tbody>{(data.recons || []).map((r) => <tr key={r.executionId || r.identifier} onClick={() => onOpenRecon(r)}><td>{r.identifier}</td><td><StatusBadge status={r.status}/></td><td><Progress value={r.progress}/></td><td>{formatUtc(r.startTime)}</td><td>{formatUtc(r.endTime)}</td><td>{r.duration}</td><td className={r.status === 'FAILED' ? 'dangerText' : ''}>{r.currentStage}</td><td>{r.owner}</td></tr>)}</tbody></table></div>
  </section>;
}

function Kpi({ label, value, tone, note, icon }) {
  return <div className={`kpiCard ${tone}`}><div className="kpiTop"><span>{label}</span>{icon}</div><strong>{value}</strong><small>{note}</small></div>;
}

function Progress({ value }) { return <div className="progressWrap"><span>{value}%</span><i><b style={{ width: `${Number(value || 0)}%` }}/></i></div>; }
function pct(value, total) { if (!total) return '0%'; return `${Math.round((Number(value || 0) / Number(total)) * 1000) / 10}%`; }
function csvEscape(value) { const s = String(value ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

function buildTimeline(recons, generatedAt) {
  const parsedStarts = (recons || [])
    .map((r) => ({ r, startMs: parseMs(r.startTime), actualEndMs: parseMs(r.endTime) }))
    .filter((x) => Number.isFinite(x.startMs));
  if (!parsedStarts.length) return [];

  const generatedMs = parseMs(generatedAt);
  const fallbackGeneratedMs = Number.isFinite(generatedMs) ? generatedMs : Math.max(...parsedStarts.map((x) => x.startMs)) + 60 * 60 * 1000;

  const resolved = parsedStarts.map(({ r, startMs, actualEndMs }) => {
    const status = String(r.status || '').toUpperCase();
    let endMs = actualEndMs;
    let endLabel = r.endTime;

    if (!Number.isFinite(endMs)) {
      if (status === 'IN_PROGRESS') {
        endMs = Math.max(fallbackGeneratedMs, startMs + 20 * 60 * 1000);
        endLabel = 'Running at generated time';
      } else if (status === 'FAILED') {
        const progressMinutes = Math.max(8, Math.round(Number(r.progress || 0) * 1.2));
        endMs = startMs + progressMinutes * 60 * 1000;
        endLabel = 'No end time returned; estimated failure window';
      } else {
        endMs = startMs + 10 * 60 * 1000;
        endLabel = 'No end time returned';
      }
    }
    return { ...r, startMs, endMs: Math.max(endMs, startMs + 2 * 60 * 1000), endLabel };
  });

  const minRaw = Math.min(...resolved.map((r) => r.startMs));
  const maxRaw = Math.max(...resolved.map((r) => r.endMs));
  const min = floorHour(minRaw);
  const max = ceilHour(maxRaw + 15 * 60 * 1000);
  const span = Math.max(max - min, 60 * 60 * 1000);

  return resolved.map((r) => ({
    ...r,
    left: ((r.startMs - min) / span) * 100,
    width: Math.max(1.8, ((r.endMs - r.startMs) / span) * 100),
    min,
    max,
    ticks: buildTicks(min, max)
  }));
}

function TimelineChart({ rows, onOpenRecon }) {
  if (!rows.length) return <EmptyBlock text="No execution timing returned by API."/>;
  const ticks = rows[0]?.ticks || [];
  return <div className="ganttWrap realGantt">
    <div className="ganttScale">
      <div className="ganttScaleSpacer" />
      <div className="ganttScaleTrack">
        {ticks.map((t) => <span key={t.ms} style={{ left: `${t.left}%` }}>{t.label}</span>)}
      </div>
    </div>
    {rows.map((r) => <button className="ganttRow ganttClickable" key={r.executionId || r.identifier} onClick={() => onOpenRecon(r)}>
      <div className="ganttLabel" title={r.identifier}>{r.identifier}</div>
      <div className="ganttTrack">
        {ticks.map((t) => <em key={t.ms} className="ganttGridLine" style={{ left: `${t.left}%` }} />)}
        <i className={`ganttBar ${String(r.status).toLowerCase()}`} style={{ left: `${r.left}%`, width: `${r.width}%` }}>
          {String(r.status).toUpperCase() === 'IN_PROGRESS' && <b className="runningArrow">›</b>}
          {String(r.status).toUpperCase() === 'FAILED' && <b className="failedMark">×</b>}
        </i>
        <div className="ganttTooltip">
          <strong>{r.identifier}</strong>
          <span>Status: {r.status}</span>
          <span>Progress: {r.progress}%</span>
          <span>Stage: {r.currentStage || '-'}</span>
          <span>Start: {formatUtc(r.startTime)}</span>
          <span>End: {r.endTime ? formatUtc(r.endTime) : r.endLabel}</span>
          <span>Duration: {r.duration || '-'}</span>
          <span>Owner: {r.owner || '-'}</span>
          <small>{r.executionId}</small>
        </div>
      </div>
    </button>)}
  </div>;
}
function EmptyBlock({ text }) { return <div className="emptyBlock">{text}</div>; }
function parseMs(value) { const t = value && value !== '-' ? new Date(value).getTime() : NaN; return Number.isFinite(t) ? t : NaN; }
function floorHour(ms) { const d = new Date(ms); d.setUTCMinutes(0, 0, 0); return d.getTime(); }
function ceilHour(ms) { const d = new Date(ms); d.setUTCMinutes(0, 0, 0); if (d.getTime() < ms) d.setUTCHours(d.getUTCHours() + 1); return d.getTime(); }
function buildTicks(min, max) {
  const ticks = [];
  const span = max - min;
  for (let t = min; t <= max; t += 60 * 60 * 1000) ticks.push({ ms: t, label: formatTimeUtc(new Date(t).toISOString()), left: ((t - min) / span) * 100 });
  return ticks;
}
