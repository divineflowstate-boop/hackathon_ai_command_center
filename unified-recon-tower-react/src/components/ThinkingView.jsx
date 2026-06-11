import { CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react';

export function ThinkingView({ question, toolName }) {
  const steps = ['Understanding request', `Calling ${toolName || 'agent tool'}`, 'Building insight workspace', 'Preparing recommendations'];
  return <section className="thinkingView">
    <LoaderCircle className="spinner" size={58}/>
    <h2>Analyzing your request...</h2>
    <p className="asked">{question}</p>
    <div className="thinkingSteps">
      {steps.map((step, i) => <div className="thinkingStep" style={{ animationDelay: `${i * 180}ms` }} key={step}>
        {i < 3 ? <CheckCircle2 size={18}/> : <Sparkles size={18}/>} {step}
      </div>)}
    </div>
    <div className="subtleNote"><Sparkles size={15}/> This may take a few seconds</div>
  </section>
}
