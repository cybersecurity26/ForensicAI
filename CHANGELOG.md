# Changelog

All notable changes to ForensicAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-15

### 🎉 Initial Release

The first stable release of ForensicAI — an AI-powered digital forensics investigation platform.

### Added

#### Investigation Core
- Case Management with CRUD operations, auto case numbering (`FR-YYYY-XXXX`), status tracking, and priority levels
- Evidence Upload with drag-and-drop supporting LOG, CSV, JSON, TXT, XML formats
- SHA-256 integrity hashing on every upload for chain-of-custody verification
- Evidence file parsing with automatic format detection and event extraction
- Timeline Reconstruction with date grouping, severity classification, and multi-source correlation

#### AI-Powered Analysis
- Automated forensic report generation with customizable sections (Executive Summary, Key Findings, Timeline, Recommendations)
- Multi-provider AI support: OpenAI (GPT-4), Google Gemini, Mistral AI
- Inline markdown editing toolbar for each report section
- PDF export for finalized reports
- AI provider configuration via Settings page

#### Security & Authentication
- JWT-based authentication with token expiry
- User registration and login with email/password
- Two-Factor Authentication (TOTP) via authenticator apps
- WebAuthn/FIDO2 passkey support for passwordless login
- Role-Based Access Control: Admin, Analyst, Investigator, Viewer
- Password change functionality with current password verification

#### Platform Features
- Interactive Dashboard with case activity area chart and evidence type distribution pie chart
- Real-time Activity Feed with dynamic user initials
- Global Search across cases, reports, and evidence with categorized results and debounced API queries
- Real-time Notifications with bell chime sound (Web Audio API) and localStorage read persistence
- Dark/Light theme toggle with localStorage persistence
- Comprehensive audit logging for all user actions
- Legal pages: About, Privacy Policy, Terms of Use, Cookies Policy
- Settings page: Profile, Security, AI Configuration, Notification Preferences
- Help & FAQ dropdown in header

#### Deployment & SEO
- Frontend deployed on Vercel (`forensicai-app.vercel.app`)
- Backend deployed on Render
- Database on MongoDB Atlas
- SEO: sitemap.xml, robots.txt, Open Graph, Twitter Cards, JSON-LD structured data
- Google Search Console verification

#### Documentation
- README.md with full setup guide
- CONTRIBUTING.md with development guidelines
- CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- SECURITY.md with vulnerability disclosure policy
- API.md with endpoint documentation
- ForensicAI_SRS.md (Software Requirements Specification)
- MIT License

---

[1.0.0]: https://github.com/cybersecurity26/ForensicAI/releases/tag/v1.0.0
