# ApexCore Bank™ - Secure Full-Stack Banking Platform

**Author:** Esosa  
**Stack:** MERN + MFA + ACID Transactions + Helmet Security  
**Course:** Weeks 1-5 Final Submission

---

## 🎯 Overview

ApexCore Bank™ is a secure, production-ready banking dashboard featuring Google Authenticator MFA, JWT httpOnly cookie authentication, ACID-compliant transactional processing, and append-only ledger architecture.

Live Balance: $13,284.50 (calculated from ledger)

---

## ✅ Week-by-Week Implementation

### Week 1-2: Auth & MFA
- [x] User Model with `balance`, `mfaSecret`, `loginAttempts`, `lockUntil`
- [x] Registration with QR Code (not just code) using `speakeasy`
- [x] Google Authenticator TOTP verification
- [x] Password hashing with bcrypt

### Week 3: Security Pipeline
- [x] Helmet + HSTS (maxAge 31536000)
- [x] Rate Limiting: 100 req/15min global, 5 req/15min auth
- [x] CORS with `credentials: true`
- [x] Payload limit `10kb` anti-DDoS
- [x] Global error handler - no stack leak

### Week 4: Frontend Architecture
- [x] `AuthContext` isolated with `useAuth()` hook (professor requirement)
- [x] `ProtectedRoute` + `GuestRoute`
- [x] Transactional forms with `aria-label`, `inputMode="decimal"`, `min="0.01"`, `step="0.01"`
- [x] Memory-cycle optimized `Promise.all([/auth/me, /transactions])`
- [x] Balance transactional update without page refresh

### Week 5: ACID & Full-Stack Pipelines (CURRENT)
- [x] **Global Axios Instance:** `withCredentials: true` in `src/api.js` - binds server session contexts
- [x] **ACID Transactions:** `mongoose.startSession()` + `session.startTransaction()` in `routes/transactions.js`
- [x] **Automatic Rollback:** `session.abortTransaction()` on hardware/network drops during dual account mutations
- [x] **Append-Only Ledger Pipeline:** Balance calculated via `transactions.reduce()` - never stored alone, mapped dynamically to dashboard
- [x] **Secure Connected:** `MongoDB Secure Connected - ACID ready` on server boot

---

## 🔒 Security Features

- httpOnly cookie JWT (no localStorage)
- TOTP MFA with QR
- Brute-force lock after 5 attempts
- Helmet blocks XSS, clickjacking
- ACID ensures no partial money loss

---

## 💳 Transaction Logic (ACID)

**Send Money:**
1. `startSession()` + `startTransaction()`
2. Read sender & recipient inside session
3. Deduct sender, credit recipient, create 2 ledger entries - all with `{session}`
4. On success: `commitTransaction()` - both accounts update together
5. On any error/network drop: `abortTransaction()` - automatic rollback, no money lost

**Add Money:** Same ACID pipeline

**Ledger:** 
```javascript
const balance = transactions.reduce((acc, tx) => 
  tx.type === 'credit' ? acc + tx.amount : acc - tx.amount, 0)

  🚀 Installation
Backendbashcd backend
npm install
# .env: MONGO_URI, JWT_SECRET, PORT=5000
node server.js
# Expected: MongoDB Secure Connected - ACID ready
# Expected: ApexCore SECURE ACID running on 5000

Frontendbashcd frontend
npm install
npm run dev
# http://localhost:5173Test User
Email: john@test.comPassword: your passwordMFA: Google Authenticator code📡 API EndpointsMethodEndpointAuthDescriptionPOST/api/auth/registerNoRegister + QRPOST/api/auth/loginNoLogin + TOTPGET/api/auth/meYesGet userGET/api/transactionsYesAppend-only ledgerPOST/api/transactions/sendYesACID transferPOST/api/transactions/addYesACID depositPOST/api/auth/logoutYesClear cookie🖥️ Demo Flow for Professor
Terminal shows ACID readyDashboard shows john@test.com + $13,284.50 + 5 transactions with real datesAdd Money $100 → $13,384.50 instantlySend Money to esosa@test.com → both balances updateLogout → /dashboard blocked → Login with MFA code → backNetwork tab shows withCredentials📁 File Structure

apexcore/
├── backend/
│   ├── models/
│   │   ├── User.js (balance, mfaSecret)
│   │   └── Transaction.js (append-only ledger)
│   ├── routes/
│   │   ├── auth.js
│   │   └── transactions.js (ACID sessions)
│   └── server.js (Helmet, CORS credentials, RateLimit)
└── frontend/
    ├── src/
    │   ├── api.js (withCredentials: true)
    │   ├── context/AuthContext.jsx (useAuth)
    │   ├── components/ProtectedRoute.jsx
    │   └── pages/Dashboard.jsx (calculated ledger)