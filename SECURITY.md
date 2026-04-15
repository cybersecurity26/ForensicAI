# Security Policy

## Overview

ForensicAI is a digital forensics platform handling sensitive evidence and investigation data. Security is paramount to maintaining the integrity, confidentiality, and availability of forensic data. This document outlines our security policies and procedures.

## Reporting Security Vulnerabilities

We take security vulnerabilities seriously. If you discover a security vulnerability in ForensicAI, **please do not open a public GitHub issue**. Instead, follow these steps:

### Responsible Disclosure Process

1. **Report to Maintainers:** Email your security concern to **security@forensicai.dev** with:
   - A detailed description of the vulnerability
   - Steps to reproduce (if applicable)
   - Potential impact and severity assessment
   - Your contact information

2. **Include Details:**
   - Affected component(s) or file(s)
   - Vulnerability type (e.g., XSS, SQL injection, authentication bypass, etc.)
   - Proof of concept or evidence of the issue
   - Suggested fix (if available)

3. **Response Timeline:**
   - Initial acknowledgment: Within 48 hours
   - Investigation and assessment: Within 7 days
   - Security update release: As soon as feasible (typically within 30 days for critical issues)
   - Public disclosure: 90 days after patch release (coordinated disclosure)

4. **No Retaliation:** We will not pursue legal action against researchers who report vulnerabilities in good faith and follow this policy.

## Security Best Practices

### For Contributors

- **Input Validation:** Always validate and sanitize user input on both client and server
- **Authentication:** Use JWT tokens securely; never hardcode credentials
- **Authorization:** Implement role-based access control (RBAC) consistently
- **HTTPS Only:** All API communications must use HTTPS in production
- **Secrets Management:** Use environment variables (.env) for API keys, database URIs, and secrets
- **Dependency Updates:** Keep dependencies current and monitor for known vulnerabilities
- **Code Review:** All code changes require review before merging to main

### For Deployment

- **Environment Variables:** Never commit .env files; use .env.example as a template
- **Database Security:**
  - Enable MongoDB authentication
  - Use strong, unique passwords
  - Implement IP whitelisting if possible
  - Regular backups of forensic data
  - Encryption at rest for sensitive data

- **API Security:**
  - Enable rate limiting (express-rate-limit)
  - Use security headers (helmet)
  - Implement CORS correctly
  - Add request validation and sanitization
  - Monitor for suspicious activity

- **Session Management:**
  - Set secure and HTTP-only flags on cookies
  - Implement session timeouts
  - Force re-authentication for sensitive operations
  - Clear sessions on logout

- **Evidence & Data Protection:**
  - Maintain chain of custody integrity
  - Encrypt evidence files at rest
  - Log all access to evidence and case data
  - Implement audit trails for all operations
  - Use SHA-256 hashing for file integrity verification

### For Users

- **Strong Passwords:** Use complex, unique passwords (minimum 12 characters)
- **Two-Factor Authentication:** Enable 2FA or WebAuthn passkeys when available
- **Account Security:** Never share credentials; report suspicious activity immediately
- **Update Software:** Keep your browser and OS updated with security patches
- **HTTPS:** Always access ForensicAI over HTTPS; avoid public Wi-Fi for sensitive work
- **Evidence Handling:** Follow chain of custody procedures; maintain evidence integrity

## Security Features

### Authentication & Authorization
- JWT (JSON Web Tokens) for stateless authentication
- TOTP-based two-factor authentication (2FA)
- WebAuthn passkey support for passwordless authentication
- Role-based access control (RBAC): Admin, Analyst, Viewer, Investigator

### Data Protection
- SHA-256 hashing for file integrity verification
- Password hashing with bcryptjs
- HTTPS/TLS encryption for data in transit
- Environment-based configuration for sensitive data
- Audit logging of all user actions

### API Security
- Rate limiting to prevent brute force attacks
- Security headers (Helmet middleware)
- Input validation and sanitization
- CORS configuration
- Centralized error handling (no sensitive info in error messages)

### Infrastructure
- Secure environment variable management
- MongoDB authentication enabled
- File upload restrictions (size, type, virus scanning recommended)
- Regular dependency updates and vulnerability scanning

## Compliance & Standards

ForensicAI aims to comply with:
- **NIST Cybersecurity Framework** for forensic operations
- **ISO/IEC 27001** information security standards
- **Legal and regulatory requirements** for digital forensics in your jurisdiction
- **Chain of Custody requirements** for forensic evidence
- **GDPR** for personal data handling (if applicable)
- **OWASP Top 10** security guidelines

## Security Maintenance

### Regular Updates
- Monitor and apply security patches promptly
- Update dependencies regularly using npm audit
- Review security advisories for Node.js, React, and MongoDB
- Test updates in a staging environment before production

### Dependency Management
- Use npm audit to identify vulnerabilities
- Review package.json regularly for outdated packages
- Pin critical dependencies to prevent unexpected changes
- Remove unused dependencies

### Monitoring
- Monitor logs for suspicious activity
- Set up alerts for failed authentication attempts
- Track API usage patterns
- Monitor database query performance and errors

## Incident Response

In case of a confirmed security breach:

1. **Immediate Actions:**
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify affected users
   - Contact law enforcement if necessary

2. **Investigation:**
   - Determine scope and impact
   - Identify root cause
   - Document findings

3. **Remediation:**
   - Patch the vulnerability
   - Update all instances
   - Reset compromised credentials
   - Implement preventive measures

4. **Communication:**
   - Provide transparent updates to users
   - Document lessons learned
   - Update security policies as needed

## Third-Party Security

- **AI Providers:** Ensure API keys are stored securely; review provider security practices
- **Dependencies:** Regularly audit third-party libraries for vulnerabilities
- **Services:** Verify security certifications of external services (MongoDB Atlas, etc.)

## Testing & Validation

- Conduct regular security audits
- Perform penetration testing annually
- Use static code analysis tools
- Implement SAST (Static Application Security Testing)
- Test authentication and authorization thoroughly
- Validate file upload handling

## Contact

For security-related inquiries:
- **Email:** security@forensicai.dev
- **Issues:** Use responsible disclosure (see above)
- **General Questions:** security-questions@forensicai.dev

---

**Last Updated:** April 15, 2026

By contributing to or using ForensicAI, you acknowledge the importance of security and agree to follow these guidelines.