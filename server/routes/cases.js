import express from 'express'
import { body, validationResult, param } from 'express-validator'
import Case from '../models/Case.js'
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

export default router
