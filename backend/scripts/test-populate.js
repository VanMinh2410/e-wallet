const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hki-wallet?replicaSet=rs0';

const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { strict: false, collection: 'wallets' });
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromWalletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  toWalletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
}, { strict: false, collection: 'transactions' });

const User = mongoose.model('User', UserSchema);
const Wallet = mongoose.model('Wallet', WalletSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const tx = await Transaction.findOne({
    fromWalletId: { $exists: true },
    toWalletId: { $exists: true }
  })
  .populate({ path: 'userId', select: 'fullName email' })
  .populate({
    path: 'fromWalletId',
    populate: { path: 'userId', select: 'fullName email' }
  })
  .populate({
    path: 'toWalletId',
    populate: { path: 'userId', select: 'fullName email' }
  })
  .lean();

  console.log('Transaction Result:', JSON.stringify(tx, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
