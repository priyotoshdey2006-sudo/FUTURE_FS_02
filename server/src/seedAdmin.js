import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';

const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 10) {
  console.error('ADMIN_PASSWORD must be at least 10 characters');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (existing) {
  console.log('Admin already exists:', existing.email);
} else {
  await Admin.create({
    email: ADMIN_EMAIL,
    passwordHash: await Admin.hashPassword(ADMIN_PASSWORD),
  });
  console.log('Admin created:', ADMIN_EMAIL);
}
await mongoose.disconnect();
