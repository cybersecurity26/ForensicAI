import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, KeyRound, LogOut, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sendLoggedInOtp, verifyLoggedInOtp } from '../api'

export default function EmailVerificationModal() {
  const { user, logout, updateUser } = useAuth()
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSendOtp = async () => {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await sendLoggedInOtp()
      if (res && res.message) {
        setInfo(res.message)
      }
      setOtpSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await verifyLoggedInOtp(otp)
      setSuccess(true)
      setTimeout(() => {
        updateUser(res.user, res.token)
      }, 1500)
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 8, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(135deg, rgba(16, 24, 48, 0.8) 0%, rgba(10, 15, 30, 0.95) 100%)',
          border: '1px solid rgba(0, 224, 255, 0.2)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(0, 224, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated accent gradient line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #00e0ff, #7c3aed, #00e0ff)',
          backgroundSize: '200% auto',
          animation: 'shimmer 3s linear infinite',
        }} />

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
            border: '2px solid rgba(0, 224, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Mail size={30} style={{ color: '#00e0ff' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Verify Your Email
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.5' }}>
            To secure your account and start using ForensicAI, please verify that <strong style={{ color: '#fff' }}>{user?.email}</strong> belongs to you.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <CheckCircle size={48} style={{ color: '#00e676', marginBottom: '12px' }} />
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>Email Verified Successfully!</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginTop: '4px' }}>
                Redirecting to dashboard...
              </p>
            </motion.div>
          ) : (
            <motion.div key="form">
              {error && (
                <div style={{
                  background: 'rgba(255, 82, 82, 0.12)',
                  border: '1px solid rgba(255, 82, 82, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ff8a80',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {info && (
                <div style={{
                  background: 'rgba(0, 224, 255, 0.1)',
                  border: '1px solid rgba(0, 224, 255, 0.35)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: '#00e0ff',
                  fontSize: '0.84rem',
                  lineHeight: '1.4',
                  marginBottom: '20px',
                }}>
                  <span>{info}</span>
                </div>
              )}

              {!otpSent ? (
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #00e0ff 0%, #00b0ff 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#050816',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(0, 224, 255, 0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send Verification OTP'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginBottom: '8px',
                    }}>
                      Verification Code
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255, 255, 255, 0.4)',
                      }}>
                        <KeyRound size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '1rem',
                          letterSpacing: '4px',
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        OTP is valid for 5 minutes
                      </span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00e0ff',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                    }}
                  >
                    {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Verify Code'}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 82, 82, 0.8)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 82, 82, 0.08)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <LogOut size={14} /> Log Out of Account
          </button>
        </div>
      </motion.div>
    </div>
  )
}
