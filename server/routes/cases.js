import express from 'express'
import { body, validationResult, param } from 'express-validator'
import Case from '../models/Case.js'
import Evidence from '../models/Evidence.js'
import User from '../models/User.js'
import { generateChatResponse } from '../services/aiService.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

const router = express.Router()

// GET /api/cases — List all cases
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 20, sort = '-createdAt' } = req.query

    const filter = {}
    if (status && status !== 'all') filter.status = status
    if (priority) filter.priority = priority
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { caseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Case.countDocuments(filter)
    const cases = await Case.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/cases/:id — Get single case
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('evidence')
      .populate('reports')

    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' })
    }

    res.json(caseDoc)
  } catch (err) {
    next(err)
  }
})

// POST /api/cases — Create new case
router.post('/', optionalAuth, [
  body('title').notEmpty().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { title, description, priority, assigneeName, tags } = req.body

    const newCase = await Case.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      assigneeName: assigneeName || '',
      assignee: req.user?.id,
      tags: tags || [],
      status: 'draft',
    })

    await logAudit('case_created', 'case', newCase._id, `Case ${newCase.caseNumber} created: ${title}`, req)

    res.status(201).json(newCase)
  } catch (err) {
    next(err)
  }
})

// PUT /api/cases/:id — Update case
router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { title, description, status, priority, assigneeName, tags, notes } = req.body

    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (assigneeName !== undefined) updates.assigneeName = assigneeName
    if (tags !== undefined) updates.tags = tags
    if (notes !== undefined) updates.notes = notes
    if (status === 'closed') updates.closedAt = new Date()

    const updated = await Case.findByIdAndUpdate(req.params.id, updates, { new: true })

    if (!updated) {
      return res.status(404).json({ error: 'Case not found' })
    }

    const action = status === 'closed' ? 'case_closed' : 'case_updated'
    await logAudit(action, 'case', updated._id, `Case ${updated.caseNumber} updated`, req)

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/cases/:id — Delete case (soft delete by archiving)
router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ error: 'Case not found' })
    }

    await logAudit('case_updated', 'case', updated._id, `Case ${updated.caseNumber} archived`, req)

    res.json({ message: 'Case archived', case: updated })
  } catch (err) {
    next(err)
  }
})

// POST /api/cases/:id/chat — Ask questions about case evidence (RAG Chat)
router.post('/:id/chat', optionalAuth, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const caseDoc = await Case.findById(req.params.id)
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' })
    }

    // 1. Gather all parsed events for this case
    const evidenceList = await Evidence.find({ caseId: caseDoc._id })
    const allEvents = []
    for (const ev of evidenceList) {
      if (ev.parsedData && ev.parsedData.events) {
        for (const event of ev.parsedData.events) {
          allEvents.push({
            ...event.toObject(),
            evidenceName: ev.originalName
          })
        }
      }
    }

    // 2. Perform a local search/keyword matching to rank events based on user prompt
    const keywords = message.toLowerCase()
      .replace(/[^a-z0-9\s.]/g, '') // Keep dots for IPs
      .split(/\s+/)
      .filter(word => word.length > 2)

    let matchedEvents = []

    // Get dynamic RAG context limit from user settings
    let ragContextLimit = 25
    try {
      const user = await User.findOne()
      if (user && user.settings.ragContextLimit) {
        ragContextLimit = user.settings.ragContextLimit
      }
    } catch (err) {
      console.error('Error loading RAG context limit:', err.message)
    }

    if (keywords.length === 0) {
      // Return top events chronologically or severity sorted events if no query keywords
      matchedEvents = allEvents
        .sort((a, b) => (b.severity === 'critical' || b.severity === 'danger' ? 1 : -1))
        .slice(0, ragContextLimit)
    } else {
      // Score each event based on keyword matches
      const scored = allEvents.map(event => {
        let score = 0
        const detailLower = (event.detail || '').toLowerCase()
        const rawLower = (event.raw || '').toLowerCase()
        const sourceLower = (event.source || '').toLowerCase()
        
        for (const kw of keywords) {
          if (detailLower.includes(kw)) score += 5
          if (rawLower.includes(kw)) score += 3
          if (sourceLower.includes(kw)) score += 2
          if (event.mitreAttack?.techniqueId?.toLowerCase().includes(kw)) score += 10
          if (event.mitreAttack?.techniqueName?.toLowerCase().includes(kw)) score += 8
          if (event.threatIntel?.details?.toLowerCase().includes(kw)) score += 8
        }
        
        // Boost matches based on severity
        if (score > 0) {
          if (event.severity === 'critical') score += 5
          if (event.severity === 'danger') score += 3
          if (event.severity === 'warning') score += 1
        }
        
        return { event, score }
      })

      matchedEvents = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.event)
        .slice(0, ragContextLimit)
    }

    // 3. Call AI Service to generate response
    const answer = await generateChatResponse(caseDoc.title, history, matchedEvents, message)

    await logAudit('case_chat_queried', 'case', caseDoc._id, `Query: "${message.substring(0, 40)}..."`, req)

    res.json({
      message: answer,
      sources: matchedEvents.map(e => ({
        timestamp: e.timestamp,
        source: e.source,
        detail: e.detail,
        severity: e.severity,
        mitreAttack: e.mitreAttack,
        threatIntel: e.threatIntel,
        evidenceName: e.evidenceName
      }))
    })
  } catch (err) {
    next(err)
  }
})

export default router
