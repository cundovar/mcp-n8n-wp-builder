import mongoose from 'mongoose';

const ValidationDecisionSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    index: true,
  },

  artifact_type: {
    type: String,
    required: true,
  },

  artifact_version: {
    type: Number,
    required: true,
    min: 1,
  },

  decision: {
    type: String,
    required: true,
    enum: ['approved', 'changes_requested', 'rejected'],
  },

  comment: {
    type: String,
    default: '',
  },

  requested_changes: {
    type: [String],
    default: [],
  },

  created_by: {
    type: String,
    required: true,
    trim: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

ValidationDecisionSchema.index({
  requestId: 1,
  artifact_type: 1,
  artifact_version: 1,
  created_at: -1,
});

const ValidationDecision =
  mongoose.models.ValidationDecision ||
  mongoose.model('ValidationDecision', ValidationDecisionSchema);

export default ValidationDecision;
