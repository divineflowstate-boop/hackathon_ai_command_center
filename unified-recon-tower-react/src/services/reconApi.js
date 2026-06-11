import { summary, reconDetail, slaRisk, anomalies, recommendedAction, costData } from '../data/mockData';
import { detectIntent } from '../utils/intent';

const API_URL = process.env.REACT_APP_RECON_AGENT_URL || 'http://localhost:8080/api/agent/ask';
const USER_ID = process.env.REACT_APP_RECON_USER_ID || 'user001';
const SESSION_ID = process.env.REACT_APP_RECON_SESSION_ID || 'recon-demo-session';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function askReconAgent(message, useApi) {
  const intent = detectIntent(message);

  if (!useApi) {
    await delay(650);
    return normalizeAgentResponse(mockResponseFor(intent, message), intent, message, false);
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId: USER_ID, sessionId: SESSION_ID })
    });

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const raw = await response.json();
    return normalizeAgentResponse(raw, intent, message, true);
  } catch (error) {
    console.warn('API failed. Falling back to mock data.', error);
    await delay(350);
    return { ...normalizeAgentResponse(mockResponseFor(intent, message), intent, message, false), apiError: error.message };
  }
}

function mockResponseFor(intent, message) {
  return {
    answer: mockAnswer(intent, message),
    toolCalls: [{ toolName: mockToolName(intent), toolResponse: { result: mockResult(intent) } }]
  };
}

function mockToolName(intent) {
  return {
    daily: 'getDailySummary',
    investigate: 'getPipelineStatusByReconId',
    sla: 'predictSlaRisk',
    anomalies: 'detectAnomalies',
    resolve: 'resolveIncident',
    cost: 'getCostVisibility'
  }[intent] || 'getDailySummary';
}

function mockResult(intent) {
  if (intent === 'investigate') return reconDetail;
  if (intent === 'sla') return slaRisk;
  if (intent === 'anomalies') return { anomalies };
  if (intent === 'resolve') return recommendedAction;
  if (intent === 'cost') return costData;
  return summary;
}

function mockAnswer(intent, message) {
  if (intent === 'investigate') return 'HELIX_CR_DR_REC failed during PRE_PROCESSING. MATCH has not started. The failure originated in PRE_MATCH_R.';
  if (intent === 'sla') return 'HELIX_CR_DR_REC has HIGH SLA risk. P90 ETA is 16:20 UTC against a 15:30 UTC cutoff.';
  if (intent === 'anomalies') return 'Three anomalies found: match rate drop, runtime above p90, and input file size above normal band.';
  if (intent === 'resolve') return 'Likely cause is schema validation failure in PRE_MATCH_R. Validate AccountBalance schema and rerun PRE_PROCESSING.';
  if (intent === 'cost') return 'HELIX_CR_DR_REC cost is 2.3x normal due to extended compute runtime and retry behavior.';
  return summary.answer;
}

function normalizeAgentResponse(raw, intent, question, usedApi) {
  const result = raw?.toolCalls?.[0]?.toolResponse?.result || raw?.result || raw;

  return {
    intent,
    question,
    usedApi,
    answer: raw?.answer || mockAnswer(intent, question),
    toolName: raw?.toolCalls?.[0]?.toolName || mockToolName(intent),
    raw,
    summary: intent === 'daily' ? coerceSummary(result) : summary,
    reconDetail: intent === 'investigate' ? coerceReconDetail(result) : reconDetail,
    slaRisk: intent === 'sla' ? { ...slaRisk, ...(result || {}) } : slaRisk,
    anomalies: intent === 'anomalies' ? (result?.anomalies || result || anomalies) : anomalies,
    recommendedAction: intent === 'resolve' ? { ...recommendedAction, ...(result || {}) } : recommendedAction,
    costData: intent === 'cost' ? { ...costData, ...(result || {}) } : costData
  };
}

function coerceSummary(result) {
  return {
    ...summary,
    ...(result || {}),
    recons: Array.isArray(result?.recons) && result.recons.length ? result.recons.map((r, i) => ({
      executionId: r.executionId || `exec-${i}`,
      identifier: r.identifier || r.reconId || r.name || `RECON_${i + 1}`,
      status: r.status || 'UNKNOWN',
      progress: Number(r.progress ?? 0),
      startTime: r.startTime || '-',
      endTime: r.endTime || null,
      duration: r.duration || '-',
      currentStage: r.currentStage || r.stage || '-',
      owner: r.owner || 'Recon Platform',
      blocker: r.blocker,
      fileName: r.fileName
    })) : summary.recons
  };
}

function coerceReconDetail(result) {
  if (!result) return reconDetail;
  const nodes = Array.isArray(result.nodes) ? result.nodes : [];
  const stagesFromNodes = nodes.filter((n) => n.nodeType === 'STAGE').map((n) => ({ name: n.name, status: n.status, progress: n.status === 'FAILED' ? 88 : n.status === 'COMPLETED' ? 100 : 0 }));
  return {
    ...reconDetail,
    ...result,
    stages: Array.isArray(result.stages) && result.stages.length ? result.stages : (stagesFromNodes.length ? stagesFromNodes : reconDetail.stages),
    files: Array.isArray(result.filesReceived) ? result.filesReceived.map((f) => ({ fileName: f.fileName, received: f.receivedTime, pattern: 'PASS' })) : (result.files || reconDetail.files)
  };
}
