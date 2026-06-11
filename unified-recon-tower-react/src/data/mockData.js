export const promptPresets = [
  { id: 'daily', label: 'Daily Summary', question: 'Show daily summary for today' },
  { id: 'investigate', label: 'Where is HELIX_CR_DR_REC?', question: 'Where is HELIX_CR_DR_REC right now?' },
  { id: 'sla', label: 'Predict SLA Risk', question: 'Will HELIX_CR_DR_REC breach SLA?' },
  { id: 'anomalies', label: 'Detect Anomalies', question: 'Detect anomalies for HELIX_CR_DR_REC' },
  { id: 'resolve', label: 'Resolve Failure', question: 'What should I do next for HELIX_CR_DR_REC?' },
  { id: 'cost', label: 'Cost Visibility', question: 'Cost by recon and stage for today' }
];

export const summary = {
  answer: 'On June 9, 2026: Total 8 recons (1 completed, 3 in progress, 4 failed). Overall progress 53.7%.',
  date: '2026-06-09',
  generatedAt: '2026-06-09T17:59:12Z',
  totalRecons: 8,
  completedCount: 1,
  inProgressCount: 3,
  failedCount: 4,
  otherCount: 0,
  overallProgress: 53.7,
  recons: [
    { executionId: 'db5c32e3-e8b9-41af-9baa-175d52980e5b', identifier: 'HELIX_CR_DR_REC', status: 'FAILED', progress: 0, startTime: '2026-06-09T14:10:00Z', endTime: null, duration: '-', currentStage: 'PRE_PROCESSING', owner: 'Recon Platform', blocker: 'PRE_MATCH_R', fileName: 'AU_SL_3586_AccountBalance_20260320_123888.csv' },
    { executionId: 'f8e7e64b-85d7-49fc-b79d-2a16808a4364', identifier: 'MS_DDIP_REC_0756', status: 'FAILED', progress: 42.9, startTime: '2026-06-09T12:24:56Z', endTime: '2026-06-09T12:28:48Z', duration: '3m 51s', currentStage: 'PRE_PROCESSING', owner: 'Recon Platform' },
    { executionId: 'abc-123', identifier: 'ABC_RECON_123', status: 'IN_PROGRESS', progress: 78.3, startTime: '2026-06-09T13:40:12Z', endTime: null, duration: '-', currentStage: 'MATCH', owner: 'Recon Ops' },
    { executionId: 'xyz-001', identifier: 'XYZ_RECON_001', status: 'IN_PROGRESS', progress: 61.2, startTime: '2026-06-09T13:15:20Z', endTime: null, duration: '-', currentStage: 'POST_MATCH', owner: 'Recon Ops' },
    { executionId: 'pqr-789', identifier: 'PQR_RECON_789', status: 'COMPLETED', progress: 100, startTime: '2026-06-09T09:10:05Z', endTime: '2026-06-09T09:45:22Z', duration: '35m 17s', currentStage: 'REPORT', owner: 'Recon Platform' },
    { executionId: 'cash-004', identifier: 'CASH_POSITION_RECON', status: 'FAILED', progress: 22, startTime: '2026-06-09T10:10:00Z', endTime: null, duration: '-', currentStage: 'MATCH', owner: 'Cash Team' },
    { executionId: 'card-005', identifier: 'CARD_SETTLEMENT_APAC', status: 'IN_PROGRESS', progress: 36.5, startTime: '2026-06-09T11:05:00Z', endTime: null, duration: '-', currentStage: 'PRE_PROCESSING', owner: 'Cards Team' },
    { executionId: 'client-006', identifier: 'CLIENT_BALANCE_RECON', status: 'FAILED', progress: 18, startTime: '2026-06-09T10:42:00Z', endTime: null, duration: '-', currentStage: 'PRE_PROCESSING', owner: 'Balances Team' }
  ],
  progressTrend: [
    { day: 'Jun 03', progress: 24 }, { day: 'Jun 04', progress: 30 }, { day: 'Jun 05', progress: 39 },
    { day: 'Jun 06', progress: 41 }, { day: 'Jun 07', progress: 48 }, { day: 'Jun 08', progress: 51 }, { day: 'Jun 09', progress: 53.7 }
  ]
};

