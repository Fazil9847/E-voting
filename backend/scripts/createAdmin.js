// createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eVote';

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  const name = process.argv[2] || 'admin';
  const email = process.argv[3] || 'admin@example.com';
  const plain = process.argv[4] || 'admin123';

  const hash = await bcrypt.hash(plain, 10);
  const doc = await Admin.create({ name, email, password: hash });
  console.log('Admin created:', doc);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
