import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Eye, EyeOff, LogIn, UserPlus, Mail, Lock, User,
  Building2, ChevronRight, Fingerprint, Zap
} from 'lucide-react'
import { loginUser, registerUser, getPasskeyAuthOptions, authenticatePasskey } from '../api'
import { useAuth } from '../context/AuthContext'
import { startAuthentication } from '@simplewebauthn/browser'

/* ─── Eyeball component — tracks mouse ─── */
function EyeBall({ size = 18, pupilSize = 7, eyeColor = 'white', pupilColor = '#1a1933', isBlinking = false, forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const eyeRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const getPupilPos = () => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!eyeRef.current) return { x: 0, y: 0 }
    const r = eyeRef.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = mouseX - cx
    const dy = mouseY - cy
    const maxDist = 5
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const pos = getPupilPos()

  return (
    <div
      ref={eyeRef}
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        borderRadius: '50%',
        background: eyeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'height 0.12s ease',
        flexShrink: 0,
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: pupilSize,
            height: pupilSize,
            borderRadius: '50%',
            background: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: 'transform 0.08s ease-out',
          }}
        />
      )}
    </div>
  )
}

/* ─── Pupil-only component (no white sclera) ─── */
function Pupil({ size = 12, pupilColor = '#1a1933', forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const getPos = () => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!ref.current) return { x: 0, y: 0 }
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = mouseX - cx
    const dy = mouseY - cy
    const maxDist = 5
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const pos = getPos()
  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 0.08s ease-out',
        flexShrink: 0,
      }}
    />
  )
}

