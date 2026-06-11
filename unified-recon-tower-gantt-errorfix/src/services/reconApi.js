import { detectIntent } from '../utils/intent';

const API_URL = process.env.REACT_APP_RECON_AGENT_URL || 'http://localhost:8080/api/agent/ask';
const USER_ID = process.env.REACT_APP_RECON_USER_ID || 'user001';
const SESSION_ID = process.env.REACT_APP_RECON_SESSION_ID || 'recon-demo-session';

const emptySummary = {
  answer: '', date: '', generatedAt: '', tableName: '', totalRecons: 0, completedCount: 0,
  inProgressCount: 0, failedCount: 0, otherCount: 0, overallProgress: 0, recons: [], charts: []
};

const emptyReconDetail = {
  answer: '', identifier: '-', executionId: '-', status: 'UNKNOWN', started: '-', duration: '-',
  stages: [], files: [], nodes: [], currentInsight: []
};

const emptySlaRisk = {
  answer: '', available: true, reasonIfUnavailable: '', risk: 'UNKNOWN', etaP50: '-', etaP90: '-',
  slaCutoff: '-', breachProbability: null, reasons: [], stageRemaining: [], charts: []
};

const emptyRecommendedAction = {
  answer: '', confidence: null, likelyCause: '-', why: '-', nextSteps: [], impact: '-', slaRisk: '-',
  etaIfUnresolved: '-', similarIncidents: [], evidence: [], owner: '', occurredOn: ''
};

const emptyCostData = {
  answer: '', available: true, reasonIfUnavailable: '', date: '', generatedAt: '', reconId: '', executionId: '',
  currency: 'USD', totalCostRaw: null, totalCost: '-', byStage: [], byRecon: [], costAnomalies: [], charts: []
};

const emptyAnswerOnly = { answer: '', question: '' };

export async function askReconAgent(message) {
  const intent = detectIntent(message);
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId: USER_ID, sessionId: SESSION_ID })
    });
  } catch (error) {
    throw new Error(`Unable to reach Recon API at ${API_URL}. ${error?.message || ''}`.trim());
  }
  if (!response.ok) {
    let bodyText = '';
    try { bodyText = await response.text(); } catch (_) {}
    throw new Error(`Recon API returned HTTP ${response.status}${bodyText ? `: ${bodyText.slice(0, 180)}` : ''}`);
  }
  let raw;
  try {
    raw = await response.json();
  } catch (error) {
    throw new Error('Recon API returned a non-JSON response.');
  }
  return normalizeAgentResponse(raw, intent, message);
}

function normalizeAgentResponse(rawInput, intent, question) {
  const raw = deepParseEscapedJson(rawInput);
  const toolCalls = normalizeToolCalls(raw?.toolCalls || raw?.tools || raw?.toolsCalled || raw?.toolscalled);
  const firstTool = toolCalls?.[0] || {};
  const toolResponse = deepParseEscapedJson(firstTool?.toolResponse || {});
  const result = deepParseEscapedJson(toolResponse?.result || raw?.result || {});
  const answer = normalizeAnswerText(raw?.answer || '');
  const toolName = firstTool?.toolName || '';
  const resolvedIntent = resolveIntentFromTool(toolName, intent, result, answer);

  return {
    intent: resolvedIntent, question, usedApi: true, answer, toolName: toolName || toolNameForIntent(resolvedIntent), raw, toolCalls,
    summary: resolvedIntent === 'daily' ? coerceSummary(result, answer) : emptySummary,
    reconDetail: resolvedIntent === 'investigate' ? coerceReconDetail(result, answer) : emptyReconDetail,
    slaRisk: resolvedIntent === 'sla' ? coerceSla(result, answer) : emptySlaRisk,
    anomalies: resolvedIntent === 'anomalies' ? coerceAnomalies(result, answer) : { answer, anomalies: [], charts: [] },
    recommendedAction: resolvedIntent === 'resolve' ? coerceResolve(result, answer) : emptyRecommendedAction,
    costData: resolvedIntent === 'cost' ? coerceCost(result, answer) : emptyCostData,
    answerOnly: resolvedIntent === 'answer' ? { ...emptyAnswerOnly, answer, question } : emptyAnswerOnly
  };
}


function resolveIntentFromTool(toolName = '', fallbackIntent, result, answer) {
  const name = String(toolName || '').toLowerCase();
  if (name.includes('dailysummary')) return 'daily';
  if (name.includes('pipelinestatus') || name.includes('detailsforrecon')) return 'investigate';
  if (name.includes('eta') || name.includes('risk') || name.includes('sla')) return 'sla';
  if (name.includes('anomal')) return 'anomalies';
  if (name.includes('resolve') || name.includes('incident')) return 'resolve';
  if (name.includes('cost')) return 'cost';
  const hasToolResult = result && typeof result === 'object' && Object.keys(result).length > 0;
  if (!name && answer && !hasToolResult) return 'answer';
  return fallbackIntent || 'answer';
}

