# 🔐 Security Guide - E-Wallet

## 1. Security Layers Overview

```
┌─────────────────────────────────────────────────────┐
│     Layer 7: Application Layer Security             │
│     - Input validation, output encoding             │
├─────────────────────────────────────────────────────┤
│     Layer 6: Business Logic Security                │
│     - Permission checks, limit enforcement          │
├─────────────────────────────────────────────────────┤
│     Layer 5: Database Security                      │
│     - Encryption at rest, field-level encryption    │
├─────────────────────────────────────────────────────┤
│     Layer 4: API Security                           │
│     - Rate limiting, CORS, authentication           │
├─────────────────────────────────────────────────────┤
│     Layer 3: Transport Security                     │
│     - HTTPS/TLS, certificate pinning                │
├─────────────────────────────────────────────────────┤
│     Layer 2: Infrastructure Security                │
│     - Firewalls, network segmentation, VPN          │
├─────────────────────────────────────────────────────┤
│     Layer 1: Physical Security                      │
│     - Data center access control                    │
└─────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization

### 2.1 Password Security

**Requirements:**
```
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)
```

**Storage:**
```typescript
// Use bcrypt with salt rounds = 10 or higher
const hashed = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, hashed);
```

**Password Reset:**
- Generate secure token (crypto.randomBytes)
- Token expires in 1 hour
- One-time use only
- Require email verification before reset

---

### 2.2 JWT Tokens

**Access Token:**
```typescript
{
  // Short expiration (15 minutes)
  expiresIn: '15m',
  
  // Include minimal payload
  payload: {
    sub: user_id,
    email: user_email,
    roles: [...user_roles]
  }
}
```

**Refresh Token:**
```typescript
{
  // Longer expiration (7 days)
  expiresIn: '7d',
  
  // Different secret
  secret: JWT_REFRESH_SECRET,
  
  // Include device info
  payload: {
    sub: user_id,
    device_id: device_fingerprint
  }
}
```

**Token Storage (Frontend):**
```typescript
// ✅ RECOMMENDED: httpOnly secure cookies
response.setHeader('Set-Cookie', 
  `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=900`
);

// ❌ AVOID: localStorage (vulnerable to XSS)
// localStorage.setItem('token', token);
```

**Token Validation:**
```typescript
// 1. Verify signature
// 2. Check expiration
// 3. Verify issuer
// 4. Check audience
// 5. Validate claims
```

---

### 2.3 Multi-Factor Authentication (MFA)

**OTP Implementation:**
```typescript
// Generate 6-digit code
const code = Math.floor(100000 + Math.random() * 900000).toString();

// Store in Redis with TTL (5 minutes)
await redis.setex(`otp:${user_id}`, 300, code);

// Send via email/SMS
await emailService.send({
  to: user.email,
  subject: 'Your OTP Code',
  body: `Your code is: ${code}`
});

// Verify with attempt limit
const attempts = await redis.incr(`otp:attempts:${user_id}`);
if (attempts > 3) {
  // Lock account
  throw new Error('Too many attempts');
}
```

**Authenticator App (TOTP):**
```typescript
// Generate secret
const secret = speakeasy.generateSecret();

// Store encrypted in DB
await User.updateOne({}, {
  two_factor_secret: encrypt(secret.base32)
});

// Verify token
const isValid = speakeasy.totp.verify({
  secret: decrypt(user.two_factor_secret),
  encoding: 'base32',
  token: userToken,
  window: 2  // Allow ±2 time windows
});
```

---

### 2.4 Role-Based Access Control (RBAC)

**Roles Definition:**
```typescript
enum UserRole {
  USER = 'USER',           // Regular user
  ADMIN = 'ADMIN',         // Content admin
  SUPER_ADMIN = 'SUPER_ADMIN'  // System admin
}

// Permissions mapping
const PERMISSIONS = {
  USER: ['view_own_profile', 'create_transaction', 'view_wallet'],
  ADMIN: ['view_all_users', 'approve_transaction', 'view_logs'],
  SUPER_ADMIN: ['manage_admins', 'system_config', 'view_audit']
};
```

**Implementation:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get('/admin/users')
async getUsers() {
  // Only accessible to admins
}
```

---

## 3. Data Protection

### 3.1 Encryption at Rest

**Sensitive Fields to Encrypt:**
```typescript
// User data
- SSN / ID number
- Bank account numbers
- Phone number (optional)

// Transaction data
- Bank routing numbers
- Payment method details
```

**Encryption Implementation:**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Store: iv + authTag + encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const [iv, authTag, encrypted] = encryptedData.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**Database-level:**
- MongoDB encryption at rest (Enterprise)
- Field-level encryption (App-level recommended)

### 3.2 Encryption in Transit

**HTTPS/TLS:**
```
- Minimum TLS 1.2
- Strong cipher suites
- Certificate pinning (optional for mobile)
- HSTS header: max-age=31536000; includeSubDomains
```

