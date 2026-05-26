import express from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import Evidence from '../models/Evidence.js'
import Case from '../models/Case.js'
import User from '../models/User.js'
import { computeFileHash } from '../utils/hash.js'
import { withPlaintextEvidence } from '../utils/fileSecurity.js'
import { enqueueEvidenceProcessing } from '../jobs/enqueue.js'
import { optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'

function toId(val) {
  if (!val) return null
  if (val._id) return val._id.toString()
  return val.toString()
}

async function getReqUser(req) {
  if (req.user && req.user.id) return req.user
  if (process.env.NODE_ENV !== 'production') {
    const dbUser = await User.findOne().lean()
    if (dbUser) return { id: dbUser._id.toString(), role: dbUser.role }
  }
  return null
}

function canAccessCase(caseDoc, userId, role) {
  if (role === 'admin') return true
  const creatorId = toId(caseDoc.createdBy)
  if (!creatorId) return false
  if (creatorId === userId.toString()) return true
  return (caseDoc.sharedWith || []).some(entry => toId(entry) === userId.toString())
}

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.log', '.txt', '.csv', '.json', '.xml', '.reg', '.pcap', '.evtx', '.img', '.dd', '.raw', '.zip', '.gz']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowedExts.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed: ${allowedExts.join(', ')}`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120', 10) },
})

router.post('/upload', optionalAuth, upload.array('files', 10), async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot upload evidence' })
    }

    const { caseId } = req.body
    if (!caseId) return res.status(400).json({ error: 'caseId is required' })

    const caseDoc = await Case.findById(caseId)
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' })

    if (reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    const results = []
    const jobs = []

    for (const file of req.files) {
      const evidence = await Evidence.create({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath: file.path,
        caseId,
        status: 'queued',
        uploadedBy: reqUser?.id,
        metadata: {
          fileType: path.extname(file.originalname).replace('.', ''),
        },
        processing: {
          progress: 0,
          message: 'Queued for hashing, encryption, parsing, and normalization',
        },
      })

      caseDoc.evidence.push(evidence._id)

      const job = await enqueueEvidenceProcessing({
        evidenceId: evidence._id,
        caseId: caseDoc._id,
        requestedBy: reqUser?.id,
        reason: 'upload',
      })

      evidence.processing.queueJobId = String(job.id)
      evidence.processing.message = 'Queued for background processing'
      await evidence.save()

      await logAudit('evidence_uploaded', 'evidence', evidence._id,
        `Evidence "${file.originalname}" uploaded and queued for secure processing`, req)
      await logAudit('evidence_processing_queued', 'evidence', evidence._id,
        `BullMQ job ${job.id} queued for "${file.originalname}"`, req)

      results.push(evidence)
      jobs.push({ evidenceId: evidence._id, jobId: String(job.id) })
    }

    await caseDoc.save()

    res.status(201).json({
      message: `${results.length} evidence file(s) uploaded and queued for processing`,
      evidence: results,
      jobs,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const evidence = await Evidence.findById(req.params.id)
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' })
    res.json(evidence)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/parse', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot parse evidence' })
    }

    const evidence = await Evidence.findById(req.params.id)
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' })

    const caseDoc = await Case.findById(evidence.caseId)
    if (caseDoc && reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    const job = await enqueueEvidenceProcessing({
      evidenceId: evidence._id,
      caseId: evidence.caseId,
      requestedBy: reqUser?.id,
      reason: 'manual_parse',
    })

    evidence.status = 'queued'
    evidence.processing.queueJobId = String(job.id)
    evidence.processing.progress = 0
    evidence.processing.message = 'Manual parse queued'
    evidence.processing.lastError = ''
    await evidence.save()

    await logAudit('evidence_processing_queued', 'evidence', evidence._id,
      `Manual parse queued as BullMQ job ${job.id}`, req)

    res.status(202).json({
      message: 'Evidence processing job queued',
      evidenceId: evidence._id,
      jobId: String(job.id),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/verify', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot verify evidence' })
    }

    const evidence = await Evidence.findById(req.params.id)
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' })

    const caseDoc = await Case.findById(evidence.caseId)
    if (caseDoc && reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    if (!evidence.sha256Hash) {
      return res.status(409).json({ error: 'Evidence hash is not available yet. Wait for the processing job to complete.' })
    }

    const computedHash = await withPlaintextEvidence(evidence, plainPath => computeFileHash(plainPath))
    const result = {
      match: computedHash === evidence.sha256Hash,
      computedHash,
      expectedHash: evidence.sha256Hash,
    }

    evidence.hashVerifications.push({
      verifiedAt: new Date(),
      verifiedBy: req.user?.name || 'System',
      result: result.match ? 'match' : 'mismatch',
    })

    await evidence.save()

    await logAudit('evidence_hash_check', 'evidence', evidence._id,
      `Hash verification: ${result.match ? 'MATCH' : 'MISMATCH'}`, req)

    res.json({
      match: result.match,
      computedHash: result.computedHash,
      storedHash: result.expectedHash,
      verifiedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/parse-all/:caseId', optionalAuth, async (req, res, next) => {
  try {
    const reqUser = await getReqUser(req)
    if (reqUser && reqUser.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot re-parse evidence' })
    }

    const caseDoc = await Case.findById(req.params.caseId)
    if (caseDoc && reqUser && !canAccessCase(caseDoc, reqUser.id, reqUser.role)) {
      return res.status(403).json({ error: 'Access denied to this case' })
    }

    const evidenceList = await Evidence.find({ caseId: req.params.caseId })
    if (evidenceList.length === 0) {
      return res.json({ message: 'No evidence found for this case', queued: 0 })
    }

    const results = []

    for (const evidence of evidenceList) {
      const job = await enqueueEvidenceProcessing({
        evidenceId: evidence._id,
        caseId: evidence.caseId,
        requestedBy: reqUser?.id,
        reason: 'parse_all',
      })

      evidence.status = 'queued'
      evidence.processing.queueJobId = String(job.id)
      evidence.processing.progress = 0
      evidence.processing.message = 'Bulk re-processing queued'
      evidence.processing.lastError = ''
      await evidence.save()

      results.push({ file: evidence.originalName, status: 'queued', jobId: String(job.id) })
    }

    res.status(202).json({
      message: `Queued ${results.length} evidence processing job(s)`,
      queued: results.length,
      results,
    })
  } catch (err) {
    next(err)
  }
})

export default router