export const reconDetail = {
  identifier: 'HELIX_CR_DR_REC',
  executionId: 'db5c32e3-e8b9-41af-9baa-175d52980e5b',
  status: 'FAILED',
  started: 'Jun 09, 2026 14:10:00 UTC',
  duration: '-',
  currentInsight: [
    'Recon failed during PRE_PROCESSING stage.',
    'MATCH stage has not started.',
    'Input file received successfully.',
    'Failure originated in PRE_MATCH_R task.'
  ],
  stages: [
    { name: 'PRE_PROCESSING', status: 'FAILED', progress: 88 },
    { name: 'MATCH', status: 'NOT_STARTED', progress: 0 },
    { name: 'POST_MATCH', status: 'NOT_STARTED', progress: 0 },
    { name: 'METRICS', status: 'NOT_STARTED', progress: 0 },
    { name: 'REPORT', status: 'NOT_STARTED', progress: 0 }
  ],
  files: [
    { fileName: 'AU_SL_3586_AccountBalance_20260320_123888.csv', received: 'Jun 09, 2026 14:09:18 UTC', pattern: 'PASS' }
  ]
};

export const slaRisk = {
  risk: 'HIGH',
  etaP50: '15:42 UTC',
  etaP90: '16:20 UTC',
  slaCutoff: '15:30 UTC',
  breachProbability: 76,
  reasons: [
    'PRE_PROCESSING failed and downstream stages have not started.',
    'Similar failures took 2h 10m p90 to recover.',
    'No owner action has been recorded yet.'
  ],
  stageRemaining: [
    { stage: 'PRE_PROCESSING', p50: 20, p90: 45 },
    { stage: 'MATCH', p50: 28, p90: 55 },
    { stage: 'POST_MATCH', p50: 12, p90: 25 },
    { stage: 'METRICS', p50: 8, p90: 18 },
    { stage: 'REPORT', p50: 5, p90: 12 }
  ]
};

export const anomalies = [
  { severity: 'HIGH', title: 'Match rate dropped 42%', evidence: 'PRE_MATCH_R vs 7-day baseline', metric: 'Match rate', actual: 58, baseline: 100 },
  { severity: 'MEDIUM', title: 'Runtime 2.3x baseline', evidence: 'PRE_PROCESSING is above p90 duration', metric: 'Runtime', actual: 138, baseline: 60 },
  { severity: 'LOW', title: 'Input file size 18% larger', evidence: 'AccountBalance file above normal band', metric: 'File size', actual: 118, baseline: 100 }
];

export const recommendedAction = {
  confidence: 87,
  likelyCause: 'Schema validation failure in PRE_MATCH_R task.',
  why: 'The input file schema does not match the expected schema for AccountBalance.',
  nextSteps: ['Validate AccountBalance file schema.', 'Fix schema issues if any.', 'Re-run PRE_PROCESSING stage.'],
  impact: 'MATCH stage is blocked. Downstream stages will be delayed.',
  slaRisk: 'High',
  etaIfUnresolved: '> 4 hrs',
  similarIncidents: [
    { id: 'INC-20260604-1523', summary: 'Schema mismatch in PRE_MATCH_R', occurred: 'Jun 04, 2026', resolution: 'Fixed schema & re-run', outcome: 'Resolved' },
    { id: 'INC-20260528-0911', summary: 'Missing column in AccountBalance', occurred: 'May 28, 2026', resolution: 'Added column mapping', outcome: 'Resolved' },
    { id: 'INC-20260515-1742', summary: 'Data type mismatch in PRE_MATCH_R', occurred: 'May 15, 2026', resolution: 'Corrected data type', outcome: 'Resolved' }
  ]
};

export const costData = {
  totalCost: '$1,248',
  costPerSuccessfulRecon: '$41.60',
  highestCostRecon: 'HELIX_CR_DR_REC',
  anomaly: '2.3x normal due to extended compute runtime',
  byStage: [
    { stage: 'PRE_PROCESSING', cost: 520 }, { stage: 'MATCH', cost: 310 }, { stage: 'POST_MATCH', cost: 180 }, { stage: 'METRICS', cost: 148 }, { stage: 'REPORT', cost: 90 }
  ]
};
