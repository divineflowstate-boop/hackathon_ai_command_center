import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function CostView({ data }) {
  return <section className="viewScreen fadeIn">
    <div className="viewHeader"><div><h1>Cost Visibility</h1><p>Cost by recon and stage for Jun 09, 2026.</p></div></div>
    <div className="riskGrid">
      <div className="metricCard"><span>Total cost</span><strong>{data.totalCost}</strong></div>
      <div className="metricCard"><span>Cost per successful recon</span><strong>{data.costPerSuccessfulRecon}</strong></div>
      <div className="metricCard"><span>Highest cost recon</span><strong>{data.highestCostRecon}</strong></div>
      <div className="metricCard danger"><span>Cost anomaly</span><strong>2.3x</strong></div>
    </div>
    <div className="twoCol"><div className="panel"><h3>Cost by Stage</h3><ResponsiveContainer width="100%" height={320}><BarChart data={data.byStage}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="stage"/><YAxis/><Tooltip/><Bar dataKey="cost" fill="#415A77" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><div className="panel"><h3>Insight</h3><p>Recon ABC matching cost today is 2.3x normal due to extended compute runtime.</p><p className="muted">Likely reason: input size + retry loop.</p></div></div>
  </section>
}
