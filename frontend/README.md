# ApexCore - Secure Financial Transaction Platform

![ApexCore Architecture - 3 Financial Integrity Rules + ACID](docs/architecture.png)

A MERN stack financial platform built with **Non-Negotiable Financial Integrity Guidelines** and ACID compliance.

## 🛡️ 3 Non-Negotiable Financial Integrity Guidelines Implemented

### Rule 1: Never Overwrite Balances Directly
> Always compute explicit current account valuations by accumulating immutable history logs.

**Implementation:**
- `User.js` has NO `balance` field - deleted to prevent direct mutation
- `Transaction.js` is append-only, immutable ledger with `credit`/`debit` types
- Balance calculated via:
```js
static async getBalance(userId) {
  const result = await this.aggregate([
    { $match: { userId } },
    { $group: { _id: null, balance: { $sum: { $cond: [{ $eq: ["$type","credit"] }, "$amount", { $multiply: ["$amount", -1] }] } } }
  ]);
  return result[0]?.balance || 0;
}All reads: Transaction.find().sort({ createdAt: 1 }) - sorted append-only orderRule 2: Never Rely on Client Calculations
Every monetary calculation must execute exclusively on server tier.Implementation:
Server-tier rounding: req.body.amount = Math.round(amt * 100) / 100All financial math in getBalance() aggregate on serverNo balance sent from client is trustedRule 3: Isolate Mutative Requests
Use explicit input scrubbing to ensure data properties matching negative metrics cannot bypass entry validations.Implementation:
scrubFinancialInput middleware:jsif (String(raw).includes('-')) return 400 Negative metrics not allowed
if (!Number.isFinite(amt)) return 400 Must be finite
if (Object.is(amt, -0)) return 400 Negative zero blocked
if (amt <= 0) return 400 Must be > 0🔒 Week 5: ACID Transaction Compliancejsconst session = await mongoose.startSession();
session.startTransaction();
try {
  // All reads inside session
  await User.findById().session(session)
  // Append-only ledger entries
  await Transaction.create([...], { session })
  await session.commitTransaction();
} catch {
  await session.abortTransaction(); // Automatic rollback on hardware/network drop
}Dual account mutation is atomic - both debit + credit succeed or both rollback.
Tech Stack
Frontend: React + Vite (port 5173)Backend: Node.js + Express (port 5000)DB: MongoDB + Mongoose sessionsAuth: JWT in httpOnly cookiesSetupbash# Clone
git clone https://github.com/Esosa/apexcore.git
cd apexcore

# Backend
cd backend
npm install
# Create .env with: MONGO_URI, JWT_SECRET, PORT=5000
npm run dev

# Frontend
cd ../frontend
npm install
npm run devAPI EndpointsMethodRouteDescriptionIntegrityGET/api/transactionsGet append-only ledgerRule 1POST/api/transactions/sendTransfer with ACID + scrubbingRule 1,2,3POST/api/transactions/addDeposit with ACIDRule 1,2,3POST/api/auth/loginSets httpOnly cookieSecureTesting Financial Integritypowershell# PowerShell - must use curl.exe not curl
$token = "real_jwt_from_login"
curl.exe http://localhost:5000/api/transactions -H "Cookie: token=$token"

# Rule 3 test - should block
curl.exe -X POST http://localhost:5000/api/transactions/send -H "Content-Type: application/json" -H "Cookie: token=$token" -d "{\"toEmail\":\"test@test.com\",\"amount\":-100}"
# Expected: 400 Negative metrics not allowedAuthor
Esosa - ApexCore Project - Financial Systems Security