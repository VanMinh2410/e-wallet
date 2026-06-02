const mongoose = require('mongoose');
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hki-wallet';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const OtpSchema = new mongoose.Schema({}, { strict: false });
  const Otp = mongoose.model('Otp', OtpSchema, 'otp_records');

  const otps = await Otp.find({}).sort({ createdAt: -1 }).limit(5);
  console.log('Latest OTPs:');
  console.log(JSON.stringify(otps, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
