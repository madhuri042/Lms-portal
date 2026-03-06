/**
 * Create the first admin user if none exists.
 * Run from backend folder: node scripts/seedAdmin.js
 * Optional env: ADMIN_EMAIL=admin@lms.com ADMIN_PASSWORD=Admin@123
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lms.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Admin';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'User';
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '9999999999').replace(/\D/g, '').slice(0, 10);

if (!MONGO_URI) {
  console.error('MONGO_URI is not set in .env');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 6) {
  console.error('ADMIN_PASSWORD must be at least 6 characters');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('An admin user already exists:', existing.email);
    await mongoose.disconnect();
    process.exit(0);
  }

  if (ADMIN_PHONE.length !== 10) {
    console.error('Phone must be exactly 10 digits (set ADMIN_PHONE if needed).');
    process.exit(1);
  }

  const byEmail = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });
  if (byEmail) {
    byEmail.role = 'admin';
    await byEmail.save();
    console.log('Updated existing user to admin:', byEmail.email);
    await mongoose.disconnect();
    process.exit(0);
  }

  const byPhone = await User.findOne({ phone: ADMIN_PHONE });
  if (byPhone) {
    byPhone.role = 'admin';
    await byPhone.save();
    console.log('Updated existing user to admin:', byPhone.email);
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.create({
    firstName: ADMIN_FIRST_NAME.trim(),
    lastName: ADMIN_LAST_NAME.trim(),
    email: ADMIN_EMAIL.trim().toLowerCase(),
    password: ADMIN_PASSWORD,
    phone: ADMIN_PHONE,
    role: 'admin',
  });

  console.log('Admin user created:', ADMIN_EMAIL);
  console.log('You can sign in at /admin/login with the above email and your password.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
