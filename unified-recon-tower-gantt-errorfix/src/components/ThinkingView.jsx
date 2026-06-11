import { CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react';

export function ThinkingView({ question }) {
  const steps = ['Understanding request', 'Fetching execution data', 'Building insights', 'Rendering workspace'];
  return <section className="thinkingView">
    <LoaderCircle className="spinner" size={58}/>
    <h2>Analyzing recon activity</h2>
    <p className="asked">{question}</p>
    <div className="thinkingSteps">
      {steps.map((step, i) => <div className="thinkingStep" style={{ animationDelay: `${i * 180}ms` }} key={step}>
        {i < 3 ? <CheckCircle2 size={18}/> : <Sparkles size={18}/>} {step}
      </div>)}
    </div>
  </section>
}
