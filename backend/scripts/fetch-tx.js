const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/hki-wallet?replicaSet=rs0');
  console.log('Connected to DB');

  const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
  const txs = await Transaction.find({ type: 'DEPOSIT' }).sort({ createdAt: -1 }).limit(10);
  console.log('Latest transactions:', JSON.stringify(txs, null, 2));

  const Audit = mongoose.model('Audit', new mongoose.Schema({}, { strict: false }));
  const audits = await Audit.find({}).sort({ createdAt: -1 }).limit(10);
  console.log('Latest audits:', JSON.stringify(audits, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
