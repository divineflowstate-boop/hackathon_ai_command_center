import { AlertTriangle, BarChart3, SlidersHorizontal } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function AnomaliesView({ data }) {
  const chart = data.map((a) => ({ metric: a.metric, actual: a.actual, baseline: a.baseline }));
  return <section className="viewScreen fadeIn">
    <div className="viewHeader"><div><h1>Anomaly Detection</h1><p>Signal cards are ranked by severity and backed by same-day evidence.</p></div><button className="secondaryBtn"><SlidersHorizontal size={16}/> Filters</button></div>
    <div className="anomalyCards">
      {data.map((a) => <div className={`anomalySignal ${a.severity.toLowerCase()}`} key={a.title}>
        <div className="anomalyTop"><span>{a.severity}</span><AlertTriangle size={18}/></div>
        <b>{a.title}</b>
        <p>{a.evidence}</p>
        <div className="anomalyMetric"><small>Actual</small><strong>{a.actual}</strong><small>Baseline</small><strong>{a.baseline}</strong></div>
      </div>)}
    </div>
    <div className="twoCol">
      <div className="panel"><h3>Actual vs Baseline</h3><ResponsiveContainer width="100%" height={320}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="metric"/><YAxis/><Tooltip/><Bar dataKey="baseline" fill="#C9C6BE" name="Baseline" radius={[6,6,0,0]}/><Bar dataKey="actual" fill="#B8323B" name="Actual" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
      <div className="panel"><h3>Evidence Feed</h3><div className="evidenceFeed">{data.map((a) => <div key={a.title}><BarChart3 size={18}/><div><b>{a.title}</b><small>{a.evidence}</small></div></div>)}</div></div>
    </div>
  </section>
}
