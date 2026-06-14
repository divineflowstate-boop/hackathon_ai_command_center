const STAGES = ['PRE_MATCH', 'MATCH', 'POST_MATCH', 'METRICS', 'REPORTS'];

const reconLanes = [
  {
    reconId: 'PELIX',
    name: 'PELIX',
    businessDate: '2026-06-14',
    owner: 'Global Recon Ops',
    status: 'FAILED',
    progress: 62,
    currentStage: 'POST_MATCH',
    sla: '11:00 IST',
    predictedCompletion: '11:42 IST',
    runtimeMinutes: 84,
    stages: [
      { name: 'PRE_MATCH', status: 'COMPLETED', start: '08:03', end: '08:14', duration: 11 },
      { name: 'MATCH', status: 'COMPLETED', start: '08:14', end: '08:39', duration: 25 },
      { name: 'POST_MATCH', status: 'FAILED', start: '08:39', end: '09:27', duration: 48, issue: 'Break file checksum mismatch' },
      { name: 'METRICS', status: 'PENDING' },
      { name: 'REPORTS', status: 'PENDING' }
    ],
    files: [
      { fileName: 'pelix_trade_input_20260614.csv', type: 'Input', records: 1240831, status: 'Loaded', receivedAt: '08:01 IST' },
      { fileName: 'pelix_breaks_20260614.csv', type: 'Output', records: 43892, status: 'Checksum failed', receivedAt: '09:22 IST' },
      { fileName: 'pelix_match_summary_20260614.json', type: 'Metrics', records: 1, status: 'Generated', receivedAt: '08:41 IST' }
    ]
  },
  {
    reconId: 'EQUITY_FOBO',
    name: 'Equity FOBO',
    businessDate: '2026-06-14',
    owner: 'Markets Recon',
    status: 'IN_PROGRESS',
    progress: 78,
    currentStage: 'METRICS',
    sla: '10:45 IST',
    predictedCompletion: '10:31 IST',
    runtimeMinutes: 64,
    stages: [
      { name: 'PRE_MATCH', status: 'COMPLETED', start: '08:05', end: '08:12', duration: 7 },
      { name: 'MATCH', status: 'COMPLETED', start: '08:12', end: '08:55', duration: 43 },
      { name: 'POST_MATCH', status: 'COMPLETED', start: '08:55', end: '09:03', duration: 8 },
      { name: 'METRICS', status: 'RUNNING', start: '09:03', duration: 6 },
      { name: 'REPORTS', status: 'PENDING' }
    ],
    files: []
  },
  {
    reconId: 'SWIFT_CASH',
    name: 'SWIFT Cash',
    businessDate: '2026-06-14',
    owner: 'Cash Ops',
    status: 'COMPLETED',
    progress: 100,
    currentStage: 'REPORTS',
    sla: '09:30 IST',
    predictedCompletion: '09:18 IST',
    runtimeMinutes: 43,
    stages: [
      { name: 'PRE_MATCH', status: 'COMPLETED', start: '08:00', end: '08:05', duration: 5 },
      { name: 'MATCH', status: 'COMPLETED', start: '08:05', end: '08:29', duration: 24 },
      { name: 'POST_MATCH', status: 'COMPLETED', start: '08:29', end: '08:38', duration: 9 },
      { name: 'METRICS', status: 'COMPLETED', start: '08:38', end: '08:43', duration: 5 },
      { name: 'REPORTS', status: 'COMPLETED', start: '08:43', end: '09:18', duration: 35 }
    ],
    files: []
  },
  {
    reconId: 'PB_MARGIN',
    name: 'PB Margin',
    businessDate: '2026-06-14',
    owner: 'Prime Ops',
    status: 'FAILED',
    progress: 42,
    currentStage: 'MATCH',
    sla: '10:15 IST',
    predictedCompletion: 'Missed',
    runtimeMinutes: 71,
    stages: [
      { name: 'PRE_MATCH', status: 'COMPLETED', start: '08:12', end: '08:19', duration: 7 },
      { name: 'MATCH', status: 'FAILED', start: '08:19', end: '09:23', duration: 64, issue: 'Reference data snapshot missing 2 counterparties' },
      { name: 'POST_MATCH', status: 'PENDING' },
      { name: 'METRICS', status: 'PENDING' },
      { name: 'REPORTS', status: 'PENDING' }
    ],
    files: []
  },
  {
    reconId: 'FX_OPTIONS',
    name: 'FX Options',
    businessDate: '2026-06-14',
    owner: 'FX Ops',
    status: 'IN_PROGRESS',
    progress: 54,
    currentStage: 'POST_MATCH',
    sla: '11:15 IST',
    predictedCompletion: '10:58 IST',
    runtimeMinutes: 51,
    stages: [
      { name: 'PRE_MATCH', status: 'COMPLETED', start: '08:27', end: '08:34', duration: 7 },
      { name: 'MATCH', status: 'COMPLETED', start: '08:34', end: '09:06', duration: 32 },
      { name: 'POST_MATCH', status: 'RUNNING', start: '09:06', duration: 12 },
      { name: 'METRICS', status: 'PENDING' },
      { name: 'REPORTS', status: 'PENDING' }
    ],
    files: []
  },
  {
    reconId: 'LOANS_EOD',
    name: 'Loans EOD',
    businessDate: '2026-06-14',
    owner: 'Loan Ops',
    status: 'FAILED',
    progress: 28,
    currentStage: 'PRE_MATCH',
    sla: '12:00 IST',
    predictedCompletion: 'At risk',
    runtimeMinutes: 38,
    stages: [
      { name: 'PRE_MATCH', status: 'FAILED', start: '08:41', end: '09:19', duration: 38, issue: 'Source feed arrived with 11% record drop' },
      { name: 'MATCH', status: 'PENDING' },
      { name: 'POST_MATCH', status: 'PENDING' },
      { name: 'METRICS', status: 'PENDING' },
      { name: 'REPORTS', status: 'PENDING' }
    ],
    files: []
  },
  {
    reconId: 'CUSTODY_POS',
    name: 'Custody Positions',
    businessDate: '2026-06-14',
    owner: 'Custody Ops',
    status: 'IN_PROGRESS',
    progress: 68,
    currentStage: 'METRICS',
    sla: '11:30 IST',
    predictedCompletion: '11:05 IST',
    runtimeMinutes: 57,
    stages: [
      { name: 'PRE_MATCH', status: 'COMPLETED', start: '08:20', end: '08:32', duration: 12 },
      { name: 'MATCH', status: 'COMPLETED', start: '08:32', end: '09:00', duration: 28 },
      { name: 'POST_MATCH', status: 'COMPLETED', start: '09:00', end: '09:09', duration: 9 },
      { name: 'METRICS', status: 'RUNNING', start: '09:09', duration: 8 },
      { name: 'REPORTS', status: 'PENDING' }
    ],
    files: []
  },
  {
    reconId: 'TAX_LOTS',
    name: 'Tax Lots',
    businessDate: '2026-06-14',
    owner: 'Asset Services',
    status: 'FAILED',
    progress: 35,
    currentStage: 'MATCH',
    sla: '10:20 IST',
    predictedCompletion: 'Missed',
    runtimeMinutes: 80,
    stages: [
      { name: 'PRE_MATCH', status: 'COMPLETED', start: '08:04', end: '08:15', duration: 11 },
      { name: 'MATCH', status: 'FAILED', start: '08:15', end: '09:24', duration: 69, issue: 'Match rule version mismatch' },
      { name: 'POST_MATCH', status: 'PENDING' },
      { name: 'METRICS', status: 'PENDING' },
      { name: 'REPORTS', status: 'PENDING' }
    ],
    files: []
  }
];

