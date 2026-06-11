import { Search, SendHorizontal } from 'lucide-react';
import { askExamples, promptPresets } from '../data/prompts';
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
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Ask a question about today's reconciliation activity..."
      />
      <button aria-label="Ask" onClick={() => submit()}><SendHorizontal size={18}/></button>
    </div>
    {!compact && <>
      <div className="askExamples">
        {askExamples.map((x) => <button key={x} onClick={() => submit(x)}>{x}</button>)}
      </div>
      <p className="suggested">Suggested investigations</p>
      <div className="promptGrid opsPromptGrid">
        {promptPresets.map((p) => <button key={p.id} onClick={() => submit(p.message)}>{p.label}</button>)}
      </div>
    </>}
  </div>
}
