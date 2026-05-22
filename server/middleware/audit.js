import AuditLog from '../models/AuditLog.js'
import User from '../models/User.js'
import { sendNotificationMail } from '../services/mailService.js'

const actionToPref = {
  case_created: 'notifCaseUpdates',
  case_updated: 'notifCaseUpdates',
  case_closed: 'notifCaseUpdates',
  case_shared: 'notifCaseUpdates',
  case_share_revoked: 'notifCaseUpdates',
  case_chat_queried: 'notifCaseUpdates',
  migration_run: 'notifCaseUpdates',
  
  evidence_uploaded: 'notifEvidenceProcessing',
  evidence_parsed: 'notifEvidenceProcessing',
  
  report_generated: 'notifAiReports',
  report_edited: 'notifAiReports',
  report_reviewed: 'notifAiReports',
  report_approved: 'notifAiReports',
  report_exported: 'notifAiReports',
  ai_summary_generated: 'notifAiReports',
  ai_findings_generated: 'notifAiReports',
  ai_section_generated: 'notifAiReports',
  
  evidence_verified: 'notifIntegrityAlerts',
  evidence_hash_check: 'notifIntegrityAlerts',
  
  user_created: 'notifSecurityEvents',
  user_login: 'notifSecurityEvents',
  user_login_2fa: 'notifSecurityEvents',
  passkey_registered: 'notifSecurityEvents',
  passkey_removed: 'notifSecurityEvents',
  profile_updated: 'notifSecurityEvents',
  password_changed: 'notifSecurityEvents',
  security_updated: 'notifSecurityEvents',
  ai_config_updated: 'notifSecurityEvents',
  notifications_updated: 'notifSecurityEvents',
}

export async function logAudit(action, entityType, entityId, details, req = null) {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      details,
      userId: req?.user?.id || null,
      userName: req?.user?.name || 'System',
      ipAddress: req?.ip || 'internal',
      userAgent: req?.get('User-Agent') || 'server',
    })

    // Asynchronously send email notification if preferences align
    const userId = req?.user?.id
    if (userId) {
      const prefKey = actionToPref[action]
      if (prefKey) {
        User.findById(userId).then(user => {
          if (user && user.isEmailVerified && user.settings && user.settings[prefKey]) {
            const title = `Notification: ${action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
            sendNotificationMail(
              user.email,
              title,
              details || `The action "${action}" was logged.`,
              action,
              details
            ).catch(err => console.error('Notification send error:', err.message))
          }
        }).catch(err => console.error('User fetch audit notification error:', err.message))
      }
    }
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}