const findRecon = (question = '') => {
  const normalized = question.toUpperCase();
  return reconLanes.find((recon) => normalized.includes(recon.reconId)) || reconLanes[0];
};

const response = (toolName, answer, result) => ({
  answer,
  userId: 'user001',
  sessionId: 'recon-demo-session',
  toolCalls: [
    {
      toolName,
      toolResponse: {
        result
      }
    }
  ]
});

const dailySummary = () => response(
  'getDailySummary',
  'Operational brief for 14 Jun: 8 recons are in scope. 1 completed, 3 are running, and 4 require attention. PELIX, PB Margin, Loans EOD, and Tax Lots are the primary risk points. Start with PELIX because the failure is blocking post-match completion and has SLA impact.',
  {
    date: '2026-06-14',
    generatedAt: '2026-06-14T09:28:00+05:30',
    totalRecons: 8,
    completedCount: 1,
    inProgressCount: 3,
    failedCount: 4,
    overallProgress: 53.7,
    stages: STAGES,
    recons: reconLanes,
    charts: [
      { name: 'Completion', value: 53.7 },
      { name: 'Failed', value: 50 },
      { name: 'Running', value: 37.5 }
    ]
  }
);

const investigation = (question) => {
  const recon = findRecon(question);
  return response(
    'getDetailsForRecon',
    `${recon.name} is currently ${recon.status.toLowerCase().replace('_', ' ')} at ${recon.currentStage.replace('_', ' ')} with ${recon.progress}% progress. The most recent blocking signal is ${recon.stages.find((stage) => stage.status === 'FAILED')?.issue || 'no blocking failure detected'}.`,
    {
      ...recon,
      reconId: recon.reconId,
      status: recon.status,
      stage: recon.currentStage,
      executionTimeline: recon.stages,
      stageHistory: recon.stages,
      files: recon.files.length ? recon.files : [
        { fileName: `${recon.reconId.toLowerCase()}_input_20260614.csv`, type: 'Input', records: 840231, status: 'Loaded', receivedAt: '08:02 IST' },
        { fileName: `${recon.reconId.toLowerCase()}_exceptions_20260614.csv`, type: 'Exceptions', records: 11842, status: recon.status === 'FAILED' ? 'Blocked' : 'Generated', receivedAt: '09:18 IST' }
      ]
    }
  );
};

