# ForensicAI — New Features Briefing (v1.0.2)
*Internal Team Documentation & Architecture Reference*

---

## Executive Summary
This document provides a detailed breakdown of the new features introduced in **ForensicAI v1.0.2**. These features are designed to transition the platform from a simple log parser and reporter to a **comprehensive Threat Intelligence and AI-Assisted Digital Forensics (DFIR) platform**.

---

## 1. MITRE ATT&CK Matrix Mapping

### Use & Description
The MITRE ATT&CK Mapping feature automatically correlates parsed log events directly to standardized adversary Tactics and Techniques. On the frontend, investigators are presented with an interactive, animated grid displaying active threat columns (such as Execution, Privilege Escalation, Credential Access, Defense Evasion, Discovery, Command & Control, and Exfiltration) which highlight and glow when matching activities are detected in log files.

### Purpose & Why We Added It
- **Framework Alignment**: Security operations teams and incident responders map attacks to the MITRE ATT&CK framework to standardize reports and analyze attacker coverage.
- **Immediate Triage**: Instead of manually reading line-by-line to identify what stage an attacker is in, the matrix visually maps out the attack progression immediately upon log upload.

### Tools & Platforms Used
- **Backend Rule Mapper (`server/utils/attackMapper.js`)**: A rule-based pattern matching engine that matches regexes to standard techniques:
  - **T1110 (Brute Force)**: Matches "failed password" or "logon failure".
  - **T1078 (Valid Accounts)**: Matches "accepted password" or "successful logon".
  - **T1548.001 (Sudo/Su Abuse)**: Matches elevated privilege execution commands.
  - **T1033/T1046 (Discovery)**: Matches reconnaissance utilities like `whoami`, `nmap`, or `netstat`.
  - **T1105 (Ingress Tool Transfer)**: Matches fetch commands like `wget` or `curl`.
  - **T1041 (Exfiltration)**: Matches data exfiltration events.
- **Frontend Matrix View (`client/src/pages/MitreAttack.jsx`)**: Responsive CSS-grid based matrix with dynamic glow states and interactive technique details.

---

## 2. Threat Intelligence Integration (AbuseIPDB & VirusTotal)

### Use & Description
ForensicAI now dynamically connects to AbuseIPDB and VirusTotal to check the reputation of IP addresses and file hashes extracted during log parsing:
- **IP Reputation**: Checks AbuseIPDB for abuse confidence scores, domain names, and classification reports.
- **File Hashing**: Queries VirusTotal for file hashes (SHA-256/MD5) to check malicious engine vote counts.
- **Dynamic Configuration Badge**: Dashboards now check API key configurations on server start, displaying green (active/connected) or orange (offline/simulator fallback) badges.

### Purpose & Why We Added It
- **Enriched Log Context**: IP addresses and file hashes in logs are meaningless without reputation. Integrating third-party APIs flags known malicious IP addresses (e.g., botnet hosts) or file hashes (e.g., malware droppers) automatically.
- **Offline / Zero-Config Simulator**: Allows the system to operate and mock threat detections even if external API credentials aren't configured yet.

### Tools & Platforms Used
- **AbuseIPDB API**: Live IP reputation scores.
- **VirusTotal API**: Antivirus reputation analysis.
- **Axios / Node HTTPS client**: Handles async REST API request pools.
- **Fallback Simulation Engine (`server/services/threatIntelService.js`)**: Generates deterministic risk scores based on traffic frequency metrics when API keys are not supplied.

---

## 3. Threat Indicators (IOCs) Dashboard

### Use & Description
The Indicators of Compromise (IOCs) Dashboard is a centralized, repository-wide board displaying all identified malicious threat indicators (IPs and file hashes) across all uploaded cases.

### Purpose & Why We Added It
- **Correlative Threat Hunting**: Investigators often need to find if an IP address detected in Case A is also active in Case B. The IOC Dashboard aggregates all threats globally.
- **Actionable Workflow**: Features text searches, filter tags, severity badges, and direct links to navigate to the originating case detail or copy the IOC value instantly to the clipboard.

### Tools & Platforms Used
- **MongoDB Aggregation (`server/routes/dashboard.js`)**: Executes fast collection groupings to extract parsed events matching threat criteria.
- **UI Components (`client/src/pages/ThreatIocs.jsx`)**: Designed with search filters, interactive detail modals, and copy-helper hooks.

---

## 4. Case Chat RAG Copilot

### Use & Description
The Case Chat Copilot is an interactive chatbot that allows investigators to converse directly with their case evidence files in natural language (e.g., *"Show me all successful logins from IP 192.168.1.50"* or *"Are there any signs of directory scanning?"*).

### Purpose & Why We Added It
- **Eliminate Log Drown**: Investigators spend hours filtering and querying database logs. The RAG Copilot acts as a digital assistant that fetches and summarizes log lines instantly.
- **Traceable AI (Human-in-the-Loop)**: Unlike general chatbots that hallucinate, this copilot provides interactive **citation cards** that map back to the exact log file line number and timestamp.

### Tools & Platforms Used
- **Retrieval-Augmented Generation (RAG)**:
  1. Tokenizes the user's chat query.
  2. Runs a local search algorithm on log events.
  3. Scores and ranks logs based on severity and keyword frequency.
  4. Feeds the top 25 context logs to the LLM.
- **Multi-LLM Service (`server/services/aiService.js`)**: Dynamically uses the configured LLM API (Mistral, Gemini, or OpenAI) to synthesize answers based on retrieved context.
- **UI Layout (`client/src/pages/CaseChat.jsx`)**: Implements streaming-style messages, citations popups, and quick-prompt chips.

---

## 5. Technical Stack & Environment Configurations

To enable live threat reputation lookups and the Case Chat RAG Copilot, ensure the following environment variables are defined in the server's `.env` configuration file:

```ini
# AI Configuration (OpenAI, Gemini, or Mistral)
AI_PROVIDER=openai             # Choices: openai, gemini, mistral
AI_API_KEY=your_api_key_here
AI_MODEL=gpt-4o                # Or gemini-1.5-pro, mistral-small-latest

# Threat Intelligence API Keys (Optional)
ABUSEIPDB_API_KEY=your_abuseipdb_key
VIRUSTOTAL_API_KEY=your_virustotal_key
```

> [!NOTE]
> If AbuseIPDB or VirusTotal API keys are omitted, the server dynamically switches to a local simulation mode. The dashboard will show an **Orange Badge** indicating simulation fallback, while configuring valid keys triggers the **Green Badge** indicating live mode.

---

*ForensicAI v1.0.2 — Internal Release Briefing Document*
