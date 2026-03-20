import mongoose from 'mongoose';

const RequestExecutionStepSchema = new mongoose.Schema(
  {
    step_key: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped', 'compensated'],
      default: 'pending',
    },
    label: {
      type: String,
      default: '',
    },
    started_at: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const RequestExecutionLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const RequestExecutionSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    index: true,
  },

  execution_id: {
    type: String,
    required: true,
    trim: true,
  },

  mode: {
    type: String,
    required: true,
    enum: ['dry_run', 'apply'],
  },

  status: {
    type: String,
    required: true,
    enum: [
      'pending',
      'running',
      'completed',
      'failed',
      'failed_partial',
      'compensating',
      'compensated',
      'cancelled',
      'manual_intervention_required',
    ],
    default: 'pending',
  },

  plan_version: {
    type: Number,
    min: 1,
  },

  steps: {
    type: [RequestExecutionStepSchema],
    default: [],
  },

  logs: {
    type: [RequestExecutionLogSchema],
    default: [],
  },

  result: {
    success: { type: Boolean },
    site_url: { type: String },
    pages_created: { type: Number },
    plugins_installed: { type: Number },
    summary: { type: String },
    error: { type: String },
    error_details: { type: mongoose.Schema.Types.Mixed },
    next_action: {
      type: String,
      enum: ['none', 'resume', 'compensate', 'manual_intervention_required'],
    },
  },

  // Progression
  progress: {
    total_steps: { type: Number, default: 0 },
    completed_steps: { type: Number, default: 0 },
    failed_steps: { type: Number, default: 0 },
    current_step: { type: String },
  },

  // Metadonnees
  n8n_execution_id: { type: String },
  triggered_by: { type: String },

  created_at: {
    type: Date,
    default: Date.now,
  },

  started_at: {
    type: Date,
  },

  completed_at: {
    type: Date,
  },
});

RequestExecutionSchema.index({ requestId: 1, execution_id: 1 }, { unique: true });
RequestExecutionSchema.index({ requestId: 1, status: 1, created_at: -1 });

const RequestExecution =
  mongoose.models.RequestExecution ||
  mongoose.model('RequestExecution', RequestExecutionSchema);

export default RequestExecution;
