import mongoose from 'mongoose';

const RequestArtifactSchema = new mongoose.Schema({
  // Identifiant de la demande parente
  requestId: {
    type: String,
    required: true,
    index: true,
  },

  // Type d'artefact (normalized_brief, site_architecture, content_plan, etc.)
  artifact_type: {
    type: String,
    required: true,
    enum: [
      'normalized_brief',
      'discovery_brief',
      'site_architecture',
      'content_plan',
      'design_plan',
      'wordpress_plan',
      'execution_plan',
      'execution_report',
    ],
  },

  // Version de l'artefact (plusieurs versions peuvent coexister)
  version: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  // Statut de l'artefact
  status: {
    type: String,
    enum: ['pending', 'generating', 'generated', 'validated', 'stale', 'failed'],
    default: 'pending',
  },

  // Contenu de l'artefact
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  // Artefacts sources ayant servi a la generation
  source_artifacts: [
    {
      artifact_type: { type: String },
      version: { type: Number },
    },
  ],

  // Informations sur le generateur
  generator: {
    engine: { type: String },
    stage: { type: String },
    model: { type: String },
    prompt_version: { type: String },
  },

  // Timestamp de creation
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index composite unique pour (requestId, artifact_type, version)
RequestArtifactSchema.index(
  { requestId: 1, artifact_type: 1, version: 1 },
  { unique: true }
);

// Index pour recherche par statut
RequestArtifactSchema.index({ requestId: 1, artifact_type: 1, status: 1 });

// Index pour tri par date
RequestArtifactSchema.index({ requestId: 1, created_at: -1 });

// Assurer que les virtuals sont inclus dans JSON
RequestArtifactSchema.set('toJSON', { virtuals: true });
RequestArtifactSchema.set('toObject', { virtuals: true });

export default mongoose.model('RequestArtifact', RequestArtifactSchema);
