import { Bell, CalendarDays, CircleHelp, Clock3, Database, Server } from 'lucide-react';

export function Header({ useApi, onToggleApi, apiError }) {
  return <header className="topbar">
    <div className="brandText">JPMorgan Chase &amp; Co.</div>
    <div className="productTitle"><b>Unified Recon Tower</b><span>Predict. Detect. Resolve.</span></div>
    <div className="headerSpacer" />
    <div className="modeSelect" title="Select data source">
      {useApi ? <Server size={15}/> : <Database size={15}/>}
      <span>Data</span>
      <select value={useApi ? 'api' : 'mock'} onChange={(e) => onToggleApi(e.target.value === 'api')}>
        <option value="mock">Mock</option>
        <option value="api">API</option>
      </select>
    </div>
    {apiError && <span className="apiError">API fallback: mock</span>}
    <span className="env"><i /> PROD</span>
    <span className="headerMeta"><CalendarDays size={15}/> Jun 09, 2026</span>
    <span className="headerMeta"><Clock3 size={15}/> 09:32 UTC</span>
    <CircleHelp size={18}/>
    <Bell size={18}/>
    <span className="avatar">RA</span>
  </header>
}
