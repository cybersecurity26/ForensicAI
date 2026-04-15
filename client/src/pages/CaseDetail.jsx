import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Upload, Clock, Shield, Hash,
  Download, Eye, Trash2, CheckCircle, AlertTriangle,
  Brain, Edit3, Save, X, Loader, User, RefreshCw
} from 'lucide-react'
import { getCase, updateCase, getTimeline, getReports, getAuditLogs, generateReport, parseAllEvidence } from '../api'

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('evidence')
  const [loading, setLoading] = useState(true)
  const [caseData, setCaseData] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [timelineData, setTimelineData] = useState(null)
  const [reports, setReports] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [reparsing, setReparsing] = useState(false)
  const [toast, setToast] = useState('')

  // Editable fields
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState('')
  const [editAssignee, setEditAssignee] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // Fetch case detail
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const c = await getCase(id)
        setCaseData(c)
        setEvidence(c.evidence || [])
        setEditTitle(c.title)
        setEditDesc(c.description || '')
        setEditStatus(c.status)
        setEditPriority(c.priority)
        setEditAssignee(c.assigneeName || '')
        // Use populated reports from case (instant, no extra API call)
        if (c.reports && c.reports.length > 0) setReports(c.reports)
      } catch (err) {
        console.error('Failed to load case:', err)
        setCaseData(null)
      }
      setLoading(false)
    }
    fetchAll()
  }, [id])

  // Fetch tab-specific data
  useEffect(() => {
    if (!caseData) return
    if (activeTab === 'timeline') {
      getTimeline(id).then(d => setTimelineData(d))
        .catch(() => setTimelineData(null))
    } else if (activeTab === 'reports') {
      getReports({ caseId: id }).then(d => setReports(d.reports || d || []))
        .catch(() => setReports([]))
    } else if (activeTab === 'audit') {
      getAuditLogs({ entityId: id, limit: 20 }).then(d => setAuditLogs(d.logs || d || []))
        .catch(() => setAuditLogs([]))
    }
  }, [activeTab, caseData, id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateCase(id, {
        title: editTitle, description: editDesc,
        status: editStatus, priority: editPriority,
        assigneeName: editAssignee,
      })
      setCaseData(updated)
      setEditing(false)
      showToast('Case updated successfully')
    } catch (err) { showToast('Error: ' + err.message) }
    setSaving(false)
  }

  const handleAiAnalyze = async () => {
    setAnalyzing(true)
    try {
      await generateReport(id)
      showToast('AI analysis started — check Reports tab')
      setActiveTab('reports')
      getReports({ caseId: id }).then(d => setReports(d.reports || d || []))
    } catch (err) { showToast('Error: ' + err.message) }
    setAnalyzing(false)
  }

  const handleReparse = async () => {
    setReparsing(true)
    try {
      const result = await parseAllEvidence(id)
      showToast(`✅ Re-parsed ${result.parsed} file(s) — timeline updated`)
      // Refresh case data to get updated event counts
      const c = await getCase(id)
      setEvidence(c.evidence || [])
      // Refresh timeline if on that tab
      getTimeline(id).then(d => setTimelineData(d))
        .catch(() => {})
    } catch (err) { showToast('Error: ' + err.message) }
    setReparsing(false)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
  const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
    return (bytes / 1073741824).toFixed(1) + ' GB'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: 'var(--text-muted)', gap: 10 }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading case...
      </div>
    )
  }

  if (!caseData) {
    return (
      <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Cases
        </Link>
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div className="empty-state-icon"><AlertTriangle size={32} /></div>
          <div className="empty-state-title">Case Not Found</div>
          <div className="empty-state-text">The case you're looking for doesn't exist or couldn't be loaded.</div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="page-enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.startsWith('Error') ? 'rgba(255,82,82,0.95)' : 'rgba(0,230,118,0.95)',
          color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <CheckCircle size={16} /> {toast}
        </motion.div>
      )}

      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Cases
        </Link>
      </div>

      {/* Case Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
              {caseData.caseNumber || caseData._id}
            </span>
            {editing ? (
              <select className="form-select" style={{ width: 120, padding: '2px 8px', fontSize: '0.8rem' }}
                value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="review">Review</option>
                <option value="closed">Closed</option>
              </select>
            ) : (
              <span className={`status-badge ${caseData.status}`}>{caseData.status}</span>
            )}
            {editing ? (
              <select className="form-select" style={{ width: 110, padding: '2px 8px', fontSize: '0.8rem' }}
                value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : (
              <span className={`tag ${caseData.priority === 'critical' ? 'cyan' : caseData.priority === 'high' ? 'purple' : ''}`}>
                {caseData.priority}
              </span>
            )}
          </div>
          {editing ? (
            <>
              <input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }} />
              <textarea className="form-input" value={editDesc} onChange={e => setEditDesc(e.target.value)}
                rows={3} style={{ fontSize: '0.88rem' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Assignee</label>
                  <input className="form-input" value={editAssignee} onChange={e => setEditAssignee(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 8 }}>{caseData.title}</h1>
              <p className="page-description">{caseData.description || 'No description provided.'}</p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span><User size={12} style={{ marginRight: 4 }} />{caseData.assigneeName || 'Unassigned'}</span>
                <span><Clock size={12} style={{ marginRight: 4 }} />Created {formatDate(caseData.createdAt)}</span>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}><X size={15} /> Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}><Edit3 size={15} /> Edit</button>
              {reports.length > 0 && (
                <Link to={`/reports/${reports[0]._id}`} className="btn btn-secondary">
                  <FileText size={15} /> View Report
                </Link>
              )}
              <button className="btn btn-primary" onClick={handleAiAnalyze} disabled={analyzing}>
                {analyzing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={15} />} AI Analyze
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { icon: Upload, label: 'Evidence Files', value: evidence.length, color: 'cyan' },
          { icon: Shield, label: 'Verified', value: evidence.filter(e => e.status === 'verified').length, color: 'green' },
          { icon: Clock, label: 'Created', value: formatDate(caseData.createdAt), color: 'purple' },
          { icon: FileText, label: 'Reports', value: reports.length || '—', color: 'red' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div className="glow-card" key={i}>
              <div className="glow-card-inner" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`stat-card-icon ${s.color}`} style={{ width: 38, height: 38, marginBottom: 0 }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['evidence', 'timeline', 'reports', 'audit'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Evidence Tab */}
      {activeTab === 'evidence' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">Evidence Files ({evidence.length})</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleReparse}
                disabled={reparsing}
                title="Re-parse all evidence files to extract timeline events"
              >
                {reparsing
                  ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <RefreshCw size={14} />}
                {reparsing ? 'Re-parsing...' : 'Re-parse All'}
              </button>
              <Link to="/evidence" className="btn btn-primary btn-sm"><Upload size={14} /> Upload Evidence</Link>
            </div>
          </div>
          {evidence.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Upload size={32} /></div>
              <div className="empty-state-title">No Evidence Yet</div>
              <div className="empty-state-text">Upload evidence files to begin the investigation.</div>
              <Link to="/evidence" className="btn btn-primary"><Upload size={16} /> Upload Evidence</Link>
            </div>
          ) : (
            <div className="file-list">
              {evidence.map((file, i) => (
                <div className="file-item" key={file._id || i}>
                  <div className={`file-icon ${(file.fileType || '').split('/')[1] || 'log'}`}>
                    <FileText size={18} />
                  </div>
                  <div className="file-info">
                    <div className="file-name">{file.originalName || file.fileName || 'Unknown file'}</div>
                    <div className="file-meta">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDateTime(file.createdAt || file.uploadedAt)}</span>
                    </div>
                  </div>
                  {file.sha256Hash && (
                    <div className="hash-badge">
                      <Hash size={14} />
                      SHA-256: {file.sha256Hash.slice(0, 16)}...{file.sha256Hash.slice(-4)}
                    </div>
                  )}
                  <span className={`status-badge ${file.status === 'verified' || file.status === 'parsed' ? 'active' : 'pending'}`}>
                    {file.status === 'verified' || file.status === 'parsed'
                      ? <><CheckCircle size={10} /> Verified</>
                      : <><AlertTriangle size={10} /> {file.status || 'Pending'}</>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'timeline' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">Event Timeline ({timelineData?.totalEvents || 0} events)</div>
          </div>
          {!timelineData || !timelineData.dateGroups || timelineData.dateGroups.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Clock size={32} /></div>
              <div className="empty-state-title">No Timeline Events</div>
              <div className="empty-state-text">Upload and parse evidence, then click "Re-parse All" to reconstruct the timeline.</div>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 32, marginTop: 12 }}>
              {/* Vertical timeline line */}
              <div style={{
                position: 'absolute', left: 12, top: 0, bottom: 0,
                width: 2, background: 'linear-gradient(180deg, var(--accent-primary), var(--accent-secondary), transparent)',
              }} />

              {timelineData.dateGroups.map((group, gi) => (
                <div key={gi} style={{ marginBottom: 28 }}>
                  {/* Date header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--bg-card)', border: '2px solid var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'absolute', left: -20,
                    }}>
                      <Clock size={11} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div style={{ marginLeft: 18 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700,
                        color: 'var(--text-primary)', background: 'var(--bg-card)',
                        padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-primary)',
                      }}>{group.date}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                        {group.eventCount} event{group.eventCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Events in this date group */}
                  {group.events.map((event, ei) => {
                    const sev = event.severity || 'info'
                    const sevColors = {
                      critical: { bg: 'rgba(255,82,82,0.08)', text: '#ff5252', border: 'rgba(255,82,82,0.2)' },
                      danger: { bg: 'rgba(255,82,82,0.06)', text: 'var(--accent-danger)', border: 'rgba(255,82,82,0.15)' },
                      warning: { bg: 'rgba(255,171,64,0.06)', text: 'var(--accent-warning)', border: 'rgba(255,171,64,0.15)' },
                      info: { bg: 'rgba(0,212,255,0.06)', text: 'var(--accent-primary)', border: 'rgba(0,212,255,0.15)' },
                    }
                    const colors = sevColors[sev] || sevColors.info
                    const ts = event.timestamp ? String(event.timestamp).trim() : ''
                    const timeDisplay = ts.includes(' ') ? ts.split(' ')[1]?.substring(0, 8) : ts.substring(11, 19) || ''
                    return (
                      <motion.div
                        key={ei}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ei * 0.03 }}
                        style={{
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          marginBottom: 8,
                          marginLeft: 18,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Shield size={13} style={{ color: colors.text }} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {event.detail || event.eventType || 'Event'}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.7rem', color: colors.text, fontFamily: 'var(--font-mono)',
                            background: colors.bg, padding: '2px 8px', borderRadius: 4,
                            border: `1px solid ${colors.border}`,
                          }}>{sev}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {timeDisplay && <span><Clock size={11} style={{ marginRight: 3 }} />{timeDisplay}</span>}
                          {event.source && <span style={{ fontFamily: 'var(--font-mono)' }}>{event.source}</span>}
                          {event.evidenceName && <span style={{ opacity: 0.7 }}>{event.evidenceName}</span>}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header">
            <div className="section-title">Reports</div>
            <button className="btn btn-primary btn-sm" onClick={handleAiAnalyze} disabled={analyzing}>
              {analyzing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={14} />}
              Generate Report
            </button>
          </div>
          {reports.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><FileText size={32} /></div>
              <div className="empty-state-title">No Reports Yet</div>
              <div className="empty-state-text">Click "AI Analyze" or "Generate Report" to create a forensic report from the evidence.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {(Array.isArray(reports) ? reports : []).map((report) => (
                <div className="glow-card" key={report._id} onClick={() => navigate(`/reports/${report._id}`)} style={{ cursor: 'pointer' }}>
                  <div className="glow-card-inner" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: 4 }}>
                        {report.reportNumber || report._id}
                      </div>
                      <div style={{ fontWeight: 600 }}>{report.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(report.createdAt)} · {report.sections?.length || 0} sections
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                      <Eye size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {auditLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Shield size={32} /></div>
              <div className="empty-state-title">No Audit Logs</div>
              <div className="empty-state-text">Actions on this case will appear here.</div>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={log._id || i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(log.createdAt || log.timestamp)}
                      </td>
                      <td><span className="tag">{log.action}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.description || log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
