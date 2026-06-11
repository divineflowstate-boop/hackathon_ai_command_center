import { FileText, ShieldAlert, Sparkles } from 'lucide-react';
import { AiAnswer } from './AiAnswer';
import { formatUtc } from '../utils/format';

export function ResolveView({ data, answer }) {
  data = data || { nextSteps: [], similarIncidents: [], evidence: [] };
  const confidenceClass = confidenceTone(data.confidence);
  return <section className="viewScreen fadeIn resolveLayout">
    <div className="viewHeader"><div><h1>Recommended Actions</h1><p>Resolution guidance returned by the incident resolution agent.</p></div>{data.confidence !== null && data.confidence !== undefined && <div className={`confidence ${confidenceClass}`}><span>Confidence</span><strong>{data.confidence}%</strong><i /></div>}</div>
    <AiAnswer title="Recommended Resolution" answer={answer || data.answer}/>
    <div className="actionCards">
      <ActionCard icon={<ShieldAlert/>} title="Likely Cause" body={data.likelyCause} extra={data.why && data.why !== '-' ? <><b>Signal</b><p>{data.why}</p></> : null} evidence={data.evidence} />
      <ActionCard icon={<FileText/>} title="Recommended Next Step" body={data.nextSteps?.length ? <ol>{data.nextSteps.map((s, idx) => <li key={idx}>{formatValue(s)}</li>)}</ol> : 'No next steps returned by API.'} extra={data.owner ? <p>Owner<br/><b>{formatValue(data.owner)}</b></p> : null} evidence={data.evidence} />
      <ActionCard icon={<Sparkles/>} title="Impact" body={formatValue(data.impact)} extra={<>{data.slaRisk && data.slaRisk !== '-' && <p>SLA Risk<br/><b className="dangerText">{data.slaRisk}</b></p>}{data.etaIfUnresolved && data.etaIfUnresolved !== '-' && <p>ETA if unresolved<br/><b className="dangerText">{data.etaIfUnresolved}</b></p>}</>} evidence={data.evidence} />
    </div>
    <div className="panel resolveTable"><h3>Similar Incidents</h3>{data.similarIncidents?.length ? <table><thead><tr><th>Incident ID</th><th>Summary</th><th>Occurred On</th><th>Resolution</th><th>Outcome</th></tr></thead><tbody>{data.similarIncidents.map((i) => <tr key={i.id}><td>{formatValue(i.id)}</td><td>{formatValue(i.summary)}</td><td>{i.occurred ? formatUtc(i.occurred) : '-'}</td><td>{formatValue(i.resolution)}</td><td className="successText">{formatValue(i.outcome || '-')}</td></tr>)}</tbody></table> : <div className="emptyBlock">No similar incidents returned by API.</div>}</div>
  </section>
}
function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v)}`).join(' · ');
  return String(value);
}

function ActionCard({ icon, title, body, extra, evidence }) { return <div className="panel actionCard"><div className="actionIcon">{icon}</div><h3>{title}</h3><div className="actionBody">{typeof body === 'string' ? <p>{body}</p> : body}</div>{extra && <div className="actionExtra">{extra}</div>}{Array.isArray(evidence) && evidence.length > 0 && <button className="secondaryBtn">View Evidence</button>}</div> }
function confidenceTone(value) { const n = Number(value); if (!Number.isFinite(n)) return ''; if (n <= 30) return 'low'; if (n <= 70) return 'medium'; return 'high'; }