const sla = (question) => {
  const recon = findRecon(question);
  return response(
    'predictSlaRisk',
    `${recon.name} has a HIGH SLA risk. Predicted completion is 11:42 IST against an 11:00 IST SLA with 87% confidence. The main drivers are post-match runtime variance, elevated break count, and downstream report dependency delay.`,
    {
      reconId: recon.reconId,
      name: recon.name,
      riskLevel: 'HIGH',
      predictedCompletion: '11:42 IST',
      slaDeadline: '11:00 IST',
      confidence: 87,
      drivers: [
        { label: 'Post-match duration', impact: 'High', detail: '48 min actual vs 14 min baseline' },
        { label: 'Break count', impact: 'High', detail: '43,892 breaks vs 18,000 normal range' },
        { label: 'Report dependency', impact: 'Medium', detail: 'Reports cannot start until checksum issue is cleared' },
        { label: 'Historical pattern', impact: 'Medium', detail: '3 similar incidents missed SLA by 35-55 minutes' }
      ],
      evidence: [
        'Current stage has exceeded baseline by 242%.',
        'No successful report generation event has been emitted.',
        'The same failure signature appeared on 2026-05-27 and 2026-06-03.'
      ],
      charts: [
        { time: '09:15', probability: 42 },
        { time: '09:45', probability: 61 },
        { time: '10:15', probability: 78 },
        { time: '10:45', probability: 86 },
        { time: '11:15', probability: 92 }
      ]
    }
  );
};

const anomalies = (question) => {
  const recon = findRecon(question);
  return response(
    'detectAnomaliesByReconId',
    `Three anomalies were detected for ${recon.name}. The strongest evidence is a post-match duration spike: 48 minutes actual versus a 14 minute baseline. Record variance and match count movement are secondary but support the same failure path.`,
    {
      reconId: recon.reconId,
      name: recon.name,
      overallStatus: 'ANOMALIES_FOUND',
      anomalies: [
        {
          type: 'STAGE_DURATION',
          severity: 'HIGH',
          stageType: 'POST_MATCH',
          actual: '48 min',
          baseline: '14 min',
          delta: '+242%',
          evidence: 'Post-match has crossed the p95 runtime band and matches the previous checksum failure signature.'
        },
        {
          type: 'RECORD_COUNT_VARIANCE',
          severity: 'MEDIUM',
          stageType: 'PRE_MATCH',
          actual: '1,240,831 records',
          baseline: '1,105,000 ± 5%',
          delta: '+12.3%',
          evidence: 'Input volume is above the normal control band and created a larger break file than expected.'
        },
        {
          type: 'MATCH_COUNT_ANOMALY',
          severity: 'MEDIUM',
          stageType: 'MATCH',
          actual: '91.8% matched',
          baseline: '96.4% baseline',
          delta: '-4.6 pts',
          evidence: 'Match rate dropped below the 30-day lower bound after the latest rule version deployment.'
        }
      ],
      charts: [
        { label: 'Stage duration', actual: 48, baseline: 14 },
        { label: 'Record count', actual: 112, baseline: 100 },
        { label: 'Match count', actual: 92, baseline: 96 }
      ]
    }
  );
};

