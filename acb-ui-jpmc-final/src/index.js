import React, {useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import './styles.css';

const API = process.env.REACT_APP_API || 'http://localhost:8080/api';
async function get(path){ const r=await fetch(API+path); return r.json(); }
async function post(path, body={}){ const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return r.json(); }

function App(){
  const [page,setPage]=useState('mission');
  const [agents,setAgents]=useState([]);
  const [activity,setActivity]=useState([]);
  const [approvals,setApprovals]=useState([]);
  const [metrics,setMetrics]=useState(null);
  const [selected,setSelected]=useState(null);
  const [apiState,setApiState]=useState('Connecting');

  const refresh=()=>Promise.all([get('/agents'),get('/activity'),get('/approvals'),get('/metrics')])
    .then(([a,ac,ap,m])=>{setAgents(a);setActivity(ac);setApprovals(ap);setMetrics(m);setApiState('Live');})
    .catch(()=>setApiState('API unavailable'));

  useEffect(()=>{refresh(); const i=setInterval(refresh,3000); return()=>clearInterval(i)},[]);
  const stats = metrics?.summary || {};

  return <div className="app">
    <TopBar stats={stats} apiState={apiState}/>
    <aside className="side">
      <div className="brand"><div className="mark">ACB</div><div><b>Agent Control Bureau</b><span>Know. Govern. Maximize.</span></div></div>
      {[
        ['mission','Agent Field View'],
        ['registry','Agent Registry'],
        ['governance','Admin Loop'],
        ['value','Cost Intelligence'],
        ['ask','Ask Bureau']
      ].map(x=><button key={x[0]} onClick={()=>setPage(x[0])} className={page===x[0]?'active':''}>{x[1]}</button>)}
      <div className="sideMeta"><span>Runtime visibility</span><b>Observe. Govern. Resolve.</b></div>
    </aside>
    <main>
      <header>
        <div>
          <small className="eyebrow">JPMorgan Chase</small>
          <h1>{title(page)}</h1>
          <p>Operational intelligence for enterprise AI agents</p>
          <div className="headerTags"><span>AI Governance</span><span>Runtime Security</span><span>Cost Control</span></div>
        </div>
      </header>
      {page==='mission'&&<Mission agents={agents} activity={activity} stats={stats} onOpen={(a)=>{setSelected(a);setPage('registry')}}/>}
      {page==='registry'&&<Registry agents={agents} selected={selected} setSelected={setSelected}/>} 
      {page==='governance'&&<Governance approvals={approvals} refresh={refresh}/>} 
      {page==='value'&&<Value metrics={metrics} agents={agents}/>} 
      {page==='ask'&&<Ask/>}
    </main>
  </div>
}

function TopBar({stats,apiState}){
  return <div className="topbar">
    <div className="topLeft"><b>JPMorgan Chase</b><span>Agent Control Bureau</span></div>
    <div className="topStats"><span className="liveDot">{apiState}</span><span>{stats.agents||0} agents</span><span>{stats.under_review||0} under review</span><span>${stats.cost||0} cost</span></div>
  </div>
}
function title(p){return {mission:'Agent Field View',registry:'Agent Registry',governance:'Admin Loop',value:'Cost Intelligence',ask:'Ask Bureau'}[p]}
function statusClass(s){ if(s==='APPROVED')return 'good'; if(s==='BANNED')return 'bad'; if(s==='UNDER_REVIEW')return 'warn'; return 'muted'; }
function statusLabel(s){ return (s||'UNKNOWN').replace('_',' '); }

function Mission({agents,activity,stats,onOpen}){
  const positions=[['9%','19%'],['28%','11%'],['53%','23%'],['76%','16%'],['17%','56%'],['42%','48%'],['68%','58%'],['86%','45%'],['33%','77%'],['60%','82%']];
  return <div className="grid missionGrid">
    <section className="kpis"><K label="Known Agents" v={stats.agents||0}/><K label="Approved" v={stats.approved||0}/><K label="Threats" v={stats.under_review||0}/><K label="Tokens" v={(stats.tokens||0).toLocaleString()}/></section>
    <section className="card radar"><div className="panelTitle"><b>Agent Field View</b><span>Live runtime presence across LOBs</span></div><div className="field">
      <div className="rings"></div><div className="pulseCore">ACB</div>{agents.map((a,i)=><div key={a.id} onClick={()=>onOpen(a)} className={'agentPill '+statusClass(a.status)} style={{left:positions[i%positions.length][0],top:positions[i%positions.length][1]}}>
        <b>{a.agent_name}</b><small>{a.lob} · {a.team}</small><em>{a.model}</em><div className="tip"><b>{a.agent_name}</b><p>{a.lob} / {a.team}</p><p>Model: {a.model}</p><p>Status: {statusLabel(a.status)}</p><p>PID: {a.pid} · Port: {a.port}</p></div></div>)}
    </div></section>
    <section className="card log"><div className="panelTitle"><b>Operations Log</b><span>Last runtime events</span></div>{activity.slice(0,12).map(e=><div className={'event '+e.severity?.toLowerCase()} key={e.id}><span>{e.event_type}</span><b>{e.agent_name}</b><p>{e.message}</p></div>)}</section>
    <section className="floatingCards"><Mini title="Token spend" value={'$'+(stats.cost||0)} sub="month to date"/><Mini title="Pending decisions" value={stats.under_review||0} sub="admin loop"/><Mini title="Known usage" value={(stats.tokens||0).toLocaleString()} sub="tokens tracked"/></section>
  </div>
}
function K({label,v}){return <div className="k"><span>{label}</span><b>{v}</b></div>}
function Mini({title,value,sub}){return <div className="mini"><span>{title}</span><b>{value}</b><small>{sub}</small></div>}

function Registry({agents,selected,setSelected}){
  const [q,setQ]=useState(''); const filtered=agents.filter(a=>(a.agent_name+a.lob+a.team+a.model).toLowerCase().includes(q.toLowerCase()));
  const current=selected||filtered[0];
  return <div className="registryLayout"><section className="card"><div className="search"><input placeholder="Search agent, LOB, team, model" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="cards">{filtered.map(a=><div className={'agentCard '+statusClass(a.status)} onClick={()=>setSelected(a)} key={a.id}><div><b>{a.agent_name}</b><span className={'status '+statusClass(a.status)}>{statusLabel(a.status)}</span></div><p>{a.lob} · {a.team}</p><small>{a.model}</small><footer><span>Risk {a.risk}</span><span>{Number(a.monthly_tokens||0).toLocaleString()} tokens</span></footer></div>)}</div></section>{current&&<Personnel id={current.id}/>}</div>
}
function Personnel({id}){ const [a,setA]=useState(null); useEffect(()=>{get('/agents/'+id).then(setA)},[id]); if(!a)return <section className="card">Loading</section>; return <section className="card personnel"><div className="panelTitle"><b>{a.agent_name}</b><span className={'status '+statusClass(a.status)}>{statusLabel(a.status)}</span></div><div className="agentHero"><div className={'riskRing '+statusClass(a.status)}><b>{a.risk}</b><span>Risk</span></div><div><h3>{a.lob}</h3><p>{a.team} · {a.model}</p></div></div><div className="facts"><Mini title="LOB" value={a.lob} sub={a.team}/><Mini title="Model" value={a.model} sub={a.use_case_id}/><Mini title="Cost" value={'$'+Number(a.monthly_cost||0).toFixed(0)} sub="monthly"/><Mini title="State" value={a.is_banned?'Banned':'Active'} sub="runtime"/></div><h3>System Prompt</h3><pre>{a.system_prompt}</pre><h3>Tools</h3><div className="toolCloud">{a.tools?.map(t=><div className="tool" key={t.id}><b>{t.tool_name}</b><span>{t.approved?'Approved':'Pending'}</span><p>{t.description}</p></div>)}</div></section>}

function Governance({approvals,refresh}){ return <div className="card"><div className="panelTitle"><b>Approval Queue</b><span>Admin can approve or ban agents</span></div>{approvals.length===0&&<div className="empty">No pending approvals</div>}{approvals.map(a=><div className="approval" key={a.id}><div><span className="changeTag">New runtime change</span><h2>{a.agent_name}</h2><p>{a.lob} · {a.team} · {a.model}</p><b>{a.tool_name||a.type}</b><small>{a.reason}</small></div><div className="actions"><button onClick={()=>post('/approvals/'+a.id+'/approve').then(refresh)}>Approve</button><button className="danger" onClick={()=>post('/approvals/'+a.id+'/ban').then(refresh)}>Ban & Kill PID</button></div></div>)}</div> }

function Value({metrics,agents}){ if(!metrics)return null; const top=metrics.topAgents||[]; const lob=metrics.tokensByLob||[]; const model=metrics.modelUsage||[]; return <div className="valueGrid"><section className="card insightCard"><span>Live API metrics</span><b>Connected</b><p>All values on this screen are populated from backend metrics, agent inventory and runtime events.</p></section><section className="card"><div className="panelTitle"><b>Token Consumption by Agent</b><span>Monthly usage</span></div><ResponsiveContainer width="100%" height={260}><BarChart data={top}><XAxis dataKey="agent_name" hide/><YAxis/><Tooltip/><Bar dataKey="tokens" fill="#2563eb" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></section><section className="card"><div className="panelTitle"><b>Cost by LOB</b><span>Cost control lens</span></div><ResponsiveContainer width="100%" height={260}><BarChart data={lob}><XAxis dataKey="lob"/><YAxis/><Tooltip/><Bar dataKey="cost" fill="#2563eb" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></section><section className="card wide"><div className="panelTitle"><b>Model Usage</b><span>Which models are driving consumption</span></div><ResponsiveContainer width="100%" height={260}><AreaChart data={model}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/><XAxis dataKey="model"/><YAxis/><Tooltip/><Area type="monotone" dataKey="tokens" stroke="#2563eb" fill="#dbeafe" strokeWidth={3}/></AreaChart></ResponsiveContainer></section><section className="card"><div className="panelTitle"><b>Highest Token Agents</b><span>Click in registry for detail</span></div>{agents.slice().sort((a,b)=>(b.monthly_tokens||0)-(a.monthly_tokens||0)).slice(0,8).map((a,i)=><div className="rank" key={a.id}><b><span className="rankNo">#{i+1}</span>{a.agent_name}</b><span>{Number(a.monthly_tokens).toLocaleString()}</span><small>{a.lob} · {a.team}</small></div>)}</section></div> }

function Ask(){ const [q,setQ]=useState('Which team consumed the most tokens?'); const [ans,setAns]=useState(null); return <section className="card ask"><div className="askGlow">AI</div><h2>Ask Bureau</h2><p>Ask about agents, LOBs, models, tools, tokens, cost and threats.</p><div className="askbar"><input value={q} onChange={e=>setQ(e.target.value)} /><button onClick={()=>post('/bureau/ask',{question:q}).then(setAns)}>Ask</button></div>{ans&&<div className="answer"><b>{ans.answer}</b>{ans.data&&ans.data.map((x,i)=><p key={i}>{x.agent_name}: {x.monthly_tokens} tokens · ${x.monthly_cost}</p>)}</div>}<div className="chips"><button onClick={()=>setQ('Which agents use Athena?')}>Which agents use Athena?</button><button onClick={()=>setQ('Show under review agents')}>Show threats</button><button onClick={()=>setQ('Top token cost agents')}>Top token cost agents</button></div></section> }

createRoot(document.getElementById('root')).render(<App/>);
