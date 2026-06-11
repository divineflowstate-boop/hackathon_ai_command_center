import { useMemo, useState } from 'react';
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
import { AiAnswer } from './components/AiAnswer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { askReconAgent } from './services/reconApi';
import { promptPresets } from './data/prompts';
import './styles.css';

const navToQuestion = {
  overview: "Summarize today's recon health",
  live: 'Where is PELIX right now?',
  sla: 'Review SLA risks for today',
  anomalies: 'Detect anomalies for PELIX',
  resolve: 'What should I do next for PELIX?',
  cost: 'Analyze cost anomalies for today'
};

export default function App() {
  const [phase, setPhase] = useState('landing');
  const [activeView, setActiveView] = useState('overview');
  const [question, setQuestion] = useState('');
  const [payload, setPayload] = useState(null);
  const [apiError, setApiError] = useState('');

  async function runAsk(nextQuestion) {
    const q = nextQuestion || "Summarize today's recon health";
    setQuestion(q);
    setApiError('');
    setPhase('thinking');
    try {
      const result = await askReconAgent(q);
      setPayload(result);
      setActiveView(intentToView(result.intent));
      setTimeout(() => setPhase('ready'), 380);
    } catch (error) {
      setApiError(error.message || 'API call failed');
      setPayload(null);
      setPhase('error');
    }
  }

  function handleNav(id) {
    setActiveView(id);
    const questionForNav = navToQuestion[id];
    if (questionForNav) runAsk(questionForNav);
  }

  const headerMeta = useMemo(() => {
    if (payload?.summary?.date) return { date: payload.summary.date, generatedAt: payload.summary.generatedAt };
    if (payload?.costData?.date) return { date: payload.costData.date, generatedAt: payload.costData.generatedAt };
    return { date: '', generatedAt: '' };
  }, [payload]);

  const content = renderContent({ phase, payload, question, runAsk, apiError });

  return <div className="app">
    <Header apiError={apiError} meta={headerMeta}/>
    <div className="layout">
      <Sidebar activeView={activeView} onNav={handleNav}/>
      <main className="workspace">
        {phase !== 'landing' && <AskBox compact onAsk={runAsk}/>}        
        <ErrorBoundary key={`${phase}-${activeView}-${question}`}>{content}</ErrorBoundary>
      </main>
    </div>
  </div>;
}

function renderContent({ phase, payload, question, runAsk, apiError }) {
  if (phase === 'landing') return <Landing onAsk={runAsk}/>;
  if (phase === 'thinking') return <ThinkingView question={question} toolName={payload?.toolName}/>;
  if (phase === 'error') return <ErrorView message={apiError || 'Unable to load recon data'} onRetry={() => runAsk(question)}/>;
  if (!payload) return <Landing onAsk={runAsk}/>;

  switch (payload.intent) {
    case 'investigate': return <InvestigationView data={payload.reconDetail} answer={payload.answer} onAsk={runAsk}/>;
    case 'sla': return <SlaView data={payload.slaRisk} answer={payload.answer}/>;
    case 'anomalies': return <AnomaliesView data={payload.anomalies} answer={payload.answer}/>;
    case 'resolve': return <ResolveView data={payload.recommendedAction} answer={payload.answer}/>;
    case 'cost': return <CostView data={payload.costData} answer={payload.answer}/>;
    case 'answer': return <AnswerOnlyView data={payload.answerOnly} />;
    case 'daily':
    default: return <DailySummaryView data={payload.summary} answer={payload.answer} onAsk={runAsk} onOpenRecon={(r) => runAsk(`Where is recon identifier ${r.identifier} with executionId ${r.executionId} right now?`)}/>;
  }
}

function Landing({ onAsk }) {
  return <section className="landing fadeIn">
    <div className="landingCenter">
      <div className="landingEyebrow">Operations workspace</div>
      <h1>Unified Recon Tower</h1>
      <p>Ask about recon health, blocked executions, SLA risk, anomalies and cost.</p>
      <AskBox onAsk={onAsk}/>
      <div className="screenHint">Ask-driven workspace. Evidence and actions render only after the question is understood.</div>
    </div>
    <div className="demoStrip opsStrip">
      {promptPresets.map((p) => <button key={p.id} onClick={() => onAsk(p.message)}><span>{p.label}</span></button>)}
    </div>
  </section>;
}


function AnswerOnlyView({ data }) {
  return <section className="viewScreen fadeIn">
    <div className="viewHeader"><div><h1>Assistant Response</h1><p>The backend returned a direct answer without tool evidence.</p></div></div>
    <AiAnswer title="AI Answer" answer={data?.answer}/>
  </section>;
}

function intentToView(intent) {
  return { daily: 'overview', investigate: 'live', sla: 'sla', anomalies: 'anomalies', resolve: 'resolve', cost: 'cost', answer: 'overview' }[intent] || 'overview';
}

function ErrorView({ message, onRetry }) {
  return <section className="errorState fadeIn">
    <h2>Unable to retrieve recon data</h2>
    <p>{message}</p>
    <button className="primaryBtn" onClick={onRetry}>Retry API call</button>
  </section>;
}
