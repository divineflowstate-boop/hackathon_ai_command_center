import { AlertTriangle, BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AiAnswer } from './AiAnswer';

export function AnomaliesView({ data, answer }) {
  const payload = data || { anomalies: [], charts: [], available: true };
  const anomalies = payload.anomalies || [];
  const chart = payload.charts?.[0];
  const chartData = chart ? toChartRows(chart) : [];
  if (payload.available === false) return <Unavailable title="Anomaly Detection" message={payload.reasonIfUnavailable}/>;
  return <section className="viewScreen fadeIn">
    <div className="viewHeader"><div><h1>Anomaly Detection</h1><p>Signals returned by the anomaly agent for the selected execution.</p></div></div>
    <AiAnswer title="AI Findings" answer={answer || payload.answer}/>
    <div className="anomalyCards">
      {anomalies.length ? anomalies.map((a, idx) => <div className={`anomalySignal ${String(a.severity).toLowerCase()}`} key={`${a.type}-${idx}`}>
        <div className="anomalyTop"><span>{a.severity}</span><AlertTriangle size={18}/></div>
        <b>{a.title}</b>
        {a.evidence && <p>{a.evidence}</p>}
        <div className="anomalyMetric"><small>Actual</small><strong>{a.actual}</strong><small>Baseline</small><strong>{a.baseline}</strong></div>
      </div>) : <div className="emptyBlock fullSpan">No anomalies returned by API.</div>}
    </div>
    <div className="twoCol">
      <div className="panel"><h3>{chart?.title || 'Actual vs Baseline'}</h3>{chartData.length ? <ResponsiveContainer width="100%" height={320}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="metric"/><YAxis/><Tooltip/>{chart.series.map((s, idx) => <Bar key={s.name} dataKey={s.name} fill={idx === 0 ? '#B8323B' : '#C9C6BE'} name={s.name} radius={[6,6,0,0]}/>)}</BarChart></ResponsiveContainer> : <div className="emptyBlock">No anomaly chart returned by API.</div>}</div>
      <div className="panel"><h3>Evidence Feed</h3><div className="evidenceFeed">{anomalies.length ? anomalies.map((a, idx) => <div key={`${a.type}-e-${idx}`}><BarChart3 size={18}/><div><b>{a.title}</b><small>{a.evidence || 'No evidence text returned.'}</small></div></div>) : <div className="emptyBlock">No evidence returned by API.</div>}</div></div>
    </div>
  </section>
}

function toChartRows(chart) {
  const x = chart.x || [];
  return x.map((label, idx) => {
    const row = { metric: label };
    (chart.series || []).forEach((s) => { row[s.name] = Number(s.data?.[idx] || 0); });
    return row;
  });
}
function Unavailable({ title, message }) { return <section className="viewScreen fadeIn"><div className="viewHeader"><div><h1>{title}</h1></div></div><div className="emptyStatePanel"><h3>Data unavailable</h3><p>{message || 'Information is not available for this execution.'}</p></div></section>; }