function normalizeToolCalls(toolCalls) {
  const parsed = deepParseEscapedJson(toolCalls);
  if (Array.isArray(parsed)) return parsed.map(deepParseEscapedJson);
  return [];
}

function deepParseEscapedJson(value) {
  if (typeof value === 'string') {
    let text = value.trim();
    if (!text) return value;
    for (let i = 0; i < 4; i += 1) {
      const candidate = text.trim();
      if (!((candidate.startsWith('{') && candidate.endsWith('}')) || (candidate.startsWith('[') && candidate.endsWith(']')))) break;
      try { return deepParseEscapedJson(JSON.parse(candidate)); }
      catch (_) {
        try {
          text = candidate.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '  ');
          return deepParseEscapedJson(JSON.parse(text));
        } catch (__) { break; }
      }
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(deepParseEscapedJson);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepParseEscapedJson(v)]));
  return value;
}

function normalizeAnswerText(answer) {
  return String(answer || '').replace(/\\n/g, '\n').replace(/\\t/g, '  ').replace(/\r/g, '').trim();
}

function toolNameForIntent(intent) {
  return { daily: 'getDailySummary', investigate: 'getPipelineStatusByReconId', sla: 'predictEtaAndRiskByReconId', anomalies: 'detectAnomaliesByReconId', resolve: 'resolveIncidentByReconId', cost: 'getCostReport' }[intent] || 'getDailySummary';
}

function coerceSummary(result = {}, answer = '') {
  const recons = Array.isArray(result.recons) ? result.recons.map((r, i) => ({
    executionId: r.executionId || `exec-${i}`,
    identifier: r.identifier || r.reconId || r.name || `RECON_${i + 1}`,
    status: r.status || r.overallStatus || 'UNKNOWN',
    progress: Number(r.progress ?? 0),
    startTime: r.startTime || '-',
    endTime: r.endTime || null,
    duration: r.duration || '-',
    currentStage: r.currentStage || r.stage || r.currentStageType || '-',
    owner: r.owner || '-',
    blocker: r.blocker,
    fileName: r.fileName
  })) : [];

  return { ...emptySummary, answer, date: result.date || '', generatedAt: result.generatedAt || '', tableName: result.tableName || '',
    totalRecons: Number(result.totalRecons ?? recons.length ?? 0), completedCount: Number(result.completedCount ?? 0),
    inProgressCount: Number(result.inProgressCount ?? 0), failedCount: Number(result.failedCount ?? 0), otherCount: Number(result.otherCount ?? 0),
    overallProgress: Number(result.overallProgress ?? 0), recons, charts: Array.isArray(result.charts) ? result.charts : [] };
}

function coerceReconDetail(result = {}, answer = '') {
  const nodes = Array.isArray(result.nodes) ? result.nodes : [];
  const stagesFromNodes = nodes.filter((n) => n.nodeType === 'STAGE').map((n) => ({
    name: cleanStageName(n.name || n.type), type: n.type, status: n.status || 'NOT_STARTED', progress: statusToProgress(n.status),
    startTime: n.startTime, endTime: n.endTime, totalTasks: n.totalTasks, completedTasks: n.completedTasks,
    inProgressTasks: n.inProgressTasks, failedTasks: n.failedTasks
  }));
  const stages = Array.isArray(result.stages) && result.stages.length ? result.stages.map((s) => ({
    ...s, name: cleanStageName(s.name || s.stageType || s.type), status: s.status || 'NOT_STARTED',
    progress: typeof s.progress === 'number' ? s.progress : statusToProgress(s.status)
  })) : stagesFromNodes;
  const files = Array.isArray(result.filesReceived) ? result.filesReceived.map((f) => ({
    fileName: f.fileName || f.name || '-', received: f.receivedTime || f.received || f.createdAt || '-', pattern: f.patternMatch || (f.filePattern ? 'PASS' : undefined), filePattern: f.filePattern
  })) : [];
  const status = result.status || result.overallStatus || 'UNKNOWN';
  return { ...emptyReconDetail, ...result, answer, identifier: result.identifier || result.reconId || result.name || '-', executionId: result.executionId || '-',
    status, overallStatus: status, started: result.startTime || result.started || '-', duration: result.duration || '-', stages, files, nodes,
    currentInsight: Array.isArray(result.investigationSummary) ? result.investigationSummary : [] };
}

function coerceSla(result = {}, answer = '') {
  const charts = Array.isArray(result.charts) ? result.charts : [];
  const chart = charts[0] || null;
  const x = chart?.x || [];
  const p50 = chart?.series?.find((s) => String(s.name).toLowerCase().includes('p50'))?.data || [];
  const p90 = chart?.series?.find((s) => String(s.name).toLowerCase().includes('p90'))?.data || [];
  const stageRemaining = x.map((stage, i) => ({ stage, p50: toMinutes(p50[i]), p90: toMinutes(p90[i]) }));
  return { ...emptySlaRisk, answer, available: result.available !== false, reasonIfUnavailable: result.reasonIfUnavailable || '',
    risk: result.riskLevel || result.risk || 'UNKNOWN', etaP50: result.etaIsoP50 || result.etaP50 || '-', etaP90: result.etaIsoP90 || result.etaP90 || '-',
    slaCutoff: result.slaCutoff || result.slaIso || (result.slaSec ? `${Math.round(result.slaSec / 60)} min SLA` : '-'),
    breachProbability: isFiniteNumber(result.breachProbability) ? Number(result.breachProbability) : null,
    reasons: Array.isArray(result.reasons) ? result.reasons : [], stageRemaining, charts };
}

