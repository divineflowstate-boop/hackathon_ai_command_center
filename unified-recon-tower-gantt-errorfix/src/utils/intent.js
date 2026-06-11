export function detectIntent(message = '') {
  const text = message.toLowerCase();
  if (text.includes('cost') || text.includes('compute')) return 'cost';
  if (text.includes('anomal')) return 'anomalies';
  if (text.includes('resolve') || text.includes('what should') || text.includes('next') || text.includes('rca') || text.includes('root cause')) return 'resolve';
  if (text.includes('sla') || text.includes('eta') || text.includes('breach') || text.includes('risk') || text.includes('predict')) return 'sla';
  if (text.includes('where') || text.includes('right now') || text.includes('status') || text.includes('why did') || text.includes('fail') || text.includes('blocked') || text.includes('pelix') || text.includes('helix') || text.includes('abc') || text.includes('xyz') || text.includes('pqr') || text.includes('cash') || text.includes('client') || text.includes('ddip') || text.includes('dtmsett')) return 'investigate';
  return 'daily';
}
