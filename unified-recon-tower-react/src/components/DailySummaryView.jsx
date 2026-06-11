import { CheckCircle2, Download, Search, SlidersHorizontal, XCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatusBadge } from './StatusBadge';
import { formatUtc } from '../utils/format';

export function DailySummaryView({ data, onAsk, onOpenRecon }) {
  const chartData = [
    { name: 'Failed', count: data.failedCount, color: '#B8323B' },
    { name: 'In Progress', count: data.inProgressCount, color: '#B8860B' },
    { name: 'Completed', count: data.completedCount, color: '#237A4B' },
    { name: 'Not Started / Other', count: data.otherCount || 0, color: '#A7A7A7' }
  ];

  const progressByRecon = data.recons.slice(0, 6).map((r) => ({
    identifier: r.identifier,
    progress: Number(r.progress || 0),
    status: r.status
  }));

  return <section className="viewScreen fadeIn">
    <div className="viewHeader">
      <div><h1>Daily Summary</h1><p>As of Jun 09, 2026 09:32 UTC</p></div>
      <button className="secondaryBtn"><Download size={16}/> Export</button>
    </div>
    <div className="metadataStrip">
      <span><b>Batch date</b> Jun 09, 2026</span>
      <span><b>Generated at</b> 17:59:12 UTC</span>
      <span><b>Source</b> exec-server-core</span>
    </div>
    <div className="kpiRow">
      <Kpi label="Total Recons" value={data.totalRecons} tone="neutral" note="For Jun 09 batch" />
      <Kpi label="Completed" value={data.completedCount} tone="success" note="12.5% of total" icon={<CheckCircle2 size={24}/>} />
      <Kpi label="In Progress" value={data.inProgressCount} tone="info" note="3 active runs" />
      <Kpi label="Failed" value={data.failedCount} tone="danger" note="Requires attention" icon={<XCircle size={24}/>} />
      <Kpi label="Overall Progress" value={`${data.overallProgress}%`} tone="info" note="Based on completed stages" />
    </div>
    <div className="summaryGrid">
      <div className="panel"><div className="panelHeader"><h3>Recon Status Distribution</h3><span>View all</span></div><ResponsiveContainer width="100%" height={260}><BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 24 }}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false}/><YAxis dataKey="name" type="category" width={120}/><Tooltip/><Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={16}>{chartData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div className="panel"><h3>Recon Progress</h3><ResponsiveContainer width="100%" height={260}><BarChart data={progressByRecon} layout="vertical" margin={{ left: 12, right: 26 }}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`}/><YAxis dataKey="identifier" type="category" width={150} tick={{ fontSize: 11 }}/><Tooltip formatter={(v) => `${v}%`}/><Bar dataKey="progress" radius={[0, 8, 8, 0]} barSize={14}>{progressByRecon.map((entry) => <Cell key={entry.identifier} fill={entry.status === 'FAILED' ? '#B8323B' : entry.status === 'COMPLETED' ? '#237A4B' : '#B8860B'}/>)}</Bar></BarChart></ResponsiveContainer></div>
    </div>
    <div className="panel tablePanel"><div className="panelHeader"><h3>Recon Executions ({data.recons.length})</h3><div className="tableActions"><span><Search size={15}/> Search recons...</span><button><SlidersHorizontal size={16}/></button><button><Download size={16}/></button></div></div><table><thead><tr><th>Identifier</th><th>Status</th><th>Progress</th><th>Start Time (UTC)</th><th>End Time (UTC)</th><th>Duration</th><th>Current Stage</th><th>Owner</th></tr></thead><tbody>{data.recons.map((r) => <tr key={r.executionId} onClick={() => onOpenRecon(r)}><td>{r.identifier}</td><td><StatusBadge status={r.status}/></td><td><Progress value={r.progress}/></td><td>{formatUtc(r.startTime)}</td><td>{formatUtc(r.endTime)}</td><td>{r.duration}</td><td className={r.status === 'FAILED' ? 'dangerText' : ''}>{r.currentStage}</td><td>{r.owner}</td></tr>)}</tbody></table><div className="tableFooter">1–5 of 8 <span>5 / page</span></div></div>
  </section>
}

function Kpi({ label, value, tone, note, icon, spark }) {
  return <div className={`kpiCard ${tone}`}><div className="kpiTop"><span>{label}</span>{icon}</div><strong>{value}</strong><small>{note}</small>{spark && <div className="miniSpark" />}</div>
}

function Progress({ value }) { return <div className="progressWrap"><span>{value}%</span><i><b style={{ width: `${value}%` }}/></i></div> }
