import { Bot, ChevronRight, FileText, ShieldAlert, Sparkles } from 'lucide-react';

export function ResolveView({ data }) {
  return <section className="viewScreen fadeIn resolveLayout">
    <div className="viewHeader"><div><h1>Recommended Actions</h1><p>Based on failure analysis, similar incidents and runbooks.</p></div><div className="confidence"><span>Confidence</span><strong>{data.confidence}%</strong><i /></div></div>
    <div className="actionCards">
      <ActionCard icon={<ShieldAlert/>} title="Likely Cause" body={data.likelyCause} extra={<><b>Why?</b><p>{data.why}</p></>} />
      <ActionCard icon={<FileText/>} title="Recommended Next Step" body={<ol>{data.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol>} extra={<p>Estimated Effort<br/><b>15 - 20 mins</b></p>} />
      <ActionCard icon={<Sparkles/>} title="Impact" body={data.impact} extra={<><p>SLA Risk<br/><b className="dangerText">{data.slaRisk}</b></p><p>ETA if unresolved<br/><b className="dangerText">{data.etaIfUnresolved}</b></p></>} />
    </div>
    <div className="resolveGrid">
      <div className="panel"><h3>Similar Incidents</h3><table><thead><tr><th>Incident ID</th><th>Summary</th><th>Occurred On</th><th>Resolution</th><th>Outcome</th></tr></thead><tbody>{data.similarIncidents.map((i) => <tr key={i.id}><td>{i.id}</td><td>{i.summary}</td><td>{i.occurred}</td><td>{i.resolution}</td><td className="successText">{i.outcome}</td></tr>)}</tbody></table></div>
      <div className="copilotPanel"><h3><Bot size={18}/> Copilot</h3><div className="chatBubble ask">What should I do next for HELIX_CR_DR_REC?</div><div className="chatBubble answer">Based on the analysis, the recon failed due to schema validation in PRE_MATCH_R. Follow the recommended steps to resolve.</div><div className="followUp">Follow up... <ChevronRight size={16}/></div></div>
    </div>
  </section>
}
function ActionCard({ icon, title, body, extra }) { return <div className="panel actionCard"><div className="actionIcon">{icon}</div><h3>{title}</h3><div className="actionBody">{typeof body === 'string' ? <p>{body}</p> : body}</div><div className="actionExtra">{extra}</div><button className="secondaryBtn">View Evidence</button></div> }
