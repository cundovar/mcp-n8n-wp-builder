export const STATUS_CONFIG = {
  received: { label: 'Demande reçue', tone: 'neutral', step: 1 },
  draft: { label: 'Brouillon', tone: 'neutral', step: 1 },
  pending: { label: 'En attente', tone: 'warning', step: 1 },
  queued: { label: 'En file', tone: 'neutral', step: 1 },
  needs_input: { label: 'Informations requises', tone: 'warning', step: 1 },
  processing: { label: 'Plans en préparation', tone: 'info', step: 2, active: true },
  running: { label: 'Plans en préparation', tone: 'info', step: 2, active: true },
  waiting_validation: { label: 'Validation du plan', tone: 'warning', step: 3, action: true },
  revising: { label: 'Révision en cours', tone: 'violet', step: 3, active: true },
  approved: { label: 'Plan approuvé', tone: 'success', step: 3 },
  awaiting_staging_approval: { label: 'Staging à approuver', tone: 'warning', step: 3, action: true },
  ready_for_staging: { label: 'Prêt pour le staging', tone: 'info', step: 4 },
  building: { label: 'Construction Elementor', tone: 'info', step: 5, active: true },
  executing: { label: 'Construction Elementor', tone: 'info', step: 5, active: true },
  reviewing: { label: 'Revue visuelle', tone: 'violet', step: 6, active: true },
  changes_requested: { label: 'Corrections demandées', tone: 'warning', step: 6, action: true },
  awaiting_publish_approval: { label: 'Publication à approuver', tone: 'warning', step: 7, action: true },
  publishing: { label: 'Publication en cours', tone: 'info', step: 7, active: true },
  completed: { label: 'Terminé', tone: 'success', step: 7 },
  published: { label: 'Publié', tone: 'success', step: 7 },
  failed: { label: 'Échec', tone: 'danger', step: null, action: true },
  cancelled: { label: 'Annulé', tone: 'neutral', step: null },
};

export const TONE_CLASSES = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  danger: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300',
  violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
};

export function getRequestStatus(request) {
  return request?.contract?.build_state || request?.status || 'pending';
}

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { label: status || 'Inconnu', tone: 'neutral', step: null };
}
