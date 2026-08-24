import { getStatusConfig, TONE_CLASSES } from '../../lib/status';

function StatusBadge({ status, pulse = true, className = '' }) {
  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[config.tone]} ${className}`}>
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full bg-current ${pulse && config.active ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}

export default StatusBadge;
