export function detectIntent(message = '') {
  const text = message.toLowerCase();
  if (text.includes('cost')) return 'cost';
  if (text.includes('anomal')) return 'anomalies';
  if (text.includes('resolve') || text.includes('what should') || text.includes('next') || text.includes('rca')) return 'resolve';
  if (text.includes('sla') || text.includes('eta') || text.includes('breach') || text.includes('predict')) return 'sla';
  if (text.includes('where') || text.includes('right now') || text.includes('status') || text.includes('helix') || text.includes('abc')) return 'investigate';
  return 'daily';
}
