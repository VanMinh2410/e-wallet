const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found!');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val.replace(/^['"]|['"]$/g, ''); // strip quotes
    }
  });
  return env;
}

async function testSend() {
  const env = loadEnv();
  const host = env.EMAIL_HOST;
  const port = Number(env.EMAIL_PORT || 587);
  const user = env.EMAIL_USERNAME;
  const pass = env.EMAIL_PASSWORD;

  if (!host || !user || !pass) {
    console.error('Missing SMTP configurations in .env!');
    return;
  }

  const from = `VBANK Internet Banking <${user}>`;
  const to = user; // send to self

  console.log(`Creating transport for ${host}:${port}...`);
  let transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });

  const subject = 'Test OTP Mail';
  const text = 'Mã OTP của bạn là 123456';
  const html = `<b>Mã OTP của bạn là 123456</b>`;

  try {
    console.log(`Sending mail from "${from}" to "${to}"...`);
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log('Success! Message sent successfully.');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('Failed to send mail:', err);
  }
}

testSend();
