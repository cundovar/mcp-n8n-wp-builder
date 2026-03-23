import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema({
  // Identifiant unique pour le suivi
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Statut de la demande (V1 + V2)
  status: {
    type: String,
    enum: [
      // V1
      'pending',
      'processing',
      'waiting_validation',
      'completed',
      'failed',
      // V2
      'draft',
      'queued',
      'running',
      'approved',
      'executing',
      'cancelled',
    ],
    default: 'pending',
  },

  // V2: Phase courante du pipeline
  current_phase: {
    type: String,
    enum: [
      'normalized_brief',
      'discovery_brief',
      'site_architecture',
      'content_plan',
      'design_plan',
      'wordpress_plan',
      'execution_plan',
      'execution',
      'completed',
    ],
  },

  // V2: Pipeline et progression par phases
  pipeline: {
    phases: [
      {
        name: {
          type: String,
          enum: [
            'normalized_brief',
            'discovery_brief',
            'site_architecture',
            'content_plan',
            'design_plan',
            'wordpress_plan',
            'execution_plan',
            'execution',
          ],
        },
        status: {
          type: String,
          enum: [
            'pending',
            'running',
            'completed',
            'waiting_validation',
            'changes_requested',
            'revising',
            'approved',
            'failed',
            'skipped',
          ],
          default: 'pending',
        },
        started_at: { type: Date },
        completed_at: { type: Date },
        error: { type: String },
      },
    ],
  },

  // Donnees de la demande (formulaire)
  input: {
    site_name: { type: String, required: true },
    site_type: { type: String, default: 'site vitrine' },
    objective: { type: String },
    pages: [{ type: String }],
    features: [{ type: String }],
    design_preferences: { type: String },
    target_audience: { type: String },
    // Champs additionnels flexibles
    extra: { type: mongoose.Schema.Types.Mixed },
  },

  // Resultat du workflow n8n
  result: {
    success: { type: Boolean },
    bash_script: { type: String },
    summary: { type: mongoose.Schema.Types.Mixed },
    pages_created: [{ type: mongoose.Schema.Types.Mixed }],
    error: { type: String },
    raw_output: { type: mongoose.Schema.Types.Mixed },
  },

  // Donnees de validation intermediaire (V1 + V2)
  validation: {
    // V1
    requested_at: { type: Date },
    approved_at: { type: Date },
    resume_url: { type: String },
    brief_architecte: { type: mongoose.Schema.Types.Mixed },
    project_name: { type: String },
    project_description: { type: String },
    // V2
    status: {
      type: String,
      enum: ['draft', 'waiting_validation', 'changes_requested', 'revising', 'approved', 'rejected'],
    },
    target_artifact: { type: String },
    target_version: { type: Number },
    last_decision: {
      type: String,
      enum: ['approved', 'changes_requested', 'rejected'],
    },
    last_decision_at: { type: Date },
    last_decision_by: { type: String },
    revision_requested_at: { type: Date },
    revision_reason: { type: String },
    revision_requested_by: { type: String },
    workflow_decision_in_progress: { type: Boolean, default: false },
  },

  // Metadonnees
  n8n_execution_id: { type: String },
  duration_ms: { type: Number },

  // Timestamps
  created_at: { type: Date, default: Date.now },
  started_at: { type: Date },
  completed_at: { type: Date },
});

// Index pour recherche rapide
RequestSchema.index({ status: 1, created_at: -1 });
RequestSchema.index({ created_at: -1 });

// Methodes virtuelles
RequestSchema.virtual('duration').get(function() {
  if (this.started_at && this.completed_at) {
    return this.completed_at - this.started_at;
  }
  return null;
});

// Assurer que les virtuals sont inclus dans JSON
RequestSchema.set('toJSON', { virtuals: true });
RequestSchema.set('toObject', { virtuals: true });

export default mongoose.model('Request', RequestSchema);
