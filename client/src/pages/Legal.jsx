import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Lock, FileText, Cookie, Info, ArrowLeft,
  CheckCircle, Globe, Server, Database, Brain, Eye,
  AlertTriangle, Mail, ExternalLink
} from 'lucide-react'

const tabs = [
  { key: 'about', label: 'About', icon: Info },
  { key: 'privacy', label: 'Privacy Policy', icon: Lock },
  { key: 'terms', label: 'Terms of Use', icon: FileText },
  { key: 'cookies', label: 'Cookies Policy', icon: Cookie },
]

function SectionCard({ icon: Icon, title, children, accent = 'var(--accent-primary)' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: 20,
      }}
    >
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {Icon && <Icon size={18} style={{ color: accent, flexShrink: 0 }} />}
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        </div>
      )}
      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.85 }}>
        {children}
      </div>
    </motion.div>
  )
}

function Highlight({ children }) {
  return <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{children}</span>
}

function ListItem({ children }) {
  return (
    <li style={{ marginBottom: 8, paddingLeft: 4 }}>
      <span style={{ color: 'var(--accent-primary)', marginRight: 8 }}>›</span>
      {children}
    </li>
  )
}

// ─── About ─────────────────────────────────────────────────

function AboutContent() {
  return (
    <>
      <SectionCard icon={Shield} title="What is ForensicAI?">
        <p>
          <Highlight>ForensicAI</Highlight> is an advanced digital forensics investigation platform that combines
          the power of artificial intelligence with rigorous forensic methodologies. Built for cybersecurity
          professionals, incident responders, and digital forensics examiners, it streamlines the entire
          investigation lifecycle — from evidence collection and parsing to timeline reconstruction and report generation.
        </p>
        <p style={{ marginTop: 12 }}>
          Our platform upholds the <Highlight>Human-in-the-Loop</Highlight> principle: AI assists with analysis
          and drafting, but all conclusions, findings, and recommendations must be reviewed and approved by
          qualified human investigators before finalization.
        </p>
      </SectionCard>

      <SectionCard icon={Brain} title="Key Capabilities" accent="#7b61ff">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <ListItem><strong>Multi-Format Evidence Parsing</strong> — Supports LOG, CSV, JSON, TXT, XML, PCAP, EVTX, and more. Auto-detects format and extracts structured events.</ListItem>
          <ListItem><strong>SHA-256 Integrity Hashing</strong> — Every uploaded file is immediately hashed for chain-of-custody integrity verification.</ListItem>
          <ListItem><strong>AI-Powered Report Generation</strong> — Produces draft forensic reports with executive summaries, findings, timelines, and recommendations.</ListItem>
          <ListItem><strong>Timeline Reconstruction</strong> — Builds unified, filterable event timelines across multiple evidence sources with severity classification.</ListItem>
          <ListItem><strong>Audit Logging</strong> — Every action is recorded in an immutable audit trail for accountability and compliance.</ListItem>
          <ListItem><strong>Role-Based Access Control</strong> — Secure authentication with optional two-factor authentication and passkey support.</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Server} title="Technology Stack" accent="#00e676">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 8 }}>
          {[
            { label: 'Frontend', items: 'React, Vite, Framer Motion' },
            { label: 'Backend', items: 'Node.js, Express.js' },
            { label: 'Database', items: 'MongoDB with Mongoose' },
            { label: 'AI Engine', items: 'OpenAI, Gemini, Mistral' },
            { label: 'Security', items: 'JWT, bcrypt, TOTP 2FA, WebAuthn' },
            { label: 'Visualization', items: 'Recharts, Lucide Icons' },
          ].map((tech, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)',
              padding: '12px 16px', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {tech.label}
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{tech.items}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Mail} title="Contact" accent="#ffab40">
        <p>
          For inquiries, support requests, or to report security vulnerabilities, contact us at:
        </p>
        <div style={{
          background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px', marginTop: 10,
          fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
        }}>
          📧 support@forensicai.dev &nbsp;·&nbsp; 🔒 security@forensicai.dev
        </div>
        <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Version 1.0.0 &nbsp;·&nbsp; © {new Date().getFullYear()} ForensicAI. All rights reserved.
        </p>
      </SectionCard>
    </>
  )
}

