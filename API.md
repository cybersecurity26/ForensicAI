# 📡 ForensicAI — API Documentation

Base URL: `https://forensicai-api.onrender.com/api` (production) | `http://localhost:5000/api` (local)

All protected endpoints require the `Authorization: Bearer <token>` header.

---

## 🔐 Authentication

### POST `/auth/register`
Create a new user account.

**Body:**
```json
{
  "name": "Tirukoti Vinay",
  "email": "vinay@example.com",
  "password": "SecurePass123",
  "role": "investigator"
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "Tirukoti Vinay", "email": "vinay@example.com", "role": "investigator" }
}
```

---

### POST `/auth/login`
Authenticate and receive a JWT token.

**Body:**
```json
{
  "email": "vinay@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "Tirukoti Vinay", "email": "vinay@example.com", "role": "investigator" },
  "requires2FA": false
}
```

---

### POST `/auth/verify-2fa`
Verify TOTP code during 2FA login.

**Body:**
```json
{
  "userId": "...",
  "code": "123456"
}
```

---

### POST `/auth/setup-2fa`
Generate 2FA secret and QR code. 🔒 **Requires Auth**

**Response:** `200 OK`
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/ForensicAI:vinay@example.com?..."
}
```

---

### POST `/auth/enable-2fa`
Enable 2FA after verifying a code. 🔒 **Requires Auth**

**Body:**
```json
{
  "code": "123456"
}
```

---

## 📁 Cases

### GET `/cases`
List all cases. 🔒 **Requires Auth**

**Query Params:** `?status=active&priority=high&search=network&sort=-createdAt`

**Response:** `200 OK`
```json
{
  "cases": [
    {
      "_id": "...",
      "caseNumber": "FR-2026-0024",
      "title": "Network Intrusion Investigation",
      "description": "...",
      "status": "active",
      "priority": "high",
      "createdBy": { "name": "Tirukoti Vinay" },
      "evidenceCount": 3,
      "createdAt": "2026-04-10T..."
    }
  ],
  "total": 2
}
```

---

### POST `/cases`
Create a new case. 🔒 **Requires Auth**

**Body:**
```json
{
  "title": "Network Intrusion Investigation",
  "description": "Suspicious activity detected on server alpha",
  "priority": "high"
}
```

**Response:** `201 Created`

---

### GET `/cases/:id`
Get case details. 🔒 **Requires Auth**

---

### PUT `/cases/:id`
Update a case. 🔒 **Requires Auth**

**Body:**
```json
{
  "status": "closed",
  "priority": "medium",
  "notes": "Investigation complete."
}
```

---

### DELETE `/cases/:id`
Delete a case. 🔒 **Requires Auth (Admin)**

---

## 📤 Evidence

### POST `/evidence/upload`
Upload evidence files. 🔒 **Requires Auth**

**Form Data (multipart):**
| Field | Type | Description |
|---|---|---|
| `files` | File[] | Evidence files (max 5GB each) |
| `caseId` | String | Associated case ID |

**Response:** `201 Created`
```json
{
  "evidence": [
    {
      "_id": "...",
      "originalName": "server_alpha.log",
      "fileSize": 245890,
      "mimeType": "text/plain",
      "hash": "sha256:a1b2c3d4...",
      "status": "uploaded",
      "caseId": "..."
    }
  ]
}
```

---

### POST `/evidence/:id/parse`
Parse an evidence file and extract events. 🔒 **Requires Auth**

**Response:** `200 OK`
```json
{
  "message": "Parsed successfully",
  "eventCount": 142,
  "evidence": { "status": "parsed", "parsedData": { ... } }
}
```

---

### POST `/evidence/:id/verify`
Re-verify SHA-256 hash integrity. 🔒 **Requires Auth**

**Response:** `200 OK`
```json
{
  "match": true,
  "originalHash": "sha256:a1b2c3d4...",
  "currentHash": "sha256:a1b2c3d4..."
}
```

---

### GET `/evidence/case/:caseId`
List all evidence for a case. 🔒 **Requires Auth**

---

## ⏱️ Timeline

### GET `/timeline/:caseId`
Get reconstructed timeline for a case. 🔒 **Requires Auth**

**Response:** `200 OK`
```json
{
  "timeline": {
    "caseId": "...",
    "dateGroups": [
      {
        "date": "2026-04-10",
        "events": [
          {
            "timestamp": "2026-04-10T14:23:00Z",
            "type": "network",
            "severity": "high",
            "source": "server_alpha.log",
            "detail": "Unauthorized SSH connection from 192.168.1.105"
          }
        ]
      }
    ]
  }
}
```

---

## 📄 Reports

### GET `/reports`
List all reports. 🔒 **Requires Auth**

---

### POST `/reports/generate`
Generate an AI-powered forensic report. 🔒 **Requires Auth**

**Body:**
```json
{
  "caseId": "...",
  "title": "Network Intrusion Report"
}
```

**Response:** `201 Created`
```json
{
  "report": {
    "_id": "...",
    "reportNumber": "FR-2026-0024-R1",
    "title": "Network Intrusion Report",
    "sections": [
      { "title": "Executive Summary", "content": "...", "aiGenerated": true },
      { "title": "Key Findings", "content": "...", "aiGenerated": true },
      { "title": "Timeline of Events", "content": "...", "aiGenerated": true },
      { "title": "Recommendations", "content": "...", "aiGenerated": true }
    ],
    "status": "draft"
  }
}
```

---

### GET `/reports/:id`
Get report details. 🔒 **Requires Auth**

---

### PUT `/reports/:id`
Update report sections. 🔒 **Requires Auth**

**Body:**
```json
{
  "sections": [
    { "title": "Executive Summary", "content": "Updated content here..." }
  ],
  "status": "final"
}
```

---

## 📊 Dashboard

### GET `/dashboard/stats`
Get dashboard statistics. 🔒 **Optional Auth**

**Response:** `200 OK`
```json
{
  "stats": {
    "activeCases": 2,
    "totalEvidence": 9,
    "reportsGenerated": 3,
    "integrityAlerts": 0
  },
  "caseActivity": [...],
  "evidenceTypes": [
    { "name": "TXT", "value": 4, "color": "#00e676" },
    { "name": "LOG", "value": 3, "color": "#00d4ff" },
    { "name": "CSV", "value": 2, "color": "#ff6b9d" }
  ]
}
```

---

### GET `/dashboard/activity`
Get recent activity feed. 🔒 **Optional Auth**

---

### GET `/dashboard/notifications`
Get notification list from audit logs. 🔒 **Optional Auth**

---

### GET `/dashboard/search?q=query`
Global search across cases, reports, evidence. 🔒 **Optional Auth**

**Query:** `?q=network` (min 2 characters)

**Response:** `200 OK`
```json
{
  "results": [
    { "label": "FR-2026-0024 — Network Intrusion", "path": "/cases/...", "category": "Case" },
    { "label": "server_alpha.log", "path": "/cases/...", "category": "Evidence" }
  ]
}
```

---

## ⚙️ Settings

### PUT `/settings/profile`
Update user profile. 🔒 **Requires Auth**

**Body:**
```json
{
  "name": "Tirukoti Vinay",
  "email": "vinay@example.com",
  "organization": "CyberSec Lab"
}
```

---

### PUT `/settings/password`
Change password. 🔒 **Requires Auth**

**Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

---

### PUT `/settings/ai`
Update AI provider configuration. 🔒 **Requires Auth**

**Body:**
```json
{
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "temperature": 0.3,
  "maxTokens": 2048
}
```

---

## 📋 Audit Log

### GET `/audit`
Get audit log entries. 🔒 **Requires Auth (Admin)**

**Query:** `?limit=50&offset=0`

---

## AI Provider

### GET `/ai/status`
Check current AI provider status. 🔒 **Requires Auth**

**Response:** `200 OK`
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "connected": true
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Description of what went wrong"
}
```

| Status | Meaning |
|---|---|
| `400` | Bad Request — invalid input |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — resource doesn't exist |
| `429` | Too Many Requests — rate limited |
| `500` | Internal Server Error |
