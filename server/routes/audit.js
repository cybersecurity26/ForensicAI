import express from 'express'
import AuditLog from '../models/AuditLog.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/audit — List audit logs
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { entityType, entityId, action, userId, page = 1, limit = 50 } = req.query

    const filter = {}
    if (entityType) filter.entityType = entityType
    if (entityId) filter.entityId = entityId
    if (action) filter.action = action
    if (userId) filter.userId = userId

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await AuditLog.countDocuments(filter)
    const logs = await AuditLog.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/audit/entity/:type/:id — Get audit trail for a specific entity
router.get('/entity/:type/:id', optionalAuth, async (req, res, next) => {
  try {
    const logs = await AuditLog.find({
      entityType: req.params.type,
      entityId: req.params.id,
    }).sort('-createdAt').lean()

    res.json(logs)
  } catch (err) {
    next(err)
  }
})

export default router