// ─── Privacy Policy ────────────────────────────────────────

function PrivacyContent() {
  return (
    <>
      <SectionCard icon={Eye} title="Information We Collect">
        <p>ForensicAI collects the following types of information to provide and improve the platform:</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem><strong>Account Information</strong> — Name, email address, role, and organization when you register.</ListItem>
          <ListItem><strong>Authentication Data</strong> — Hashed passwords, session tokens, 2FA secrets (encrypted), and passkey credentials.</ListItem>
          <ListItem><strong>Evidence Files</strong> — Log files, CSVs, and other forensic artifacts you upload for analysis. These are stored securely on the server.</ListItem>
          <ListItem><strong>Usage Data</strong> — Actions performed within the platform (audit logs), including timestamps, IP addresses, and user agents.</ListItem>
          <ListItem><strong>AI Interaction Data</strong> — Prompts sent to AI providers for report generation (evidence data is included in prompts).</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Lock} title="How We Use Your Data" accent="#7b61ff">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ListItem>To authenticate and authorize your access to the platform</ListItem>
          <ListItem>To parse, analyze, and generate reports from uploaded evidence</ListItem>
          <ListItem>To maintain audit trails for accountability and compliance</ListItem>
          <ListItem>To improve AI-generated output quality for forensic reports</ListItem>
          <ListItem>To send notifications related to your investigation activities</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Database} title="Data Storage & Security" accent="#00e676">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ListItem>All data is stored in encrypted MongoDB databases</ListItem>
          <ListItem>Passwords are hashed using bcrypt with salt rounds</ListItem>
          <ListItem>Evidence files are stored on the server with SHA-256 integrity hashes</ListItem>
          <ListItem>JWT tokens are used for session management with configurable expiration</ListItem>
          <ListItem>All API communications use HTTPS in production environments</ListItem>
          <ListItem>Two-factor authentication (TOTP) and WebAuthn passkeys are available for enhanced security</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Globe} title="Third-Party Services" accent="#ffab40">
        <p>ForensicAI may share limited data with the following third-party services:</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem><strong>AI Providers</strong> (OpenAI, Google Gemini, Mistral) — Evidence data is sent as part of AI prompts for report generation. Only the configured provider receives data.</ListItem>
          <ListItem><strong>MongoDB Atlas</strong> (if cloud-hosted) — Database hosting with encryption at rest.</ListItem>
        </ul>
        <div style={{
          background: 'rgba(255,171,64,0.08)', border: '1px solid rgba(255,171,64,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 14,
          fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 2 }} />
          <span>Evidence data sent to AI providers is processed according to their respective privacy policies. Review your AI provider's data handling practices before uploading sensitive evidence.</span>
        </div>
      </SectionCard>

      <SectionCard icon={CheckCircle} title="Your Rights" accent="#00d4ff">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ListItem><strong>Access</strong> — You can view all your data through the Settings and Audit pages</ListItem>
          <ListItem><strong>Correction</strong> — Update your profile information at any time via Settings</ListItem>
          <ListItem><strong>Deletion</strong> — Contact an administrator to request account and data deletion</ListItem>
          <ListItem><strong>Export</strong> — Download your reports as PDF documents</ListItem>
          <ListItem><strong>Restrict Processing</strong> — You may choose not to use AI features and write reports manually</ListItem>
        </ul>
      </SectionCard>

      <SectionCard>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;·&nbsp;
          For questions about this privacy policy, contact <Highlight>privacy@forensicai.dev</Highlight>
        </p>
      </SectionCard>
    </>
  )
}

// ─── Terms of Use ──────────────────────────────────────────