/* ─── Main Login Component ─── */
export default function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [role, setRole] = useState('investigator')
  const [info, setInfo] = useState('')

  const [requires2FA, setRequires2FA] = useState(false)
  const [loginToken, setLoginToken] = useState('')
  const [verifying2FA, setVerifying2FA] = useState(false)

  // Mouse tracking for characters
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)

  // Character animation states
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)

  const purpleRef = useRef(null)
  const blackRef = useRef(null)
  const yellowRef = useRef(null)
  const orangeRef = useRef(null)

  // Mouse tracking
  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Purple blink loop
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsPurpleBlinking(true)
        setTimeout(() => { setIsPurpleBlinking(false); schedule() }, 150)
      }, Math.random() * 4000 + 3000)
      return t
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // Black blink loop
  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setIsBlackBlinking(true)
        setTimeout(() => { setIsBlackBlinking(false); schedule() }, 150)
      }, Math.random() * 4000 + 3500)
      return t
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // Look at each other when typing starts
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true)
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800)
      return () => clearTimeout(t)
    } else {
      setIsLookingAtEachOther(false)
    }
  }, [isTyping])

  // Purple peeking when password visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedule = () => {
        const t = setTimeout(() => {
          setIsPurplePeeking(true)
          setTimeout(() => setIsPurplePeeking(false), 800)
        }, Math.random() * 3000 + 2000)
        return t
      }
      const t = schedule()
      return () => clearTimeout(t)
    } else {
      setIsPurplePeeking(false)
    }
  }, [password, showPassword, isPurplePeeking])

  // Compute character position based on mouse
  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 3
    const dx = mouseX - cx
    const dy = mouseY - cy
    const faceX = Math.max(-12, Math.min(12, dx / 22))
    const faceY = Math.max(-8, Math.min(8, dy / 35))
    const bodySkew = Math.max(-5, Math.min(5, -dx / 130))
    return { faceX, faceY, bodySkew }
  }

  const purplePos = calcPos(purpleRef)
  const blackPos = calcPos(blackRef)
  const yellowPos = calcPos(yellowRef)
  const orangePos = calcPos(orangeRef)

  const isPasswordHidden = password.length > 0 && !showPassword
  const isPasswordShown = password.length > 0 && showPassword

  // ─── Form Handlers ───
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (isSignup) {
      if (password !== confirmPassword) return setError('Passwords do not match')
      if (password.length < 8) return setError('Password must be at least 8 characters')
      setLoading(true)
      try {
        const data = await registerUser({ name, email, password, role, organization })
        login(data.token, data.user, data.sessionTimeout)
        navigate('/dashboard')
      } catch (err) {
        setError(err.message || 'Registration failed')
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        const data = await loginUser(email, password)
        if (data.requires2FA) {
          setLoginToken(data.loginToken)
          setRequires2FA(true)
          setLoading(false)
          return
        }
        login(data.token, data.user, data.sessionTimeout)
        navigate('/dashboard')
      } catch (err) {
        setError(err.message || 'Authentication failed')
      } finally {
        setLoading(false)
      }
    }
  }

  const handle2FAVerify = async () => {
    setError('')
    setVerifying2FA(true)
    try {
      const options = await getPasskeyAuthOptions(loginToken)
      const credential = await startAuthentication({ optionsJSON: options })
      const data = await authenticatePasskey(loginToken, credential)
      login(data.token, data.user, data.sessionTimeout)
      navigate('/dashboard')
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
        setError('Passkey verification was cancelled.')
      } else {
        setError(err.message || 'Passkey verification failed')
      }
    } finally {
      setVerifying2FA(false)
    }
  }

  return (
    <div className="login-page">

      {/* ═══════════════════════════════════════
          LEFT PANEL — Animated Characters
          ═══════════════════════════════════════ */}
      <div className="login-left-panel">

        {/* Floating particles */}
        <div className="login-particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="login-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${1.5 + Math.random() * 3}px`,
                height: `${1.5 + Math.random() * 3}px`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 14}s`,
              }}
            />
          ))}
        </div>

        {/* Brand */}
        <div className="login-brand" style={{ position: 'relative', zIndex: 2 }}>
          <div className="login-brand-icon">
            <Shield size={20} />
          </div>
          <div>
            <div className="login-brand-name">ForensicAI</div>
            <div className="login-brand-sub">Intelligence Platform</div>
          </div>
        </div>

        {/* Characters Stage */}
        <div className="login-characters-stage">
          <div className="login-characters-container">

            {/* Ground glow line */}
            <div className="login-characters-ground" />

            {/* ── CHARACTER 1: Tall Indigo Rectangle (Back) ── */}
            <div
              ref={purpleRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 55,
                width: 160,
                height: (isTyping || isPasswordHidden) ? 410 : 370,
                background: 'linear-gradient(175deg, #6366f1 0%, #4f52d8 100%)',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isPasswordShown
                  ? 'skewX(0deg)'
                  : (isTyping || isPasswordHidden)
                    ? `skewX(${(purplePos.bodySkew || 0) - 10}deg) translateX(36px)`
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
                boxShadow: '0 -8px 40px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {/* Shine stripe */}
              <div style={{
                position: 'absolute', top: 0, left: 20, width: 24, height: '100%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)',
                borderRadius: '10px 0 0 0',
              }} />

              {/* Eyes */}
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: 16,
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                left: isPasswordShown
                  ? 18
                  : isLookingAtEachOther ? 52 : Math.round(40 + purplePos.faceX),
                top: isPasswordShown
                  ? 30
                  : isLookingAtEachOther ? 58 : Math.round(36 + purplePos.faceY),
              }}>
                <EyeBall
                  size={18} pupilSize={7} eyeColor="white" pupilColor="#1a1933"
                  isBlinking={isPurpleBlinking}
                  forceLookX={isPasswordShown ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={isPasswordShown ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall
                  size={18} pupilSize={7} eyeColor="white" pupilColor="#1a1933"
                  isBlinking={isPurpleBlinking}
                  forceLookX={isPasswordShown ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={isPasswordShown ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>

              {/* Badge accent */}
              <div style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.12)', borderRadius: 6,
                padding: '3px 10px', fontSize: '0.55rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                AGENT
              </div>
            </div>

            {/* ── CHARACTER 2: Dark Rectangle (Mid) ── */}
            <div
              ref={blackRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 222,
                width: 108,
                height: 295,
                background: 'linear-gradient(175deg, #1e1b4b 0%, #161430 100%)',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isPasswordShown
                  ? 'skewX(0deg)'
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.4 + 8}deg) translateX(18px)`
                    : (isTyping || isPasswordHidden)
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.4}deg)`
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
                boxShadow: '0 -6px 30px rgba(30,27,75,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: 14,
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                left: isPasswordShown ? 10 : isLookingAtEachOther ? 30 : Math.round(22 + blackPos.faceX),
                top: isPasswordShown ? 26 : isLookingAtEachOther ? 10 : Math.round(28 + blackPos.faceY),
              }}>
                <EyeBall
                  size={16} pupilSize={6} eyeColor="rgba(255,255,255,0.9)" pupilColor="#1a1933"
                  isBlinking={isBlackBlinking}
                  forceLookX={isPasswordShown ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isPasswordShown ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall
                  size={16} pupilSize={6} eyeColor="rgba(255,255,255,0.9)" pupilColor="#1a1933"
                  isBlinking={isBlackBlinking}
                  forceLookX={isPasswordShown ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isPasswordShown ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
              {/* Indigo accent stripe on side */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
                background: 'linear-gradient(to bottom, #6366f1, transparent)',
                borderRadius: '8px 0 0 0',
              }} />
            </div>

            {/* ── CHARACTER 3: Amber Semi-circle (Front Left) ── */}
            <div
              ref={orangeRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 220,
                height: 185,
                background: 'linear-gradient(160deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '110px 110px 0 0',
                zIndex: 3,
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isPasswordShown ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
                boxShadow: '0 -6px 30px rgba(245,158,11,0.25)',
              }}
            >
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: 22,
                transition: 'all 0.18s ease-out',
                left: isPasswordShown ? 48 : Math.round(74 + (orangePos.faceX || 0)),
                top: isPasswordShown ? 78 : Math.round(82 + (orangePos.faceY || 0)),
              }}>
                <Pupil size={11} pupilColor="#1a1933"
                  forceLookX={isPasswordShown ? -5 : undefined}
                  forceLookY={isPasswordShown ? -4 : undefined}
                />
                <Pupil size={11} pupilColor="#1a1933"
                  forceLookX={isPasswordShown ? -5 : undefined}
                  forceLookY={isPasswordShown ? -4 : undefined}
                />
              </div>
            </div>

            {/* ── CHARACTER 4: Violet Rounded Tall (Front Right) ── */}
            <div
              ref={yellowRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 298,
                width: 128,
                height: 215,
                background: 'linear-gradient(170deg, #a78bfa 0%, #8b5cf6 100%)',
                borderRadius: '64px 64px 0 0',
                zIndex: 4,
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isPasswordShown ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
                boxShadow: '0 -6px 30px rgba(167,139,250,0.25)',
              }}
            >
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: 18,
                transition: 'all 0.18s ease-out',
                left: isPasswordShown ? 18 : Math.round(46 + (yellowPos.faceX || 0)),
                top: isPasswordShown ? 32 : Math.round(36 + (yellowPos.faceY || 0)),
              }}>
                <Pupil size={11} pupilColor="#2d1b69"
                  forceLookX={isPasswordShown ? -5 : undefined}
                  forceLookY={isPasswordShown ? -4 : undefined}
                />
                <Pupil size={11} pupilColor="#2d1b69"
                  forceLookX={isPasswordShown ? -5 : undefined}
                  forceLookY={isPasswordShown ? -4 : undefined}
                />
              </div>
              {/* Mouth line */}
              <div style={{
                position: 'absolute',
                width: 56, height: 3,
                background: 'rgba(45,27,105,0.5)',
                borderRadius: 2,
                transition: 'all 0.18s ease-out',
                left: isPasswordShown ? 10 : Math.round(36 + (yellowPos.faceX || 0)),
                top: isPasswordShown ? 82 : Math.round(80 + (yellowPos.faceY || 0)),
              }} />
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="login-left-footer">
          <a href="/legal?tab=privacy">Privacy</a>
          <a href="/legal?tab=terms">Terms</a>
          <a href="/legal?tab=about">About</a>
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={10} />
            Secured with AES-256
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Login Form
          ═══════════════════════════════════════ */}
      <div className="login-right-panel">
        <motion.div
          className="login-card-wrapper"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rgb-border-container">
            <div className="rgb-border-glow" />
            <div className="login-card">

              {/* Header */}
              <div className="login-header">
                <div className="login-logo">
                  <Shield size={24} />
                </div>
                <h1 className="login-title">ForensicAI</h1>
                <p className="login-subtitle">Digital Forensics Intelligence Platform</p>
              </div>

              <AnimatePresence mode="wait">
                {requires2FA ? (
                  /* ─── 2FA Screen ─── */
                  <motion.div
                    key="2fa"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28 }}
                    style={{ textAlign: 'center', padding: '8px 0' }}
                  >
                    <div style={{
                      width: 68, height: 68, borderRadius: '50%', margin: '0 auto 16px',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(167,139,250,0.15))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid rgba(99,102,241,0.3)',
                      boxShadow: '0 0 30px rgba(99,102,241,0.15)',
                    }}>
                      <Fingerprint size={32} style={{ color: 'var(--accent-secondary)' }} />
                    </div>

                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      Two-Factor Authentication
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.55 }}>
                      Your account requires passkey verification.<br />
                      Use your fingerprint, Face ID, or security key.
                    </p>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          className="login-error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginBottom: 14 }}
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      className="login-submit-btn"
                      onClick={handle2FAVerify}
                      disabled={verifying2FA}
                      style={{ marginBottom: 12 }}
                    >
                      {verifying2FA ? <div className="login-spinner" /> : <><Fingerprint size={17} /> Verify with Passkey</>}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setRequires2FA(false); setLoginToken(''); setError('') }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', padding: '8px 0', width: '100%' }}
                    >
                      ← Back to Sign In
                    </button>
                  </motion.div>
                ) : (
                  /* ─── Login / Signup Form ─── */
                  <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Toggle */}
                    <div className="login-toggle">
                      <button
                        className={`login-toggle-btn ${!isSignup ? 'active' : ''}`}
                        onClick={() => { setIsSignup(false); setError(''); setInfo('') }}
                        type="button"
                      >
                        <LogIn size={13} /> Sign In
                      </button>
                      <button
                        className={`login-toggle-btn ${isSignup ? 'active' : ''}`}
                        onClick={() => { setIsSignup(true); setError(''); setInfo('') }}
                        type="button"
                      >
                        <UserPlus size={13} /> Sign Up
                      </button>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          className="login-error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginBottom: 14 }}
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Info */}
                    <AnimatePresence>
                      {info && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{
                            background: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.25)',
                            borderRadius: 8, padding: '10px 14px',
                            color: 'var(--accent-secondary)', fontSize: '0.82rem',
                            lineHeight: 1.5, marginBottom: 14,
                          }}
                        >
                          {info}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isSignup ? 'signup' : 'login'}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                        >
                          {isSignup && (
                            <div className="login-field" style={{ marginBottom: 0 }}>
                              <div className="login-field-icon"><User size={15} /></div>
                              <input
                                type="text" placeholder="Full Name"
                                value={name} onChange={(e) => setName(e.target.value)}
                                required autoComplete="name"
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                              />
                            </div>
                          )}

                          <div className="login-field" style={{ marginTop: isSignup ? 12 : 0 }}>
                            <div className="login-field-icon"><Mail size={15} /></div>
                            <input
                              type="email" placeholder="Email address"
                              value={email} onChange={(e) => setEmail(e.target.value)}
                              required autoComplete="email"
                              onFocus={() => setIsTyping(true)}
                              onBlur={() => setIsTyping(false)}
                            />
                          </div>

                          <div className="login-field" style={{ marginTop: 12 }}>
                            <div className="login-field-icon"><Lock size={15} /></div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Password"
                              value={password} onChange={(e) => setPassword(e.target.value)}
                              required
                              autoComplete={isSignup ? 'new-password' : 'current-password'}
                              onFocus={() => setIsTyping(true)}
                              onBlur={() => setIsTyping(false)}
                            />
                            <button
                              type="button"
                              className="login-eye-btn"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>

                          {isSignup && (
                            <>
                              <div className="login-field" style={{ marginTop: 12 }}>
                                <div className="login-field-icon"><Lock size={15} /></div>
                                <input
                                  type="password" placeholder="Confirm Password"
                                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                  required autoComplete="new-password"
                                  onFocus={() => setIsTyping(true)}
                                  onBlur={() => setIsTyping(false)}
                                />
                              </div>

                              <div className="login-field" style={{ marginTop: 12 }}>
                                <div className="login-field-icon"><Building2 size={15} /></div>
                                <input
                                  type="text" placeholder="Organization (optional)"
                                  value={organization} onChange={(e) => setOrganization(e.target.value)}
                                  autoComplete="organization"
                                />
                              </div>

                              <div className="login-field" style={{ marginTop: 12 }}>
                                <div className="login-field-icon"><Shield size={15} /></div>
                                <select
                                  value={role} onChange={(e) => setRole(e.target.value)}
                                  style={{ paddingLeft: 42, width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '13px 14px 13px 42px', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-primary)', appearance: 'none' }}
                                >
                                  <option value="investigator">Investigator</option>
                                  <option value="analyst">Analyst</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              </div>
                              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, paddingLeft: 4 }}>
                                For Administrator access, contact System Admin
                              </p>
                            </>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? (
                          <div className="login-spinner" />
                        ) : (
                          <>
                            {isSignup ? 'Create Account' : 'Sign In'}
                            <ChevronRight size={17} />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="login-footer">
                <div className="login-footer-line" />
                <span>AES-256 Encrypted</span>
                <div className="login-footer-line" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
