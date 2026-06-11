import { AlertTriangle, Clock3, Gauge } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function SlaView({ data }) {
  return <section className="viewScreen fadeIn">
    <div className="viewHeader"><div><h1>SLA / ETA Predictor</h1><p>Prediction for HELIX_CR_DR_REC based on current stage, baseline and infra health.</p></div><span className="riskPill high">HIGH RISK</span></div>
    <div className="riskGrid">
      <Metric icon={<Gauge/>} label="Breach Probability" value={`${data.breachProbability}%`} tone="danger" />
      <Metric icon={<Clock3/>} label="ETA p50" value={data.etaP50} />
      <Metric icon={<Clock3/>} label="ETA p90" value={data.etaP90} />
      <Metric icon={<AlertTriangle/>} label="SLA Cutoff" value={data.slaCutoff} tone="danger" />
    </div>
    <div className="twoCol">
      <div className="panel"><h3>Remaining Time by Stage</h3><ResponsiveContainer width="100%" height={330}><BarChart data={data.stageRemaining}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="stage" tick={{ fontSize: 11 }}/><YAxis/><Tooltip/><Legend/><Bar dataKey="p50" name="p50 minutes" fill="#415A77" radius={[6,6,0,0]}/><Bar dataKey="p90" name="p90 minutes" fill="#B8860B" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
      <div className="panel"><h3>Evidence</h3><ul className="reasonList">{data.reasons.map((r) => <li key={r}>{r}</li>)}</ul><div className="recommendationBox"><b>Recommended action</b><p>Resolve PRE_PROCESSING failure before 15:00 UTC to avoid likely SLA breach.</p></div></div>
    </div>
  </section>
}
function Metric({ icon, label, value, tone='' }) { return <div className={`metricCard ${tone}`}>{icon}<span>{label}</span><strong>{value}</strong></div> }
