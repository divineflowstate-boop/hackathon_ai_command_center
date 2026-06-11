import { ArrowLeft, Check, Copy, Download, FileText, XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { reconDetail as fallbackDetail } from '../data/mockData';

export function InvestigationView({ data = fallbackDetail, onAsk }) {
  return <section className="viewScreen fadeIn investigation">
    <button className="backBtn" onClick={() => onAsk('Show daily summary for today')}><ArrowLeft size={16}/> Back to summary</button>
    <div className="reconHero"><div><h1>{data.identifier}</h1><StatusBadge status={data.status}/></div><div className="reconMeta"><span>Execution ID</span><b>{data.executionId}</b><button><Copy size={15}/></button><span>Started</span><b>{data.started}</b><span>Duration</span><b>{data.duration}</b></div></div>
    <div className="tabs"><b>Overview</b><span>Timeline</span><span>Files</span><span>Details</span><span>Raw Data</span></div>
    <div className="investGrid">
      <div className="panel"><h3>Current Insight</h3><ul className="insightList">{data.currentInsight.map((x, i) => <li key={x}>{i === 0 ? <XCircle size={17}/> : <Check size={17}/>}<span>{x}</span></li>)}</ul></div>
      <div className="panel"><h3>Stage Timeline</h3>{data.stages.map((s) => <StageRow key={s.name} stage={s}/>)}</div>
      <div className="panel"><div className="panelHeader"><h3>Files Received</h3><span className="successText">All files received</span></div>{data.files.map((f) => <div className="fileRow" key={f.fileName}><FileText size={18}/><div><b>{f.fileName}</b><small>Received<br/>{f.received}</small></div><div><small>Pattern Match</small><strong className="successText">{f.pattern}</strong></div><Download size={16}/></div>)}</div>
      <div className="panel quickActions"><h3>Quick Actions</h3><button className="primaryBtn" onClick={() => onAsk(`What should I do next for ${data.identifier}?`)}>Resolve with Copilot</button><button onClick={() => onAsk(`Will ${data.identifier} breach SLA?`)}>Predict SLA Risk</button><button onClick={() => onAsk(`Detect anomalies for ${data.identifier}`)}>Detect Anomalies</button><button>View RCA</button></div>
    </div>
  </section>
}

function StageRow({ stage }) {
  return <div className="stageRow"><span>{stage.name}</span><i><b className={stage.status.toLowerCase()} style={{ width: `${Math.max(stage.progress, stage.status === 'FAILED' ? 86 : 0)}%` }}/></i><em>{stage.status}</em></div>
}
