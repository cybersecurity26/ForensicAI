import express from 'express'
import Case from '../models/Case.js'
import Evidence from '../models/Evidence.js'
import Report from '../models/Report.js'
import AuditLog from '../models/AuditLog.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/dashboard/stats — aggregated dashboard statistics
router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const [totalCases, activeCases, reviewCases, closedCases, draftCases] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: 'active' }),
      Case.countDocuments({ status: 'review' }),
      Case.countDocuments({ status: 'closed' }),
      Case.countDocuments({ status: 'draft' }),
    ])

    const [totalEvidence, totalReports, draftReports, integrityAlerts] = await Promise.all([
      Evidence.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'draft' }),
      Evidence.countDocuments({ status: 'error' }),
    ])

    // Monthly case activity for chart (last 7 months)
    const now = new Date()
    const months = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const label = d.toLocaleString('default', { month: 'short' })
      const casesCount = await Case.countDocuments({ createdAt: { $gte: d, $lte: end } })
      const reportsCount = await Report.countDocuments({ createdAt: { $gte: d, $lte: end } })
      months.push({ month: label, cases: casesCount, reports: reportsCount })
    }

    // Evidence type distribution
    const evidenceAgg = await Evidence.aggregate([
      { $group: { _id: '$metadata.fileType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ])

    const typeColorMap = { log: '#00d4ff', json: '#7b61ff', csv: '#ff6b6b', txt: '#00e676', xml: '#ffab40', pcap: '#e040fb' }
    const evidenceTypes = evidenceAgg.map(e => ({
      name: (e._id || 'unknown').toUpperCase(),
      value: e.count,
      color: typeColorMap[e._id] || '#888',
    }))

    res.json({
      stats: {
        activeCases,
        totalEvidence,
        totalReports,
        integrityAlerts,
        totalCases,
        reviewCases,
        closedCases,
        draftCases,
        draftReports,
      },
      caseActivity: months,
      evidenceTypes: evidenceTypes.length > 0 ? evidenceTypes : [
        { name: 'No data', value: 1, color: '#555' },
      ],
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/dashboard/activity — recent activity feed from audit log
router.get('/activity', optionalAuth, async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort('-createdAt')
      .limit(10)
      .lean()

    const activities = logs.map(log => {
      // Extract initials from the actual userName stored in audit log
      const name = log.userName || 'System'
      const initials = name === 'System' ? 'SYS'
        : name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      return {
        user: log.userId ? initials : 'AI',
        text: log.action,
        time: timeAgo(log.createdAt),
      }
    })

    // Fallback if no audit logs
    if (activities.length === 0) {
      activities.push(
        { user: 'SYS', text: 'System initialized. Create your first case to get started.', time: 'just now' }
      )
    }

    res.json({ activities })
  } catch (err) {
    next(err)
  }
})

// GET /api/dashboard/notifications — notifications for bell icon
router.get('/notifications', optionalAuth, async (req, res, next) => {
  try {
    // Notification-worthy actions
    const notifActions = [
      'case_created', 'case_updated', 'case_closed',
      'evidence_uploaded', 'evidence_parsed', 'evidence_verified',
      'report_generated', 'report_edited', 'report_reviewed', 'report_approved',
      'ai_summary_generated', 'ai_findings_generated',
      'evidence_hash_check',
    ]

    const logs = await AuditLog.find({ action: { $in: notifActions } })
      .sort('-createdAt')
      .limit(15)
      .lean()

    const actionMessages = {
      case_created: 'New case was created',
      case_updated: 'Case was updated',
      case_closed: 'Case has been closed',
      evidence_uploaded: 'Evidence file was uploaded',
      evidence_parsed: 'Evidence parsing completed',
      evidence_verified: 'Evidence integrity verified',
      evidence_hash_check: 'Hash verification performed',
      report_generated: 'AI report was generated',
      report_edited: 'Report section was edited',
      report_reviewed: 'Report was marked as reviewed',
      report_approved: 'Report was approved',
      ai_summary_generated: 'AI generated executive summary',
      ai_findings_generated: 'AI generated key findings',
    }

    const notifications = logs.map((log, i) => ({
      id: log._id.toString(),
      text: `${actionMessages[log.action] || log.action}${log.details ? ' — ' + log.details.substring(0, 80) : ''}`,
      time: timeAgo(log.createdAt),
      unread: i < 5, // Latest 5 are unread
      action: log.action,
    }))

    res.json({ notifications })
  } catch (err) {
    next(err)
  }
})

// GET /api/dashboard/search?q=query — global search across cases, reports, evidence
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q || q.length < 2) return res.json({ results: [] })

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')

    const [cases, reports, evidence] = await Promise.all([
      Case.find({
        $or: [
          { title: regex },
          { caseNumber: regex },
          { description: regex },
        ],
      }).limit(5).lean(),
      Report.find({
        $or: [
          { title: regex },
          { reportNumber: regex },
        ],
      }).limit(5).lean(),
      Evidence.find({
        originalName: regex,
      }).limit(5).lean(),
    ])

    const results = [
      ...cases.map(c => ({
        label: `${c.caseNumber} — ${c.title}`,
        path: `/cases/${c._id}`,
        category: 'Case',
      })),
      ...reports.map(r => ({
        label: `${r.reportNumber} — ${r.title}`,
        path: `/reports/${r._id}`,
        category: 'Report',
      })),
      ...evidence.map(e => ({
        label: e.originalName,
        path: `/cases/${e.caseId}`,
        category: 'Evidence',
      })),
    ]

    res.json({ results })
  } catch (err) {
    next(err)
  }
})

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export default router
