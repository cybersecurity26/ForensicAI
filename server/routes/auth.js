import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import User from '../models/User.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'
import { logAudit } from '../middleware/audit.js'
import { sendOtpMail } from '../services/mailService.js'

const router = express.Router()

const RP_NAME = 'ForensicAI Platform'
const RP_ID = process.env.RP_ID || 'localhost'
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173'

// In-memory challenge store (per-user, short-lived)
const challengeStore = new Map()
// In-memory OTP store for signups (email -> { otp, expires })
const signupOtpStore = new Map()

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('otp').notEmpty().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, role, organization, otp } = req.body

    if (role === 'admin') {
      return res.status(400).json({ error: 'Cannot sign up as Administrator role' })
    }

    // Verify OTP code
    const storedRecord = signupOtpStore.get(email.toLowerCase())
    if (!storedRecord || storedRecord.otp !== otp || storedRecord.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    // Delete used OTP
    signupOtpStore.delete(email.toLowerCase())

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      name, email, passwordHash,
      role: role || 'investigator',
      organization: organization || '',
      isEmailVerified: true,
    })

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    await logAudit('user_created', 'user', user._id, `User ${name} registered`, req)

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if 2FA is enabled and user has passkeys
    if (user.settings.twoFactorEnabled && user.passkeys && user.passkeys.length > 0) {
      // Issue a short-lived login token for the 2FA step
      const loginToken = jwt.sign(
        { id: user._id, purpose: '2fa-pending' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      )
      return res.json({
        requires2FA: true,
        loginToken,
        userId: user._id,
      })
    }

    // No 2FA — issue full token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isEmailVerified },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    await logAudit('user_login', 'user', user._id, `User ${user.name} logged in`, req)

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isEmailVerified },
      sessionTimeout: user.settings.sessionTimeout,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/passkey/auth-options — Generate authentication challenge for 2FA
router.post('/passkey/auth-options', async (req, res, next) => {
  try {
    const { loginToken } = req.body
    if (!loginToken) return res.status(400).json({ error: 'Login token required' })

    let decoded
    try {
      decoded = jwt.verify(loginToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Login token expired. Please sign in again.' })
    }

    if (decoded.purpose !== '2fa-pending') {
      return res.status(400).json({ error: 'Invalid token' })
    }

    const user = await User.findById(decoded.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const allowCredentials = user.passkeys.map(pk => ({
      id: pk.credentialId,
      type: 'public-key',
      transports: pk.transports || [],
    }))

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: 'preferred',
    })

    challengeStore.set(`auth-${decoded.id}`, options.challenge)
    setTimeout(() => challengeStore.delete(`auth-${decoded.id}`), 120000)

    res.json(options)
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/passkey/authenticate — Verify passkey and complete login
router.post('/passkey/authenticate', async (req, res, next) => {
  try {
    const { loginToken, credential } = req.body
    if (!loginToken || !credential) return res.status(400).json({ error: 'Missing data' })

    let decoded
    try {
      decoded = jwt.verify(loginToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Login token expired. Please sign in again.' })
    }

    if (decoded.purpose !== '2fa-pending') {
      return res.status(400).json({ error: 'Invalid token' })
    }

    const user = await User.findById(decoded.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const expectedChallenge = challengeStore.get(`auth-${decoded.id}`)
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge expired. Please try again.' })
    }

    // Find the matching passkey
    const matchingPk = user.passkeys.find(pk => pk.credentialId === credential.id)
    if (!matchingPk) {
      return res.status(400).json({ error: 'Passkey not recognized' })
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: matchingPk.credentialId,
        publicKey: new Uint8Array(Buffer.from(matchingPk.publicKey, 'base64url')),
        counter: matchingPk.counter,
        transports: matchingPk.transports || [],
      },
    })

    if (!verification.verified) {
      return res.status(401).json({ error: 'Passkey verification failed' })
    }

    // Update counter
    matchingPk.counter = verification.authenticationInfo.newCounter
    await user.save()
    challengeStore.delete(`auth-${decoded.id}`)

    // Issue full JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isEmailVerified },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    await logAudit('user_login_2fa', 'user', user._id, `User ${user.name} logged in with 2FA`, req)

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isEmailVerified },
      sessionTimeout: user.settings.sessionTimeout,
    })
  } catch (err) {
    next(err)
  }
})

// ─── WebAuthn Passkey Routes ───

// POST /api/auth/passkey/register-options — Generate registration challenge
router.post('/passkey/register-options', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const existingPasskeys = (user.passkeys || []).map(pk => ({
      id: Buffer.from(pk.credentialId, 'base64url'),
      type: 'public-key',
      transports: pk.transports || [],
    }))

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(user._id.toString()),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: existingPasskeys,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    // Store challenge for verification
    challengeStore.set(user._id.toString(), options.challenge)
    setTimeout(() => challengeStore.delete(user._id.toString()), 120000)

    res.json(options)
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/passkey/register — Verify and store passkey
router.post('/passkey/register', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const expectedChallenge = challengeStore.get(user._id.toString())
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge expired. Please try again.' })
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Passkey verification failed' })
    }

    const { credential } = verification.registrationInfo

    user.passkeys.push({
      credentialId: Buffer.from(credential.id).toString('base64url'),
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: req.body.response?.transports || [],
    })

    user.settings.twoFactorEnabled = true
    await user.save()
    challengeStore.delete(user._id.toString())

    await logAudit('passkey_registered', 'user', user._id, `Passkey registered for ${user.name}`, req)

    res.json({
      message: 'Passkey registered successfully',
      passkeys: user.passkeys.map(pk => ({
        credentialId: pk.credentialId,
        createdAt: pk.createdAt,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/passkeys — List user's passkeys
router.get('/passkeys', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json({
      passkeys: (user.passkeys || []).map(pk => ({
        credentialId: pk.credentialId,
        createdAt: pk.createdAt,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/auth/passkey/:credentialId — Remove a passkey
router.delete('/passkey/:credentialId', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.passkeys = user.passkeys.filter(pk => pk.credentialId !== req.params.credentialId)

    if (user.passkeys.length === 0) {
      user.settings.twoFactorEnabled = false
    }

    await user.save()

    await logAudit('passkey_removed', 'user', user._id, `Passkey removed for ${user.name}`, req)

    res.json({
      message: 'Passkey removed',
      passkeys: user.passkeys.map(pk => ({
        credentialId: pk.credentialId,
        createdAt: pk.createdAt,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/signup/send-otp
router.post('/signup/send-otp', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const emailLower = email.toLowerCase().trim()
    const existing = await User.findOne({ email: emailLower })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    signupOtpStore.set(emailLower, {
      otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    })

    await sendOtpMail(emailLower, otp)
    res.json({ success: true, message: 'Verification code sent to email' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/send-otp (Authenticated)
router.post('/send-otp', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.emailVerificationCode = otp
    user.emailVerificationExpires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    await user.save()

    await sendOtpMail(user.email, otp)
    res.json({ success: true, message: 'Verification code sent to email' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/verify-otp (Authenticated)
router.post('/verify-otp', authMiddleware, async (req, res, next) => {
  try {
    const { otp } = req.body
    if (!otp) {
      return res.status(400).json({ error: 'Verification code is required' })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== otp ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    user.isEmailVerified = true
    user.emailVerificationCode = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    await logAudit('email_verified', 'user', user._id, `Email ${user.email} verified successfully`, req)

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true },
    })
  } catch (err) {
    next(err)
  }
})

export default router
