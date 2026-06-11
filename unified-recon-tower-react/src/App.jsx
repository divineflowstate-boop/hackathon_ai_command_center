import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AskBox } from './components/AskBox';
import { ThinkingView } from './components/ThinkingView';
import { DailySummaryView } from './components/DailySummaryView';
import { InvestigationView } from './components/InvestigationView';
import { SlaView } from './components/SlaView';
import { AnomaliesView } from './components/AnomaliesView';
import { ResolveView } from './components/ResolveView';
import { CostView } from './components/CostView';
import { askReconAgent } from './services/reconApi';
import { promptPresets } from './data/mockData';
import './styles.css';

const navToQuestion = {
  overview: 'Show daily summary for today',
  live: 'Where is HELIX_CR_DR_REC right now?',
  sla: 'Will HELIX_CR_DR_REC breach SLA?',
  anomalies: 'Detect anomalies for HELIX_CR_DR_REC',
  resolve: 'What should I do next for HELIX_CR_DR_REC?',
  cost: 'Cost by recon and stage for today'
};

export default function App() {
  const [phase, setPhase] = useState('landing');
  const [activeView, setActiveView] = useState('overview');
  const [question, setQuestion] = useState('');
  const [payload, setPayload] = useState(null);
  const [useApi, setUseApi] = useState(false);
  const [apiError, setApiError] = useState('');

  async function runAsk(nextQuestion) {
    const q = nextQuestion || 'Show daily summary for today';
    setQuestion(q);
    setApiError('');
    setPhase('thinking');
    const result = await askReconAgent(q, useApi);
    setPayload(result);
    setActiveView(intentToView(result.intent));
    setApiError(result.apiError || '');
    setTimeout(() => setPhase('ready'), 380);
  }

  function handleNav(id) {
    setActiveView(id);
    const questionForNav = navToQuestion[id];
    if (questionForNav) runAsk(questionForNav);
  }

  const content = renderContent({ phase, payload, question, runAsk });

  return <div className="app">
    <Header useApi={useApi} onToggleApi={(nextUseApi) => setUseApi(nextUseApi)} apiError={apiError}/>
    <div className="layout">
      <Sidebar activeView={activeView} onNav={handleNav}/>
      <main className="workspace">
        {phase !== 'landing' && <AskBox compact onAsk={runAsk}/>}        
        {content}
      </main>
    </div>
  </div>;
}

function renderContent({ phase, payload, question, runAsk }) {
  if (phase === 'landing') return <Landing onAsk={runAsk}/>;
  if (phase === 'thinking') return <ThinkingView question={question} toolName={payload?.toolName}/>;
  if (!payload) return <Landing onAsk={runAsk}/>;

  switch (payload.intent) {
    case 'investigate': return <InvestigationView data={payload.reconDetail} onAsk={runAsk}/>;
    case 'sla': return <SlaView data={payload.slaRisk}/>;
    case 'anomalies': return <AnomaliesView data={payload.anomalies}/>;
    case 'resolve': return <ResolveView data={payload.recommendedAction}/>;
    case 'cost': return <CostView data={payload.costData}/>;
    case 'daily':
    default: return <DailySummaryView data={payload.summary} onAsk={runAsk} onOpenRecon={(r) => runAsk(`Where is ${r.identifier} right now?`)}/>;
  }
}

function Landing({ onAsk }) {
  return <section className="landing fadeIn">
    <div className="landingCenter">
      <h1>Unified Recon Tower</h1>
      <p>Predict. Detect. Resolve.</p>
      <AskBox onAsk={onAsk}/>
      <div className="screenHint">Ask-driven workspace. Nothing loads until the user asks.</div>
    </div>
    <div className="demoStrip">
      {promptPresets.slice(0, 5).map((p, i) => <div key={p.id}><b>{i + 1}</b><span>{p.label}</span></div>)}
    </div>
  </section>;
}

function intentToView(intent) {
  return { daily: 'overview', investigate: 'live', sla: 'sla', anomalies: 'anomalies', resolve: 'resolve', cost: 'cost' }[intent] || 'overview';
}