const resolution = (question) => {
  const recon = findRecon(question);
  return response(
    'resolveIncidentByReconId',
    `Recommended resolution for ${recon.name}: rerun post-match after regenerating the break file with the current schema version. Confidence is 87%. The likely cause is a checksum/schema mismatch between generated break output and the downstream report contract.`,
    {
      reconId: recon.reconId,
      name: recon.name,
      confidence: 87,
      likelyCauseCategory: 'BREAK_FILE_SCHEMA_CHECKSUM_MISMATCH',
      recommendedNextSteps: [
        { step: 'Validate break file schema version against report contract v14.2.', owner: 'Recon Support', priority: 'P0', eta: '5 min' },
        { step: 'Regenerate break output for business date 2026-06-14.', owner: 'Platform Support', priority: 'P0', eta: '12 min' },
        { step: 'Rerun POST_MATCH from checkpoint pelix-postmatch-0927.', owner: 'Recon Support', priority: 'P0', eta: '18 min' },
        { step: 'Notify operations manager if report is not generated by 10:35 IST.', owner: 'Ops Manager', priority: 'P1', eta: '1 min' }
      ],
      evidence: [
        'Checksum mismatch surfaced immediately after break file generation.',
        'No data loss signal was detected in input ingestion.',
        'Similar incidents were resolved by regenerating the break file and rerunning POST_MATCH.'
      ],
      owner: {
        team: 'Global Recon Support',
        primary: 'A. Sharma',
        escalation: 'Markets Recon L2',
        channel: '#recon-pelix-war-room'
      },
      similarIncidents: [
        { id: 'INC-48291', date: '2026-06-03', resolution: 'Regenerated break file after schema correction', duration: '31 min' },
        { id: 'INC-47712', date: '2026-05-27', resolution: 'Reran post-match from checkpoint', duration: '44 min' },
        { id: 'INC-46988', date: '2026-05-11', resolution: 'Updated report contract and replayed metrics', duration: '38 min' }
      ],
      rcaDraft: {
        title: `${recon.name} post-match failure on 2026-06-14`,
        summary: 'The recon failed during POST_MATCH due to a checksum mismatch on the generated break file. Input ingestion and match execution completed successfully. The break output did not satisfy the downstream report contract.',
        impact: 'Reports delayed and SLA at risk by approximately 42 minutes.',
        correctiveAction: 'Regenerate break file using the current schema version and rerun POST_MATCH from the last valid checkpoint.',
        prevention: 'Add schema-contract validation before report handoff and alert when break volume crosses p95 band.'
      }
    }
  );
};

const cost = () => response(
  'getCostReport',
  'Cost analysis shows ₹1,248.72 operational run cost today. PELIX and PB Margin are the largest cost drivers because failed stages triggered extended runtime and retry overhead. The immediate opportunity is to reduce failed post-match reruns.',
  {
    totalCost: 1248.72,
    currency: 'INR',
    costByStage: [
      { stage: 'PRE_MATCH', cost: 188.2, share: 15 },
      { stage: 'MATCH', cost: 421.6, share: 34 },
      { stage: 'POST_MATCH', cost: 392.9, share: 31 },
      { stage: 'METRICS', cost: 113.7, share: 9 },
      { stage: 'REPORTS', cost: 132.32, share: 11 }
    ],
    costByRecon: [
      { reconId: 'PELIX', cost: 308.1, reason: 'Post-match failure and checkpoint hold' },
      { reconId: 'PB_MARGIN', cost: 244.8, reason: 'Long match failure window' },
      { reconId: 'TAX_LOTS', cost: 198.4, reason: 'Rule version mismatch rerun' },
      { reconId: 'LOANS_EOD', cost: 151.6, reason: 'Prematch source-feed variance' },
      { reconId: 'EQUITY_FOBO', cost: 112.5, reason: 'High-volume match execution' },
      { reconId: 'CUSTODY_POS', cost: 93.4, reason: 'Metrics stage still running' },
      { reconId: 'FX_OPTIONS', cost: 52.92, reason: 'Normal post-match execution' },
      { reconId: 'SWIFT_CASH', cost: 86.9, reason: 'Normal completion' }
    ],
    costAnomalies: [
      { reconId: 'PELIX', severity: 'HIGH', evidence: 'Run cost is 2.4x its 30-day baseline.' },
      { reconId: 'PB_MARGIN', severity: 'MEDIUM', evidence: 'Match stage retry window increased compute usage by 41%.' }
    ],
    charts: []
  }
);

const generic = () => ({
  answer: 'I can route operational questions into visibility, investigation, SLA risk, anomaly detection, guided resolution, or cost intelligence. Ask where a recon is, whether it will meet SLA, why it failed, or what action should be taken next.',
  userId: 'user001',
  sessionId: 'recon-demo-session',
  toolCalls: []
});

export function getMockResponse(question = '') {
  const q = question.toLowerCase();

  if (!q.trim()) return generic();
  if (q.includes('cost')) return cost();
  if (q.includes('resolve') || q.includes('what should i do') || q.includes('next') || q.includes('rca')) return resolution(question);
  if (q.includes('anomal') || q.includes('abnormal') || q.includes('why did') || q.includes('fail')) return anomalies(question);
  if (q.includes('sla') || q.includes('risk') || q.includes('meet') || q.includes('finish') || q.includes('complete')) return sla(question);
  if (q.includes('where') || q.includes('detail') || q.includes('investigate') || q.includes('execution')) return investigation(question);
  if (q.includes('today') || q.includes('summary') || q.includes('status') || q.includes('performing') || q.includes('operational')) return dailySummary();

  return generic();
}

export { reconLanes, STAGES };
