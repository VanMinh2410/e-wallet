/**
 * Seed database for development
 * Run from backend/: npm run seed
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
}

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/hki-wallet?replicaSet=rs0';
const SALT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
  {
    fullName: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    passwordHash: String,
    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, default: 'user' },
  },
  { timestamps: true },
);

const WalletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const BankAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bankCode: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = mongoose.model('User', UserSchema);
const Wallet = mongoose.model('Wallet', WalletSchema);
const BankAccount = mongoose.model('BankAccount', BankAccountSchema, 'bank_accounts');

const crypto = require('crypto');

const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-key';
const key = crypto.scryptSync(COOKIE_SECRET, 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

const SEED_USERS = [
  {
    fullName: 'Admin HKi',
    email: 'admin@hki-wallet.dev',
    phone: '0912345678',
    password: 'Admin@123456',
    balance: 10_000_000,
    role: 'admin',
  },
  {
    fullName: 'User A',
    email: 'usera@hki-wallet.dev',
    phone: '0964400032',
    password: 'User@123456',
    balance: 500_000,
    role: 'user',
  },
  {
    fullName: 'User B',
    email: 'userb@hki-wallet.dev',
    phone: '0923456789',
    password: 'User@123456',
    balance: 250_000,
    role: 'user',
  },
];

async function seed() {
  console.log('Connecting to', MONGODB_URI.replace(/\/\/.*@/, '//***@'));
  console.log('MONGODB_URI:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  await User.deleteMany({});
  await Wallet.deleteMany({});
  await BankAccount.deleteMany({});

  for (const u of SEED_USERS) {
    const { balance, password, ...info } = u;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      ...info,
      passwordHash,
    });

    await Wallet.create({
      userId: user._id,
      balance,
    });

    let bankCode, bankName, accountNumber;
    if (u.role === 'admin') {
      bankCode = 'BIDV';
      bankName = 'BIDV';
      accountNumber = '111122223333';
    } else if (u.fullName === 'User A') {
      bankCode = 'VCB';
      bankName = 'Vietcombank';
      accountNumber = '0123456789';
    } else {
      bankCode = 'TCB';
      bankName = 'Techcombank';
      accountNumber = '9876543210';
    }

    await BankAccount.create({
      userId: user._id,
      bankCode,
      bankName,
      accountNumber: encrypt(accountNumber),
      accountName: u.fullName.toUpperCase(),
      isVerified: true,
      isActive: true,
    });

    if (u.fullName === 'User B') {
      await BankAccount.create({
        userId: user._id,
        bankCode: 'VNPAY',
        bankName: 'VNPay',
        accountNumber: encrypt('9704198526191432198'),
        accountName: 'NGUYEN VAN A',
        isVerified: true,
        isActive: true,
      });
      console.log(`OK ${info.email} (user) balance ${balance.toLocaleString('vi-VN')} VND with bank account VNPAY`);
    }

    console.log(
      `OK ${info.email} (${info.role}) balance ${balance.toLocaleString('vi-VN')} VND with bank account ${bankCode}`,
    );
  }

  await mongoose.disconnect();

  console.log('\nSeed hoàn tất.');
}

seed().catch((e) => {
  console.error('Seed thất bại:', e.message);
  process.exit(1);
});
