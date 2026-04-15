import express from 'express'
import PDFDocument from 'pdfkit'
import Report from '../models/Report.js'
import Case from '../models/Case.js'
import Evidence from '../models/Evidence.js'
import { generateSummary, generateFindings, generateReportSection } from '../services/aiService.js'
import { buildTimeline } from '../utils/parser.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

const router = express.Router()

// GET /api/reports — List all reports
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { status, caseId, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status && status !== 'all') filter.status = status
    if (caseId) filter.caseId = caseId

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Report.countDocuments(filter)
    const reports = await Report.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    res.json({ reports, pagination: { page: parseInt(page), limit: parseInt(limit), total } })
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/:id — Get report detail
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('caseId')
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json(report)
  } catch (err) {
    next(err)
  }
})

// POST /api/reports/generate — Generate report with AI assistance
router.post('/generate', optionalAuth, async (req, res, next) => {
  try {
    const { caseId } = req.body
    if (!caseId) return res.status(400).json({ error: 'caseId is required' })

    const caseDoc = await Case.findById(caseId)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    // Gather evidence — use .lean() to get plain JS objects (avoids Mongoose subdoc spread issues)
    const evidenceList = await Evidence.find({ caseId, status: { $in: ['verified', 'parsed'] } }).lean()
    const timeline = buildTimeline(evidenceList)

    // Generate AI sections
    const [summaryResult, findingsResult, recommendationsResult] = await Promise.all([
      generateSummary({ case: caseDoc.toObject(), evidenceCount: evidenceList.length, timeline: timeline.events.slice(0, 20) }),
      generateFindings(
        evidenceList.map(e => ({ name: e.originalName, type: e.metadata?.fileType, parsedEvents: e.parsedData?.events?.length || 0, anomalies: e.parsedData?.anomalies || [] })),
        timeline
      ),
      generateReportSection('recommendations', { case: caseDoc.toObject(), evidenceCount: evidenceList.length }),
    ])

    // Build evidence inventory section
    const evidenceInventory = evidenceList.map((e, i) =>
      `${i + 1}. ${e.originalName} (${(e.size / 1024).toFixed(1)} KB)\n   SHA-256: ${e.sha256Hash}\n   Status: ${e.status}`
    ).join('\n\n')

    // Build timeline section — formatted markdown table
    let timelineSection = ''
    if (timeline.events.length === 0) {
      timelineSection = 'No timeline events found. Upload and parse evidence files to generate a timeline.'
    } else {
      const timelineRows = timeline.events.slice(0, 30).map(e => {
        const ts = e.timestamp ? String(e.timestamp).trim() : 'Unknown'
        const evType = e.eventType || 'system'
        const src = (e.source || '—').replace(/\|/g, ',')
        // Escape pipes in detail so they don't create extra table columns
        const detail = (e.detail || e.raw || 'Event').replace(/\|/g, ',').replace(/\n/g, ' ')
        return `| ${ts} | ${evType.charAt(0).toUpperCase() + evType.slice(1).replace('_', ' ')} | ${src} | ${detail} |`
      }).join('\n')
      timelineSection = `The timeline of key events spans from **${timeline.events[0]?.timestamp || '?'}** to **${timeline.events[timeline.events.length - 1]?.timestamp || '?'}**. A total of **${timeline.events.length}** events were reconstructed from ${evidenceList.length} evidence file(s).

| Timestamp | Event Type | Source / Module | Observation |
|-----------|------------|-----------------|-------------|
${timelineRows}`
    }

    // Create report number
    const reportCount = await Report.countDocuments({ caseId })
    const reportNumber = `${caseDoc.caseNumber}-R${reportCount + 1}`

    const report = await Report.create({
      reportNumber,
      caseId,
      title: `${caseDoc.title} — Investigation Report`,
      status: 'draft',
      generatedBy: 'AI + Human',
      sections: [
        { title: 'Executive Summary', content: summaryResult.content, order: 1, aiGenerated: true, confidence: summaryResult.confidence, status: 'draft' },
        { title: 'Evidence Inventory', content: evidenceInventory, order: 2, aiGenerated: false, confidence: 100, status: 'draft' },
        { title: 'Timeline of Events', content: timelineSection || 'No events found. Upload and parse evidence to generate timeline.', order: 3, aiGenerated: true, confidence: 85, status: 'draft' },
        { title: 'Key Findings', content: findingsResult.content, order: 4, aiGenerated: true, confidence: findingsResult.confidence, status: 'needs-review' },
        { title: 'Recommendations', content: recommendationsResult.content, order: 5, aiGenerated: true, confidence: recommendationsResult.confidence, status: 'draft' },
      ],
    })

    // Link to case
    caseDoc.reports.push(report._id)
    await caseDoc.save()

    await logAudit('report_generated', 'report', report._id, `Report ${reportNumber} generated with AI assistance`, req)

    res.status(201).json(report)
  } catch (err) {
    next(err)
  }
})

