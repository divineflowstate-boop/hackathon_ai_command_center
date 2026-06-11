import { Search, SendHorizontal } from 'lucide-react';
import { promptPresets } from '../data/mockData';
import { useState } from 'react';

export function AskBox({ onAsk, compact = false }) {
  const [value, setValue] = useState('');
  const submit = (question = value) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setValue(trimmed);
    onAsk(trimmed);
  };

  return <div className={`askBox ${compact ? 'compactAsk' : ''}`}>
    <div className="askInput">
      <Search size={18}/>
      <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Ask about a recon, stage, SLA, anomaly, incident or cost..." />
      <button onClick={() => submit()}><SendHorizontal size={18}/></button>
    </div>
    {!compact && <>
      <p className="suggested">Try these</p>
      <div className="promptGrid">
        {promptPresets.map((p) => <button key={p.id} onClick={() => submit(p.question)}>{p.label}</button>)}
      </div>
    </>}
  </div>
}
