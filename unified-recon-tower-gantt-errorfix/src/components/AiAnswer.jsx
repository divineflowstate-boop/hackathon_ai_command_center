import { Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function AiAnswer({ answer, title = 'AI Answer', compact = false }) {
  const [expanded, setExpanded] = useState(!compact);
  const text = normalizeAnswer(answer);

  if (!text) return null;

  return <div className={`aiAnswer ${expanded ? 'expanded' : 'collapsed'}`}>
    <div className="aiAnswerHeader" onClick={() => setExpanded((v) => !v)}>
      <span><Bot size={17}/> {title}</span>
      <button>{expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
    </div>
    {expanded && <div className="aiAnswerBody">{renderLines(text)}</div>}
  </div>;
}

function normalizeAnswer(answer) {
  if (!answer) return '';
  return String(answer)
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .replace(/\r/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

function renderLines(text) {
  return text.split('\n').filter(Boolean).map((line, idx) => {
    const clean = line.trim();
    if (clean.startsWith('###')) return <h4 key={idx}>{clean.replace(/^#+\s*/, '')}</h4>;
    if (clean.startsWith('- ')) return <p key={idx} className="aiBullet">{clean}</p>;
    return <p key={idx}>{clean}</p>;
  });
}
