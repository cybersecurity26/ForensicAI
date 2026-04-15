import express from 'express'
import Evidence from '../models/Evidence.js'
import { buildTimeline } from '../utils/parser.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/timeline/:caseId — Get reconstructed timeline for a case
router.get('/:caseId', optionalAuth, async (req, res, next) => {
  try {
    const { caseId } = req.params
    const { severity, source, limit: eventLimit } = req.query

    const evidenceList = await Evidence.find({
      caseId,
      status: { $in: ['parsed', 'verified'] },
    }).lean()

    if (evidenceList.length === 0) {
      return res.json({
        totalEvents: 0,
        dateGroups: [],
        events: [],
        message: 'No parsed evidence found for this case. Upload and parse evidence to build a timeline.',
      })
    }

    let timeline = buildTimeline(evidenceList)

    // Apply filters
    if (severity) {
      timeline.events = timeline.events.filter(e => e.severity === severity)
    }
    if (source) {
      timeline.events = timeline.events.filter(e =>
        e.source?.toLowerCase().includes(source.toLowerCase())
      )
    }
    if (eventLimit) {
      timeline.events = timeline.events.slice(0, parseInt(eventLimit))
    }

    // Recalculate groups after filtering
    const grouped = {}
    for (const event of timeline.events) {
      let dateKey = 'Unknown'
      if (event.timestamp) {
        const ts = String(event.timestamp).trim()
        // Handle ISO (T separator) and space-separated timestamps
        if (ts.includes('T')) {
          dateKey = ts.split('T')[0]
        } else if (ts.includes(' ')) {
          dateKey = ts.split(' ')[0]
        } else if (/^\d{4}-\d{2}-\d{2}/.test(ts)) {
          dateKey = ts.substring(0, 10)
        }
      }
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(event)
    }

    res.json({
      totalEvents: timeline.events.length,
      dateGroups: Object.entries(grouped).map(([date, events]) => ({
        date,
        eventCount: events.length,
        events,
      })),
      sources: [...new Set(timeline.events.map(e => e.source).filter(Boolean))],
      severityCounts: {
        critical: timeline.events.filter(e => e.severity === 'critical').length,
        danger: timeline.events.filter(e => e.severity === 'danger').length,
        warning: timeline.events.filter(e => e.severity === 'warning').length,
        info: timeline.events.filter(e => e.severity === 'info').length,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
