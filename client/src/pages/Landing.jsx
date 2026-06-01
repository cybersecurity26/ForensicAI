import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Zap, FileText, Clock, Activity, Brain,
  ArrowRight, ChevronDown, Globe, Lock, Star,
  Check, Search, Upload, MessageSquare, Terminal
} from 'lucide-react'

/* ── WebGL-like canvas particle field ── */
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let w = canvas.width = canvas.offsetWidth
    let h = canvas.height = canvas.offsetHeight
    const NUM = 90
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.4,
      a: Math.random(),
    }))
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.a * 0.6})`
        ctx.fill()
      })
      // Draw connecting lines for nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${(1 - dist / 100) * 0.12})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

/* ── MacBook 3D flip + screen typewriter ── */
function MacBookHero() {
  const [phase, setPhase] = useState('closed') // closed → opening → open → typed
  const [typed, setTyped] = useState('')
  const SCREEN_TEXT = 'ForensicAI'
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    // Sequence: wait → open → type
    const t1 = setTimeout(() => setPhase('opening'), 600)
    const t2 = setTimeout(() => setPhase('open'), 2200)
    let charIdx = 0
    const t3 = setTimeout(() => {
      const interval = setInterval(() => {
        charIdx++
        setTyped(SCREEN_TEXT.slice(0, charIdx))
        if (charIdx >= SCREEN_TEXT.length) {
          clearInterval(interval)
          setPhase('typed')
        }
      }, 95)
      return () => clearInterval(interval)
    }, 2600)
    // Cursor blink
    const cursorInterval = setInterval(() => setShowCursor(c => !c), 530)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(cursorInterval) }
  }, [])

  const lidAngle = phase === 'closed' ? -90 : phase === 'opening' ? -15 : 0

  return (
    <div style={{ perspective: '900px', perspectiveOrigin: '50% 60%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 320, position: 'relative', zIndex: 2 }}>
      {/* MacBook wrapper */}
      <div style={{ position: 'relative', width: 480, height: 'auto' }}>

        {/* ── LID (screen half) ── */}
        <div style={{
          width: 480, height: 296,
          transformOrigin: 'bottom center',
          transform: `rotateX(${lidAngle}deg)`,
          transition: 'transform 1.6s cubic-bezier(0.34,1.2,0.64,1)',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}>
          {/* Outer lid — aluminum back */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #1c1c2e 0%, #0f0f1a 50%, #141428 100%)',
            borderRadius: '14px 14px 0 0',
            border: '1px solid rgba(99,102,241,0.18)',
            boxShadow: phase !== 'closed' ? '0 -20px 80px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.1)' : 'none',
            transition: 'box-shadow 1s ease 1s',
          }} />

          {/* Apple-style logo glow on lid back */}
          <div style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(99,102,241,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: phase !== 'closed' ? 0.6 : 0, transition: 'opacity 0.8s ease 1.4s',
          }}>
            <Shield size={18} color="rgba(99,102,241,0.8)" />
          </div>

          {/* Screen bezel */}
          <div style={{
            position: 'absolute', inset: 12,
            background: '#020208',
            borderRadius: 8, overflow: 'hidden',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
          }}>
            {/* Screen glow */}
            <div style={{
              position: 'absolute', inset: 0,
              background: phase === 'open' || phase === 'typed'
                ? 'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.12) 0%, rgba(6,6,8,0.95) 70%)'
                : 'rgba(2,2,8,1)',
              transition: 'background 1.2s ease 0.3s',
            }} />

            {/* Scanlines overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
              opacity: 0.6,
            }} />

            {/* Screen content */}
            <div style={{
              position: 'relative', zIndex: 2, height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: phase === 'open' || phase === 'typed' ? 1 : 0,
              transition: 'opacity 0.6s ease 0.5s',
            }}>
              {/* Terminal prompt line */}
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'rgba(99,102,241,0.5)', letterSpacing: '0.04em', marginBottom: 4 }}>
                forensic@intelligence:~$
              </div>

              {/* Main title */}
              <div style={{
                fontFamily: 'Sora, sans-serif', fontWeight: 800,
                fontSize: '2.2rem', letterSpacing: '-0.06em', lineHeight: 1,
                background: 'linear-gradient(135deg, #f1f0fa, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {typed}
                {phase !== 'typed' && (
                  <span style={{ WebkitTextFillColor: 'var(--accent-primary)', opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}>_</span>
                )}
              </div>

              {/* Sub line */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
                color: 'rgba(167,139,250,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase',
                opacity: phase === 'typed' ? 1 : 0, transition: 'opacity 0.8s ease 0.4s',
              }}>
                Digital Forensics Intelligence v2.0
              </div>

              {/* Fake terminal lines */}
              <div style={{
                marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3,
                opacity: phase === 'typed' ? 0.45 : 0, transition: 'opacity 0.8s ease 0.8s',
              }}>
                {['Initializing AI engine...', 'Chain-of-custody: ACTIVE', 'Encryption: AES-256'].map((line, i) => (
                  <div key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: i === 1 ? '#10b981' : 'rgba(99,102,241,0.6)', letterSpacing: '0.02em' }}>
                    {'>'} {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Camera dot */}
          <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.2)' }} />
        </div>

        {/* ── BASE (keyboard half) ── */}
        <div style={{
          width: 480, height: 18,
          background: 'linear-gradient(180deg, #16162a 0%, #0d0d1c 100%)',
          borderRadius: '0 0 10px 10px',
          border: '1px solid rgba(99,102,241,0.12)',
          borderTop: '1px solid rgba(99,102,241,0.06)',
          position: 'relative',
        }}>
          {/* Trackpad reflection */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 120, height: 8, background: 'rgba(99,102,241,0.04)', borderRadius: 4, border: '1px solid rgba(99,102,241,0.08)' }} />
        </div>

        {/* Ground shadow */}
        <div style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          width: phase !== 'closed' ? 420 : 300, height: 16, borderRadius: '50%',
          background: 'rgba(99,102,241,0.1)',
          filter: 'blur(12px)',
          transition: 'width 1.6s ease',
        }} />
      </div>
    </div>
  )
}

/* ── Feature card ── */
function FeatureCard({ icon: Icon, title, desc, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-xl)', padding: '28px 24px',
        position: 'relative', overflow: 'hidden', cursor: 'default',
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
      }}
      whileHover={{ y: -4, boxShadow: `0 16px 40px ${accent}20`, borderColor: `${accent}40` }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.7 }} />
      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: accent, boxShadow: `0 0 20px ${accent}20` }}>
        <Icon size={21} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</div>
    </motion.div>
  )
}

/* ── Stat ── */
function Stat({ value, label }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-0.05em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const features = [
    { icon: Shield, title: 'Chain of Custody', desc: 'Cryptographic SHA-256 hashing and immutable audit trails protect every piece of evidence.', accent: '#6366f1', delay: 0 },
    { icon: Brain, title: 'AI Report Generation', desc: 'GPT-4 powered synthesis drafts forensic narratives, timelines, and executive summaries.', accent: '#a78bfa', delay: 0.08 },
    { icon: Clock, title: 'Timeline Reconstruction', desc: 'Correlate logs, disk images, and PCAP captures into a unified chronological timeline.', accent: '#f59e0b', delay: 0.16 },
    { icon: Activity, title: 'Anomaly Detection', desc: 'ML Isolation Forest surfaces suspicious behavioral patterns in seconds, not hours.', accent: '#10b981', delay: 0.24 },
    { icon: Globe, title: 'Threat Intelligence', desc: 'Live IOC matching against threat feeds. Link artifacts to known adversary TTPs instantly.', accent: '#f43f5e', delay: 0.32 },
    { icon: MessageSquare, title: 'Case RAG Chat', desc: 'Ask questions about your case in plain English — the AI retrieves from all uploaded evidence.', accent: '#38bdf8', delay: 0.4 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: scrolled ? 'rgba(6,6,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-primary)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5) 30%, rgba(167,139,250,0.4) 70%, transparent)', opacity: scrolled ? 1 : 0, transition: 'opacity 0.3s' }} />

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <Shield size={17} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.03em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ForensicAI
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >Sign In</Link>
          <Link to="/login" style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 700, background: 'var(--gradient-primary)', color: 'white', textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', transition: 'box-shadow 0.2s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'none' }}
          >Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 80 }}>

        {/* Particle WebGL canvas */}
        <ParticleCanvas />

        {/* Background gradient mesh */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 2, width: '100%', maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 3.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 100, padding: '6px 16px 6px 10px' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={11} color="white" /></span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-secondary)', letterSpacing: '0.02em' }}>AI-Powered Digital Forensics Platform</span>
          </motion.div>

          {/* MacBook animation */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%', marginBottom: 40 }}>
            <MacBookHero />
          </motion.div>

          {/* Sub headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 3.8 }}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.04em', lineHeight: 1.25, marginBottom: 18, textAlign: 'center', background: 'linear-gradient(135deg, #f1f0fa 40%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Investigate smarter. Close cases faster.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 3.95 }}
            style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 580, margin: '0 auto 36px', textAlign: 'center' }}>
            AI-assisted evidence analysis, automated forensic reporting, chain-of-custody compliance, and real-time threat intelligence — all in one platform.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 4.1 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 30px', borderRadius: 10, fontSize: '0.94rem', fontWeight: 700, background: 'var(--gradient-primary)', color: 'white', textDecoration: 'none', boxShadow: '0 6px 28px rgba(99,102,241,0.4)', fontFamily: 'var(--font-display)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.4)' }}>
              Start Investigating <ArrowRight size={17} />
            </Link>
            <a href="#features" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 10, fontSize: '0.94rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', textDecoration: 'none', border: '1px solid var(--border-primary)', fontFamily: 'var(--font-display)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'var(--border-primary)' }}>
              See Features <ChevronDown size={17} />
            </a>
          </motion.div>

          {/* Trust pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 4.3 }}
            style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['SHA-256 Hashing', 'AES-256 Encrypted', 'GDPR Compliant', 'Open Source'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <Check size={12} style={{ color: 'var(--accent-success)' }} /> {t}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'var(--text-muted)', zIndex: 2 }}>
          <ChevronDown size={22} />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '72px 48px', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', background: 'rgba(99,102,241,0.02)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 36 }}>
          <Stat value="10K+" label="Cases Investigated" />
          <Stat value="99.9%" label="Evidence Integrity" />
          <Stat value="< 2s" label="AI Parse Time" />
          <Stat value="50+" label="Evidence Formats" />
          <Stat value="SOC 2" label="Compliance Ready" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '5px 14px', borderRadius: 100, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Star size={10} /> Platform Features
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 14 }}>
              Everything you need to investigate faster
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
              Built for cybersecurity professionals, incident responders, and forensic analysts.
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 48px', background: 'rgba(6,6,8,0.8)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 10 }}>
              From evidence to report in minutes
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>Not hours. Not days.</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
            {[
              { icon: Upload, label: 'Upload Evidence', desc: 'Drag & drop logs, disk images, PCAP files. Instant SHA-256 hashing.', color: '#6366f1' },
              { icon: Search, label: 'AI Parses & Correlates', desc: 'Automated parsing, timeline extraction, IOC matching, anomaly detection.', color: '#a78bfa' },
              { icon: FileText, label: 'Generate Report', desc: 'One-click AI report generation. Review, edit, export to PDF.', color: '#f59e0b' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }} style={{ textAlign: 'center', padding: '28px 16px' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', margin: '0 auto 16px', background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 24px ${s.color}35`, position: 'relative' }}>
                  <s.icon size={23} color="white" />
                  <span style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-primary)', border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: s.color }}>{i + 1}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '96px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, #f1f0fa, var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1, marginBottom: 20 }}>
            Ready to investigate smarter?
          </h2>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 36 }}>
            Join forensic investigators using ForensicAI to close cases faster with AI-assisted analysis and automated reporting.
          </p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 34px', borderRadius: 12, fontSize: '0.98rem', fontWeight: 700, background: 'var(--gradient-primary)', color: 'white', textDecoration: 'none', boxShadow: '0 8px 36px rgba(99,102,241,0.45)', fontFamily: 'var(--font-display)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 50px rgba(99,102,241,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(99,102,241,0.45)' }}>
            Create Free Account <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-primary)', padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={13} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ForensicAI</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginLeft: 4 }}>© 2025</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Privacy', '/legal'], ['Terms', '/legal'], ['GitHub', 'https://github.com/cybersecurity26/ForensicAI']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >{label}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
