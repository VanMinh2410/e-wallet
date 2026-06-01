/**
 * seed-database.js
 * Script tạo dữ liệu mẫu cho môi trường development
 * Chạy: node .claude/scripts/seed-database.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hki-wallet?replicaSet=rs0';
const SALT_ROUNDS = 12;

// Schemas
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  passwordHash: String,
  isVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'VND' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Wallet = mongoose.model('Wallet', WalletSchema);

// Dữ liệu mẫu
const SEED_USERS = [
  {
    fullName: 'Nguyễn Văn Admin',
    email: 'admin@hki-wallet.dev',
    phone: '0901234567',
    password: 'Admin@123456',
    balance: 10_000_000, // 10 triệu
  },
  {
    fullName: 'Trần Thị User A',
    email: 'usera@hki-wallet.dev',
    phone: '0912345678',
    password: 'User@123456',
    balance: 500_000, // 500K
  },
  {
    fullName: 'Lê Văn User B',
    email: 'userb@hki-wallet.dev',
    phone: '0923456789',
    password: 'User@123456',
    balance: 250_000, // 250K
  },
  {
    fullName: 'Phạm Thị Test',
    email: 'test@hki-wallet.dev',
    phone: '0934567890',
    password: 'Test@123456',
    balance: 0,
  },
];

async function seed() {
  console.log('🌱 Bắt đầu seed database...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');
    
    // Xóa dữ liệu cũ (chỉ trong dev)
    await User.deleteMany({});
    await Wallet.deleteMany({});
    console.log('🗑️  Đã xóa dữ liệu cũ');
    
    // Tạo users và wallets
    for (const userData of SEED_USERS) {
      const { balance, password, ...userInfo } = userData;
      
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const [user] = await User.create([{ ...userInfo, passwordHash }], { session });
        await Wallet.create([{ userId: user._id, balance }], { session });
        await session.commitTransaction();
        
        console.log(`✅ Tạo user: ${userInfo.email} (balance: ${balance.toLocaleString('vi-VN')}đ)`);
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }
    
    console.log('\n🎉 Seed hoàn thành!');
    console.log('\n📋 Tài khoản test:');
    SEED_USERS.forEach(u => {
      console.log(`  Email: ${u.email} | Pass: ${u.password} | Balance: ${u.balance.toLocaleString('vi-VN')}đ`);
    });
    
  } catch (error) {
    console.error('❌ Seed thất bại:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Đã ngắt kết nối MongoDB');
  }
}

seed();
