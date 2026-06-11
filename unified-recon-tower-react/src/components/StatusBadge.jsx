import { statusLabel } from '../utils/format';
export function StatusBadge({ status }) {
  return <span className={`statusBadge ${String(status).toLowerCase()}`}>{statusLabel(status)}</span>
}
