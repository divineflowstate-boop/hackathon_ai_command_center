import { Bell, CalendarDays, CircleHelp, Clock3, Database, Server } from 'lucide-react';
import { formatDate, formatUtc } from '../utils/format';

export function Header({ apiError, meta }) {
  return <header className="topbar">
    <div className="brandText">JPMorgan Chase &amp; Co.</div>
    <div className="productTitle"><b>Unified Recon Tower</b><span>Predict. Detect. Resolve.</span></div>
    <div className="headerSpacer" />
    <div className="modeSelect" title="Backend API mode">
      <Server size={15}/>
      <span>API Connected</span>
    </div>
    {apiError && <span className="apiError">API error</span>}
    <span className="env"><i /> PROD</span>
    <span className="headerMeta"><CalendarDays size={15}/> {formatDate(meta?.date) || '-'}</span>
    <span className="headerMeta"><Database size={15}/> DynamoDB</span>
    <span className="headerMeta"><Clock3 size={15}/> {formatUtc(meta?.generatedAt)}</span>
    <CircleHelp size={18}/>
    <Bell size={18}/>
    <span className="avatar">RA</span>
  </header>
}
