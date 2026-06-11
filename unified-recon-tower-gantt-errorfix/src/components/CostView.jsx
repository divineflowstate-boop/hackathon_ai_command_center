import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AiAnswer } from './AiAnswer';
import { formatCurrency, formatDate } from '../utils/format';

export function CostView({ data, answer }) {
  data = data || {};
  if (data.available === false) return <Unavailable title="Cost Visibility" message={data.reasonIfUnavailable}/>;
  return <section className="viewScreen fadeIn">
    <div className="viewHeader"><div><h1>Cost Visibility</h1><p>Day-level cost analysis {data.date ? `for ${formatDate(data.date)}` : ''}.</p></div></div>
    <AiAnswer title="Cost Analysis" answer={answer || data.answer}/>
    <div className="riskGrid costKpis">
      <div className="metricCard"><span>Total cost</span><strong>{data.totalCost || '-'}</strong></div>
      {data.reconId && <div className="metricCard"><span>Selected recon</span><strong>{data.reconId}</strong></div>}
      {data.executionId && <div className="metricCard"><span>Execution</span><strong className="smallMetric">{data.executionId}</strong></div>}
      <div className="metricCard"><span>Currency</span><strong>{data.currency || '-'}</strong></div>
    </div>
    <div className="twoCol"><div className="panel"><h3>Cost by Stage</h3>{data.byStage?.length ? <ResponsiveContainer width="100%" height={320}><BarChart data={data.byStage}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="stage" tick={{ fontSize: 11 }}/><YAxis/><Tooltip formatter={(v) => formatCurrency(v, data.currency)}/><Bar dataKey="cost" fill="#415A77" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer> : <div className="emptyBlock">No stage cost data returned by API.</div>}</div><div className="panel"><h3>Cost by Recon</h3>{data.byRecon?.length ? <ResponsiveContainer width="100%" height={320}><BarChart data={data.byRecon} layout="vertical" margin={{ left: 8, right: 18 }}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number"/><YAxis dataKey="reconId" type="category" width={150} tick={{ fontSize: 11 }}/><Tooltip formatter={(v) => formatCurrency(v, data.currency)}/><Bar dataKey="cost" fill="#B8860B" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer> : <div className="emptyBlock">No recon-level cost data returned by API.</div>}</div></div>
    <div className="panel costAnomalyPanel"><h3>Cost Anomalies</h3>{data.costAnomalies?.length ? <div className="costAnomalyGrid">{data.costAnomalies.map((a, idx) => <div className={`anomalySignal ${String(a.severity).toLowerCase()}`} key={`${a.type}-${idx}`}><div className="anomalyTop"><span>{a.severity}</span><b>{a.type}</b></div><p>{a.evidence}</p><div className="anomalyMetric"><small>Actual</small><strong>{a.actual}</strong><small>Baseline</small><strong>{a.baseline}</strong></div></div>)}</div> : <div className="emptyBlock">No cost anomalies returned by API.</div>}</div>
  </section>
}
function Unavailable({ title, message }) { return <section className="viewScreen fadeIn"><div className="viewHeader"><div><h1>{title}</h1></div></div><div className="emptyStatePanel"><h3>Data unavailable</h3><p>{message || 'Information is not available for this execution.'}</p></div></section>; }
