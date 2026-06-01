import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Shield, Zap, FileText, Clock, Activity, Brain,
  ArrowRight, ChevronDown, Globe, Lock, Star,
  Check, Search, Upload, MessageSquare
} from 'lucide-react'

/* ── Typewriter title reveal ── */
const TITLE = 'ForensicAI'
function TypewriterTitle() {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(TITLE.slice(0, i))
      if (i >= TITLE.length) { clearInterval(interval); setDone(true) }
    }, 90)
    return () => clearInterval(interval)
  }, [])
  return (
    <span>
      {displayed}
      {!done && (
        <span style={{
          display: 'inline-block', width: 3, height: '0.85em',
          background: 'var(--accent-primary)', marginLeft: 4,
          verticalAlign: 'middle', borderRadius: 2,
          animation: 'pulse 0.8s ease-in-out infinite',
        }} />
      )}
    </span>
  )
}

/* ── Floating orb ── */
function Orb({ x, y, size, color, blur, delay }) {
  return (
    <motion.div
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: '50%',
        background: color, filter: `blur(${blur}px)`,
        pointerEvents: 'none',
      }}
      animate={{ y: [0, -30, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 8, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

/* ── Feature card ── */
function FeatureCard({ icon: Icon, title, desc, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
      }}
      whileHover={{
        y: -4,
        boxShadow: `0 16px 40px ${accent}20`,
        borderColor: `${accent}40`,
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.7,
      }} />
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: `${accent}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, color: accent,
        boxShadow: `0 0 20px ${accent}20`,
      }}>
        <Icon size={22} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        {desc}
      </div>
    </motion.div>
  )
}

/* ── Stat number ── */
function StatNum({ value, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ textAlign: 'center' }}
    >
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800,
        letterSpacing: '-0.05em', lineHeight: 1,
        background: 'var(--gradient-primary)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        marginBottom: 6,
      }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const features = [
    { icon: Shield, title: 'Chain of Custody', desc: 'Cryptographic SHA-256 hashing and immutable audit trails protect every piece of evidence from ingestion to report.', accent: '#6366f1', delay: 0 },
    { icon: Brain, title: 'AI Report Generation', desc: 'GPT-4 powered report synthesis automatically drafts forensic narratives, timelines, and executive summaries.', accent: '#a78bfa', delay: 0.08 },
    { icon: Clock, title: 'Timeline Reconstruction', desc: 'Correlate artifacts from logs, disk images, and network captures into a unified chronological event timeline.', accent: '#f59e0b', delay: 0.16 },
    { icon: Activity, title: 'Anomaly Detection', desc: 'ML-based behavioral analysis surfaces suspicious patterns in network traffic, user activity, and system events.', accent: '#10b981', delay: 0.24 },
    { icon: Globe, title: 'Threat Intelligence', desc: 'Integrated IOC matching against live threat feeds. Instantly link artifacts to known adversary TTPs and campaigns.', accent: '#f43f5e', delay: 0.32 },
    { icon: MessageSquare, title: 'Case RAG Chat', desc: 'Ask questions about your case in plain English. The AI retrieves context from all uploaded evidence to answer.', accent: '#38bdf8', delay: 0.4 },
  ]

  const steps = [
    { icon: Upload, label: 'Upload Evidence', desc: 'Drag & drop logs, disk images, PCAP files. Instant SHA-256 hashing.' },
    { icon: Search, label: 'AI Parses & Correlates', desc: 'Automated parsing, timeline extraction, IOC matching, anomaly detection.' },
    { icon: FileText, label: 'Generate Report', desc: 'One-click AI report generation. Review, edit, export to PDF.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: 'rgba(6,6,8,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        {/* Top indigo line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6) 30%, rgba(167,139,250,0.5) 70%, transparent)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.03em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ForensicAI
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" style={{
            padding: '8px 18px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 600,
            color: 'var(--text-secondary)', textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Sign In
          </Link>
          <Link to="/login" style={{
            padding: '9px 22px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 700,
            background: 'var(--gradient-primary)', color: 'white', textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'box-shadow 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'none' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* Ambient orbs */}
        <Orb x="8%" y="20%" size={380} color="rgba(99,102,241,0.12)" blur={80} delay={0} />
        <Orb x="72%" y="10%" size={300} color="rgba(167,139,250,0.1)" blur={80} delay={2} />
        <Orb x="55%" y="65%" size={250} color="rgba(244,63,94,0.06)" blur={80} delay={4} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 2, textAlign: 'center', padding: '100px 24px 60px', maxWidth: 860, margin: '0 auto' }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 100, padding: '6px 16px 6px 10px',
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={11} color="white" />
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-secondary)', letterSpacing: '0.02em' }}>
              AI-Powered Digital Forensics Platform
            </span>
          </motion.div>

          {/* Title with typewriter */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              letterSpacing: '-0.05em', lineHeight: 1.05,
              marginBottom: 24,
              background: 'linear-gradient(135deg, #f1f0fa 30%, var(--accent-secondary) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            <TypewriterTitle />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-secondary)',
              lineHeight: 1.7, maxWidth: 620, margin: '0 auto 40px',
            }}
          >
            Investigate smarter. AI-assisted evidence analysis, automated forensic reporting,
            chain-of-custody compliance, and real-time threat intelligence — all in one platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/login" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700,
              background: 'var(--gradient-primary)', color: 'white', textDecoration: 'none',
              boxShadow: '0 6px 28px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-display)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(99,102,241,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.4)' }}
            >
              Start Investigating <ArrowRight size={18} />
            </Link>
            <a href="#features" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', textDecoration: 'none',
              border: '1px solid var(--border-primary)',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-display)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'var(--border-primary)' }}
            >
              See Features <ChevronDown size={18} />
            </a>
          </motion.div>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 44 }}
          >
            {['SHA-256 Hashing', 'AES-256 Encrypted', 'GDPR Compliant', 'Open Source'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Check size={13} style={{ color: 'var(--accent-success)' }} />
                {t}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'var(--text-muted)' }}
        >
          <ChevronDown size={22} />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '80px 48px', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', background: 'rgba(99,102,241,0.02)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40 }}>
          <StatNum value="10K+" label="Cases Investigated" />
          <StatNum value="99.9%" label="Evidence Integrity" />
          <StatNum value="< 2s" label="AI Parse Time" />
          <StatNum value="50+" label="Evidence Formats" />
          <StatNum value="SOC 2" label="Compliance Ready" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '5px 14px', borderRadius: 100, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Star size={11} /> Platform Features
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 14 }}>
              Everything you need to investigate faster
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
              Built for cybersecurity professionals, incident responders, and forensic analysts who need speed, accuracy, and defensible results.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 48px', background: 'rgba(6,6,8,0.8)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 10 }}>
              From evidence to report in minutes
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>Not hours. Not days.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                style={{ textAlign: 'center', padding: '32px 20px' }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                  fontSize: '1.1rem', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 800,
                  position: 'relative',
                }}>
                  <s.icon size={24} />
                  <span style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-primary)', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                    {i + 1}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Orb x="20%" y="10%" size={300} color="rgba(99,102,241,0.1)" blur={80} delay={1} />
        <Orb x="65%" y="50%" size={250} color="rgba(167,139,250,0.08)" blur={80} delay={3} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, #f1f0fa, var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1, marginBottom: 20 }}>
            Ready to investigate smarter?
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36 }}>
            Join forensic investigators using ForensicAI to close cases faster with AI-assisted analysis and automated reporting.
          </p>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '15px 36px', borderRadius: 12, fontSize: '1rem', fontWeight: 700,
            background: 'var(--gradient-primary)', color: 'white', textDecoration: 'none',
            boxShadow: '0 8px 36px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
            fontFamily: 'var(--font-display)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 50px rgba(99,102,241,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(99,102,241,0.45)' }}
          >
            Create Free Account <ArrowRight size={19} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-primary)', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={13} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ForensicAI</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: 4 }}>© 2025</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Privacy', '/legal?tab=privacy'], ['Terms', '/legal?tab=terms'], ['About', '/legal?tab=about'], ['GitHub', 'https://github.com/cybersecurity26/ForensicAI']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >{label}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
