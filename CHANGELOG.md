# Changelog

All notable changes to ForensicAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] — 2026-05-21

### Added

#### Threat Intelligence & Analysis
- **Threat Intelligence Service**: Integrated AbuseIPDB (IP reputation scoring) and VirusTotal (malware hash scanning) APIs for dynamic threat validation.
- **Threat Indicators (IOCs) Dashboard**: Centralized repository of all detected malicious IPs and file hashes across cases with text search, severity filters, origin case linkage, and copy-to-clipboard functionality.
- **Dynamic Connection Monitoring**: Added active API key state validation on the server `/api/health` with real-time green/orange status badges on the dashboard.
- **MITRE ATT&CK Mapper**: Rule-based correlation engine (`server/utils/attackMapper.js`) mapping forensic log patterns directly to standard attacker Tactics & Techniques.
- **MITRE ATT&CK Matrix**: Fully-animated visual grid showing Execution, Privilege Escalation, Credential Access, Defense Evasion, Discovery, Command & Control, and Exfiltration.

#### AI-Powered Investigation Copilot
- **Case Chat RAG Copilot**: Interactive chatbot letting investigators ask natural language questions about logs within a specific case.
- **Context-Ranked RAG Retrieval**: Leverages local keyword scoring and severity-based boosting to fetch the top 25 most relevant evidence logs as prompt context.
- **Evidence Citation Cards**: Detailed references showing the originating log line, timestamp, severity, mapped MITRE technique, and threat intelligence scores with interactive popups.

#### Platform Improvements
- **Expanded Dashboard Stats**: Integrated real-time counts of detected Threat Indicators (IOCs) and Critical Threat Flags directly on the main dashboard stats grid.
- **AI & Threat Intel Settings**: Expanded settings tab to allow dynamic key management for AbuseIPDB and VirusTotal, custom threat severity threshold adjustments, and RAG context limit configuration.
- **Compacted Legal Policies**: Re-synchronized and compacted Privacy, Terms, and Cookies policies in Legal.jsx to accurately reflect third-party Threat Intel integrations and LLM data handling.
- **Mobile Responsive Design**: Fully responsive navigation layout with collapsible sidebar overlay, hamburger menu, and responsive grids.
- **CI/CD Integration**: Configured GitHub Actions workflows for continuous build testing, security auditing, and CodeQL static analysis.

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

[1.0.2]: https://github.com/cybersecurity26/ForensicAI/releases/tag/v1.0.2
[1.0.0]: https://github.com/cybersecurity26/ForensicAI/releases/tag/v1.0.0
