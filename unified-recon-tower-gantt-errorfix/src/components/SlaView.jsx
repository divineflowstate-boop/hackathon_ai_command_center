import { AlertTriangle, Clock3, Gauge } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AiAnswer } from './AiAnswer';
import { formatUtc } from '../utils/format';

export function SlaView({ data, answer }) {
  data = data || {};
  if (data.available === false) return <Unavailable title="SLA / ETA Predictor" message={data.reasonIfUnavailable}/>;
  const riskClass = String(data.risk || '').toLowerCase();
  return <section className="viewScreen fadeIn">
    <div className="viewHeader"><div><h1>SLA / ETA Predictor</h1><p>Prediction based on current stage, baseline and runtime signals.</p></div>{data.risk && <span className={`riskPill ${riskClass}`}>{data.risk} RISK</span>}</div>
    <AiAnswer title="AI Prediction" answer={answer || data.answer}/>
    <div className="riskGrid">
      {data.breachProbability !== null && data.breachProbability !== undefined && <Metric icon={<Gauge/>} label="Breach Probability" value={`${data.breachProbability}%`} tone={data.breachProbability > 70 ? 'danger' : data.breachProbability > 30 ? 'warning' : ''} />}
      {data.etaP50 && data.etaP50 !== '-' && <Metric icon={<Clock3/>} label="ETA p50" value={formatMaybeDate(data.etaP50)} />}
      {data.etaP90 && data.etaP90 !== '-' && <Metric icon={<Clock3/>} label="ETA p90" value={formatMaybeDate(data.etaP90)} />}
      {data.slaCutoff && data.slaCutoff !== '-' && <Metric icon={<AlertTriangle/>} label="SLA Cutoff" value={formatMaybeDate(data.slaCutoff)} tone="danger" />}
    </div>
    <div className="twoCol">
      <div className="panel"><h3>Remaining Time by Stage</h3>{data.stageRemaining?.length ? <ResponsiveContainer width="100%" height={330}><BarChart data={data.stageRemaining}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="stage" tick={{ fontSize: 11 }}/><YAxis/><Tooltip/><Legend/><Bar dataKey="p50" name="p50 minutes" fill="#415A77" radius={[6,6,0,0]}/><Bar dataKey="p90" name="p90 minutes" fill="#B8860B" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer> : <div className="emptyBlock">No SLA stage chart returned by API.</div>}</div>
      <div className="panel"><h3>Evidence</h3>{data.reasons?.length ? <ul className="reasonList">{data.reasons.map((r) => <li key={r}>{r}</li>)}</ul> : <div className="emptyBlock">No evidence reasons returned by API.</div>}</div>
    </div>
  </section>
}
function Metric({ icon, label, value, tone='' }) { return <div className={`metricCard ${tone}`}>{icon}<span>{label}</span><strong>{value}</strong></div> }
function formatMaybeDate(value) { return String(value).includes('T') ? formatUtc(value) : value; }
function Unavailable({ title, message }) { return <section className="viewScreen fadeIn"><div className="viewHeader"><div><h1>{title}</h1></div></div><div className="emptyStatePanel"><h3>Data unavailable</h3><p>{message || 'Information is not available for this execution.'}</p></div></section>; }
