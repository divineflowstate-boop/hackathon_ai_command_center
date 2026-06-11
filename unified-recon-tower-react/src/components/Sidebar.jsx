import { AlertTriangle, Bot, Clock3, FileText, Home, Settings, ShieldCheck, WalletCards, Wrench } from 'lucide-react';

const items = [
  ['overview', 'Overview', Home], ['live', 'Live State', ShieldCheck], ['sla', 'SLA / ETA', Clock3],
  ['anomalies', 'Anomalies', AlertTriangle], ['resolve', 'Resolve', Wrench], ['cost', 'Cost', WalletCards],
  ['reports', 'Reports', FileText], ['settings', 'Settings', Settings]
];

export function Sidebar({ activeView, onNav }) {
  return <aside className="sidebar">
    <div className="navGroup">
      {items.map(([id, label, Icon]) => <button key={id} className={activeView === id ? 'active' : ''} onClick={() => onNav(id)}>
        <Icon size={18}/> <span>{label}</span>
      </button>)}
    </div>
    <button className="copilotNav"><Bot size={18}/> Copilot <i /></button>
  </aside>
}