function coerceAnomalies(result = {}, answer = '') {
  const raw = Array.isArray(result.anomalies) ? result.anomalies : Array.isArray(result) ? result : [];
  return { answer, available: result.available !== false, reasonIfUnavailable: result.reasonIfUnavailable || '', reconId: result.reconId || '', executionId: result.executionId || '',
    overallStatus: result.overallStatus || '', charts: Array.isArray(result.charts) ? result.charts : [],
    anomalies: raw.map((a, i) => ({ severity: a.severity || 'MED', title: a.title || anomalyTitle(a), evidence: a.evidence || '',
      metric: a.stageType || a.type || a.metric || `Metric ${i + 1}`, actual: a.actual ?? '-', baseline: a.baseline ?? '-', type: a.type, stageType: a.stageType })) };
}

function coerceResolve(result = {}, answer = '') {
  const steps = Array.isArray(result.recommendedNextSteps) ? result.recommendedNextSteps : Array.isArray(result.nextSteps) ? result.nextSteps : [];
  const incidents = Array.isArray(result.similarIncidents) ? result.similarIncidents.map((i, idx) => ({
    id: i.id || i.incidentId || `INC-${idx + 1}`, summary: i.title || i.summary || '-', occurred: i.occurredOn || i.occurred || '', resolution: i.resolution || '-', outcome: i.outcome || ''
  })) : [];
  return { ...emptyRecommendedAction, answer, confidence: isFiniteNumber(result.confidence) ? Number(result.confidence) : null,
    likelyCause: result.likelyCauseCategory || result.likelyCause || '-', why: result.errorSignature || result.why || '-', nextSteps: steps,
    impact: result.rcaDraft?.impact || result.impact || '-', slaRisk: result.slaRisk || '-', etaIfUnresolved: result.etaIfUnresolved || '-',
    similarIncidents: incidents, evidence: Array.isArray(result.evidence) ? result.evidence : [], owner: normalizeOwner(result.owner), occurredOn: result.occurredOn || '' };
}

function coerceCost(result = {}, answer = '') {
  const currency = result.currency || 'USD';
  const byStage = Array.isArray(result.costByStage) ? result.costByStage.map((c) => ({ stage: c.stageType || c.stage || 'UNKNOWN', cost: Number(c.estimatedCost || c.cost || 0), runtimeSec: c.runtimeSec })) : [];
  const byRecon = Array.isArray(result.costByRecon) ? result.costByRecon.map((c) => ({ reconId: c.reconId || c.identifier || '-', executionId: c.executionId || '-', cost: Number(c.estimatedCost || c.cost || 0) })) : [];
  return { ...emptyCostData, answer, available: result.available !== false, reasonIfUnavailable: result.reasonIfUnavailable || '',
    date: result.date || '', generatedAt: result.generatedAt || '', reconId: result.reconId || '', executionId: result.executionId || '', currency,
    totalCostRaw: isFiniteNumber(result.totalCost) ? Number(result.totalCost) : null, totalCost: currencyText(result.totalCost, currency), byStage, byRecon,
    costAnomalies: Array.isArray(result.costAnomalies) ? result.costAnomalies : [], charts: Array.isArray(result.charts) ? result.charts : [] };
}

function normalizeOwner(owner) {
  if (!owner) return '';
  if (typeof owner === 'string') return owner;
  if (typeof owner === 'object') {
    const team = owner.team || owner.name || '';
    const contact = owner.contact || owner.email || '';
    return [team, contact].filter(Boolean).join(' · ');
  }
  return String(owner);
}

function toMinutes(value) { const n = Number(value || 0); return n > 100 ? Math.round(n / 60) : Math.round(n); }
function isFiniteNumber(value) { return Number.isFinite(Number(value)); }
function anomalyTitle(a) { const type = String(a.type || 'Anomaly').replaceAll('_', ' '); return a.stageType ? `${a.severity || 'MED'} ${type} in ${a.stageType}` : `${a.severity || 'MED'} ${type}`; }
function currencyText(value, currencyCode) { const n = Number(value); if (!Number.isFinite(n)) return '-'; return `${currencyCode === 'USD' ? '$' : currencyCode + ' '}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
function cleanStageName(name = '') { return String(name).replace(/^.*_REC_0756_/, '').replace(/^HELIX_CR_DR_REC_/, '').replace(/^MS_DTMSETT_REC_0756_/, ''); }
function statusToProgress(status) { if (status === 'COMPLETED') return 100; if (status === 'IN_PROGRESS') return 64; if (status === 'FAILED') return 86; return 0; }