function TermsContent() {
  return (
    <>
      <SectionCard icon={FileText} title="1. Acceptance of Terms">
        <p>
          By accessing or using ForensicAI ("the Platform"), you agree to be bound by these Terms of Use.
          If you do not agree to these terms, do not use the Platform. These terms apply to all users,
          including investigators, analysts, administrators, and viewers.
        </p>
      </SectionCard>

      <SectionCard icon={Shield} title="2. Permitted Use" accent="#7b61ff">
        <p>ForensicAI is designed for <Highlight>lawful digital forensics investigations</Highlight>. You agree to:</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem>Use the Platform only for authorized forensic investigations</ListItem>
          <ListItem>Comply with all applicable local, state, national, and international laws</ListItem>
          <ListItem>Maintain the confidentiality of investigation data and evidence</ListItem>
          <ListItem>Not upload malicious files intended to compromise the Platform</ListItem>
          <ListItem>Not attempt to reverse-engineer, decompile, or disassemble the Platform</ListItem>
          <ListItem>Not share your credentials or allow unauthorized access to your account</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Brain} title="3. AI-Generated Content" accent="#00e676">
        <p>
          The Platform uses artificial intelligence to assist with report generation, evidence analysis, and
          findings summarization. By using these features, you acknowledge and agree that:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem>AI-generated content is provided as <strong>draft material only</strong> and must be reviewed by a qualified human investigator</ListItem>
          <ListItem>AI may produce inaccurate, incomplete, or misleading output — <strong>independent verification is required</strong></ListItem>
          <ListItem>ForensicAI and its developers are <strong>not liable</strong> for decisions made based on AI-generated content</ListItem>
          <ListItem>AI-generated sections are clearly labeled in reports for transparency</ListItem>
          <ListItem>Evidence data is sent to third-party AI providers for processing</ListItem>
        </ul>
        <div style={{
          background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 14,
          fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={16} style={{ color: '#ff5252', flexShrink: 0, marginTop: 2 }} />
          <span><strong>Legal Disclaimer:</strong> AI-generated forensic reports do not constitute legal advice, expert testimony, or conclusive findings. They are investigative aids that require human validation.</span>
        </div>
      </SectionCard>

      <SectionCard icon={Database} title="4. Evidence & Data Handling" accent="#ffab40">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ListItem>You are responsible for ensuring you have legal authority to upload and analyze evidence files</ListItem>
          <ListItem>All uploaded files are hashed with SHA-256 for integrity verification</ListItem>
          <ListItem>Evidence files are stored on the server and may be deleted by authorized users</ListItem>
          <ListItem>The Platform maintains audit logs of all evidence-related actions</ListItem>
          <ListItem>You must comply with chain-of-custody requirements applicable to your jurisdiction</ListItem>
        </ul>
      </SectionCard>

      <SectionCard icon={Lock} title="5. Account Security">
        <p>You are responsible for maintaining the security of your account. This includes:</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem>Using a strong, unique password</ListItem>
          <ListItem>Enabling two-factor authentication (recommended)</ListItem>
          <ListItem>Not sharing login credentials with unauthorized individuals</ListItem>
          <ListItem>Reporting suspected unauthorized access immediately</ListItem>
        </ul>
      </SectionCard>

      <SectionCard title="6. Limitation of Liability">
        <p>
          ForensicAI is provided <strong>"as is"</strong> without warranties of any kind, express or implied.
          The developers shall not be liable for any loss, damage, or harm arising from the use of the Platform,
          including but not limited to incorrect AI outputs, data loss, service interruptions, or unauthorized access.
        </p>
      </SectionCard>

      <SectionCard title="7. Modifications">
        <p>
          We reserve the right to modify these Terms of Use at any time. Users will be notified of significant
          changes through the Platform's notification system. Continued use after changes constitutes acceptance.
        </p>
        <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </SectionCard>
    </>
  )
}

// ─── Cookies Policy ────────────────────────────────────────

function CookiesContent() {
  return (
    <>
      <SectionCard icon={Cookie} title="What Are Cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a website. ForensicAI uses
          cookies and similar local storage mechanisms to provide essential functionality, maintain your
          session, and remember your preferences.
        </p>
      </SectionCard>

      <SectionCard icon={CheckCircle} title="Cookies We Use" accent="#7b61ff">
        <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          {[
            {
              name: 'forensic_token',
              type: 'Essential',
              purpose: 'Stores your authentication JWT token to keep you logged in across page refreshes.',
              duration: 'Session / 7 days',
              color: '#00d4ff',
            },
            {
              name: 'forensic_user',
              type: 'Essential',
              purpose: 'Stores basic user profile data (name, email, role) for UI display without additional API calls.',
              duration: 'Session / 7 days',
              color: '#00d4ff',
            },
            {
              name: 'forensicai-theme',
              type: 'Preference',
              purpose: 'Remembers your selected theme (dark/light mode) so it persists between visits.',
              duration: 'Persistent',
              color: '#7b61ff',
            },
          ].map((cookie, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)',
              padding: '14px 18px', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <code style={{ fontSize: '0.82rem', color: cookie.color, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4 }}>
                  {cookie.name}
                </code>
                <span style={{
                  fontSize: '0.7rem', padding: '2px 10px', borderRadius: 10,
                  background: `${cookie.color}15`, color: cookie.color,
                  border: `1px solid ${cookie.color}30`, fontWeight: 600,
                }}>
                  {cookie.type}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{cookie.purpose}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Duration: {cookie.duration}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Globe} title="Third-Party Cookies" accent="#00e676">
        <p>
          ForensicAI does <strong>not</strong> use any third-party tracking cookies, advertising cookies,
          or analytics cookies. We do not track your browsing activity across other websites. All data
          stored locally is strictly for platform functionality.
        </p>
      </SectionCard>

      <SectionCard icon={Lock} title="Managing Cookies" accent="#ffab40">
        <p>You can manage cookies through the following methods:</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          <ListItem><strong>Browser Settings</strong> — Use your browser's privacy settings to view, block, or delete cookies</ListItem>
          <ListItem><strong>Logout</strong> — Logging out removes your authentication token from local storage</ListItem>
          <ListItem><strong>Clear Site Data</strong> — Use your browser's "Clear site data" option to remove all ForensicAI data</ListItem>
        </ul>
        <div style={{
          background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 14,
          fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
          <span>Disabling essential cookies will prevent you from logging in and using the Platform.</span>
        </div>
      </SectionCard>

      <SectionCard>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;·&nbsp;
          For questions about this cookies policy, contact <Highlight>privacy@forensicai.dev</Highlight>
        </p>
      </SectionCard>
    </>
  )
}

// ─── Main Component ────────────────────────────────────────

export default function Legal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'about'

  const setTab = (tab) => setSearchParams({ tab })

  const contentMap = {
    about: <AboutContent />,
    privacy: <PrivacyContent />,
    terms: <TermsContent />,
    cookies: <CookiesContent />,
  }

  const titleMap = {
    about: 'About ForensicAI',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    cookies: 'Cookies Policy',
  }

  return (
    <motion.div
      className="page-enter"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 860, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={26} style={{ color: 'var(--accent-primary)' }} />
            {titleMap[activeTab]}
          </h1>
          <p className="page-description">
            {activeTab === 'about' && 'Learn about the ForensicAI platform, its capabilities, and the team behind it.'}
            {activeTab === 'privacy' && 'How we collect, use, store, and protect your data.'}
            {activeTab === 'terms' && 'Rules and conditions governing your use of the ForensicAI platform.'}
            {activeTab === 'cookies' && 'Information about cookies and local storage used by the platform.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
        padding: 4, border: '1px solid var(--border-primary)',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500, fontSize: '0.83rem',
                cursor: 'pointer', transition: 'all 0.2s',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {contentMap[activeTab]}
      </motion.div>
    </motion.div>
  )
}