// PUT /api/reports/:id — Edit report (human review)
router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { sections, status, title } = req.body
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ error: 'Report not found' })

    if (title) report.title = title
    if (status) report.status = status

    if (sections) {
      for (const update of sections) {
        const section = report.sections.id(update._id) || report.sections.find(s => s.order === update.order)
        if (section) {
          if (update.content !== undefined) {
            section.editHistory.push({
              editedBy: req.user?.name || 'Unknown',
              editedAt: new Date(),
              previousContent: section.content,
            })
            section.content = update.content
          }
          if (update.status) section.status = update.status
        }
      }
    }

    if (status === 'final') {
      report.approvedAt = new Date()
      report.reviewedByName = req.user?.name || 'Unknown'
    }

    await report.save()

    const action = status === 'final' ? 'report_approved' : 'report_edited'
    await logAudit(action, 'report', report._id, `Report ${report.reportNumber} ${action.split('_')[1]}`, req)

    res.json(report)
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/:id/export — Export report as PDF
router.get('/:id/export', optionalAuth, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('caseId')
    if (!report) return res.status(404).json({ error: 'Report not found' })

    const doc = new PDFDocument({ size: 'A4', margin: 60 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportNumber}.pdf"`)

    doc.pipe(res)

    // Header
    doc.fontSize(10).fillColor('#666')
      .text('CONFIDENTIAL — FOR AUTHORIZED PERSONNEL ONLY', { align: 'center' })
      .moveDown(0.5)

    doc.fontSize(22).fillColor('#000')
      .text('Digital Forensics Investigation Report', { align: 'center' })
      .moveDown(0.3)

    doc.fontSize(14).fillColor('#333')
      .text(report.title, { align: 'center' })
      .moveDown(1)

    // Report Metadata
    doc.fontSize(10).fillColor('#666')
    doc.text(`Report #: ${report.reportNumber}`)
    doc.text(`Case #: ${report.caseId?.caseNumber || 'N/A'}`)
    doc.text(`Status: ${report.status.toUpperCase()}`)
    doc.text(`Generated: ${report.createdAt?.toISOString().split('T')[0]}`)
    doc.text(`Generated By: ${report.generatedBy}`)
    if (report.reviewedByName) doc.text(`Reviewed By: ${report.reviewedByName}`)
    doc.moveDown(1)

    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#ccc')
    doc.moveDown(1)

    // Sections
    for (const section of report.sections.sort((a, b) => a.order - b.order)) {
      doc.fontSize(14).fillColor('#000')
        .text(`${section.order}. ${section.title}`)
      doc.moveDown(0.3)

      if (section.aiGenerated) {
        doc.fontSize(8).fillColor('#888')
          .text(`[AI-Generated — Confidence: ${section.confidence || 'N/A'}% — Requires Human Verification]`)
        doc.moveDown(0.3)
      }

      doc.fontSize(10).fillColor('#333')
        .text(section.content || '[No content]', { lineGap: 3 })
      doc.moveDown(1)
    }

    // Footer disclaimer
    doc.moveDown(2)
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#ccc')
    doc.moveDown(0.5)
    doc.fontSize(8).fillColor('#888')
      .text('DISCLAIMER: AI-generated sections are provided as drafts to assist the investigation. All findings and conclusions must be independently verified by a qualified investigator. This report does not constitute legal advice.', { align: 'center' })

    doc.end()

    await logAudit('report_exported', 'report', report._id, `Report ${report.reportNumber} exported as PDF`, req)

  } catch (err) {
    next(err)
  }
})

export default router
