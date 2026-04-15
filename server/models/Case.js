import mongoose from 'mongoose'

const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'active', 'review', 'closed', 'archived'],
    default: 'draft',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigneeName: { type: String, default: '' },
  evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
  tags: [{ type: String }],
  notes: { type: String, default: '' },
  closedAt: { type: Date },
}, { timestamps: true })

caseSchema.index({ caseNumber: 1 })
caseSchema.index({ status: 1 })
caseSchema.index({ createdAt: -1 })

// Auto-generate case number before saving
caseSchema.pre('save', async function (next) {
  if (this.isNew && !this.caseNumber) {
    const year = new Date().getFullYear()
    const count = await mongoose.model('Case').countDocuments()
    this.caseNumber = `FR-${year}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

export default mongoose.model('Case', caseSchema)