**Helmet.js Configuration:**
```typescript
import helmet from 'helmet';

app.use(helmet());

// Additional security headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

---

## 4. API Security

### 4.1 Rate Limiting

**Implementation with Redis:**
```typescript
import RedisStore from 'rate-limit-redis';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // Rate limit prefix
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use(limiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', authLimiter, authController.login);
```

**Rate Limit Strategies by Endpoint:**
```
POST /auth/login:         5 per 15 minutes
POST /auth/register:      3 per hour
POST /transactions/*:     10 per minute
POST /api/*:              100 per minute (general)
GET /api/*:               200 per minute (general)
```

### 4.2 CORS Configuration

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 4.3 CSRF Protection

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(csrf({ cookie: false })); // Use session token

// Generate token for forms
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protect POST/PUT/DELETE
app.post('/api/*', (req, res, next) => {
  // CSRF token validation happens here
  next();
});
```

---

## 5. Input Validation & Sanitization

### 5.1 Schema Validation with Zod

```typescript
import { z } from 'zod';

const TransferSchema = z.object({
  from_wallet_id: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid wallet ID'),
  to_wallet_id: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid wallet ID'),
  amount: z.number().positive('Amount must be positive').max(1000000000),
  description: z.string().min(1).max(200).optional(),
  otp_code: z.string().regex(/^\d{6}$/, 'Invalid OTP')
});

@Post('transfer')
async transfer(@Body() body: unknown) {
  const validated = TransferSchema.parse(body);
  // Proceed with validated data
}
```

### 5.2 Output Encoding

```typescript
// Never return sensitive data
const sanitizedUser = {
  user_id: user._id,
  email: user.email,
  // ❌ NEVER include: password_hash, encryption_keys
};

// Encode HTML to prevent XSS
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(userInput);
```

### 5.3 SQL/NoSQL Injection Prevention

```typescript
// ✅ SAFE: Using Mongoose (parameterized queries)
const user = await User.findById(userId);

// ❌ DANGEROUS: String concatenation (never do this)
// const user = await User.findOne(`{"_id": "${userId}"}`);

// Safe query with operators
const user = await User.findOne({ email: userEmail });
```

---

## 6. Account Security

### 6.1 Account Lockout

```typescript
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

async function handleFailedLogin(userId: string) {
  const attempts = await redis.incr(`failed:${userId}`);
  
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    // Lock account
    await User.updateOne({ _id: userId }, {
      locked_until: new Date(Date.now() + LOCK_TIME)
    });
    
    // Send security alert
    await emailService.sendSecurityAlert(user.email);
  }
  
  // Set expiration on failed attempts counter
  await redis.expire(`failed:${userId}`, 3600);
}

async function handleSuccessfulLogin(userId: string) {
  // Reset failed attempts
  await redis.del(`failed:${userId}`);
  
  // Update last login
  await User.updateOne({ _id: userId }, {
    last_login: new Date(),
    failed_login_attempts: 0
  });
}
```

### 6.2 Device Fingerprinting

```typescript
import { v4 as uuidv4 } from 'uuid';

function generateDeviceFingerprint(req: Request): string {
  const fingerprint = {
    userAgent: req.headers['user-agent'],
    acceptLanguage: req.headers['accept-language'],
    acceptEncoding: req.headers['accept-encoding'],
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex');
}

// On login, check if device is trusted
async function checkDeviceRisk(userId: string, deviceId: string) {
  const trustedDevices = await User.findById(userId)
    .select('trusted_devices');
  
  const isKnown = trustedDevices.some(d => d.device_id === deviceId);
  
  if (!isKnown) {
    // Flag for additional verification
    await sendVerificationEmail(user.email, deviceId);
    return { requiresVerification: true };
  }
  
  return { requiresVerification: false };
}
```

### 6.3 Unusual Activity Detection

```typescript
async function detectUnusualActivity(userId: string, transaction: Transaction) {
  const user = await User.findById(userId);
  const recentTransactions = await Transaction.find({
    from_user_id: userId,
    created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  // Check for unusual patterns
  const anomalies = [];
  
  // Pattern 1: Excessive amount
  const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
  if (transaction.amount > avgAmount * 5) {
    anomalies.push('UNUSUAL_HIGH_AMOUNT');
  }
  
  // Pattern 2: Time-based anomaly
  const lastTransactionTime = user.last_login;
  if (Date.now() - lastTransactionTime > 24 * 60 * 60 * 1000) {
    anomalies.push('UNUSUAL_TIME');
  }
  
  // Pattern 3: Impossible travel
  // ... geo-location checks ...
  
  if (anomalies.length > 0) {
    // Require additional verification (OTP)
    await otpService.generate(userId);
    throw new Error('Verification required for this transaction');
  }
}
```

---

## 7. Audit Logging

### 7.1 What to Log

```typescript
interface AuditLog {
  user_id: ObjectId;
  action: string;          // LOGIN, TRANSFER, UPDATE_PROFILE
  resource: string;        // USER, TRANSACTION, WALLET
  resource_id: ObjectId;
  status: 'SUCCESS' | 'FAILURE';
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  details?: object;        // Additional context
  error_message?: string;
}

// Log these critical events:
- User login/logout
- Password changes
- Profile updates
- Bank account linking/unlinking
- Transaction approval/rejection
- Admin actions
- Failed access attempts
- Configuration changes
```

### 7.2 Logging Implementation

```typescript
async function logAction(log: AuditLog) {
  await AuditLog.create({
    ...log,
    timestamp: new Date()
  });
  
  // Also log to external service (optional)
  if (log.status === 'FAILURE' || log.action === 'CRITICAL') {
    await sentry.captureMessage(
      `${log.action} failed for user ${log.user_id}`,
      'error'
    );
  }
}

// Usage in controller
@Post('transfer')
async transfer(@Body() body, @Req() req) {
  try {
    const result = await this.transactionService.transfer(body);
    
    await this.auditService.log({
      user_id: req.user.id,
      action: 'TRANSFER',
      resource: 'TRANSACTION',
      resource_id: result._id,
      status: 'SUCCESS',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    return result;
  } catch (error) {
    await this.auditService.log({
      user_id: req.user.id,
      action: 'TRANSFER',
      resource: 'TRANSACTION',
      status: 'FAILURE',
      ip_address: req.ip,
      error_message: error.message
    });
    throw error;
  }
}
```

---

## 8. Secrets Management

### 8.1 Environment Variables

```bash
# .env (DO NOT commit)
JWT_SECRET=super_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=another_secret_key_minimum_32_characters
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ewallet
REDIS_URL=redis://user:password@localhost:6379
ENCRYPTION_KEY=your_256_bit_hex_key
SENDGRID_API_KEY=...
```

### 8.2 Secrets Rotation

```typescript
// Rotate JWT secret every 90 days
const isSecretExpired = () => {
  const lastRotation = process.env.JWT_SECRET_ROTATION_DATE;
  const daysSinceRotation = (Date.now() - new Date(lastRotation).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceRotation > 90;
};

// Invalidate old tokens when rotating
async function rotateSecret() {
  // Invalidate all refresh tokens
  await RefreshToken.deleteMany({});
  
  // Force re-login for all users
  await sendToAllUsers('Security update: Please login again');
}
```

---

## 9. Dependency Security

### 9.1 Regular Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix known vulnerabilities
npm audit fix

# Use Snyk for continuous monitoring
npm install -g snyk
snyk test
snyk monitor
```

### 9.2 Dependency Pinning

```json
{
  "dependencies": {
    "express": "4.18.2",
    "@nestjs/core": "10.0.0"
  }
}
```

---

## 10. Compliance & Standards

### 10.1 OWASP Top 10 Mitigation

| Vulnerability | Mitigation |
|---------------|-----------|
| Injection | Parameterized queries, input validation |
| Broken Auth | JWT, MFA, password policies |
| Sensitive Data Exposure | Encryption at rest & transit |
| XXE | Disable XML processing, validate input |
| Broken Access Control | RBAC, authorization guards |
| Security Misconfiguration | Security headers, CORS, CSRF |
| XSS | Output encoding, CSP headers |
| Insecure Deserialization | Validate serialized data |
| Using Components with Vulnerabilities | Dependency scanning |
| Insufficient Logging | Audit logging, monitoring |

### 10.2 PCI DSS Compliance

For payment processing:
- ✅ Encrypt cardholder data
- ✅ Maintain secure network
- ✅ Protect cardholder data
- ✅ Maintain vulnerability program
- ✅ Maintain access control policy
- ✅ Regularly test systems
- ✅ Maintain information security policy

---

## 11. Security Checklist

**Before Production:**
- [ ] All secrets in environment variables
- [ ] HTTPS/TLS enabled
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Helmet.js enabled
- [ ] Input validation in place
- [ ] Encryption for sensitive data
- [ ] Audit logging configured
- [ ] Database backups tested
- [ ] Security headers configured
- [ ] Dependencies scanned for vulnerabilities
- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Incident response plan prepared
- [ ] Security documentation complete

---

## 12. Incident Response Plan

**If Breach Detected:**
1. Isolate affected systems
2. Preserve evidence
3. Notify affected users within 72 hours
4. Notify regulatory bodies
5. Enable forced password reset
6. Invalidate all sessions
7. Monitor for unauthorized access
8. Post-incident review

---

## 13. Security Update Schedule

- **Weekly:** npm audit check
- **Monthly:** Dependency updates
- **Quarterly:** Security audit
- **Annually:** Penetration testing
- **On-demand:** Critical vulnerabilities

---

## 14. Further Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
