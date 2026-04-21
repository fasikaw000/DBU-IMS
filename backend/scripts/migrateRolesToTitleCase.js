import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const ROLE_MAP = {
  college_admin: 'Admin',
  department_dean: 'Dean',
  advisor: 'Advisor',
  student: 'Student',
  admin: 'Admin',
  dean: 'Dean'
};

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({}, { role: 1 }).lean();
  let updated = 0;
  for (const u of users) {
    const nextRole = ROLE_MAP[u.role] || u.role;
    if (nextRole !== u.role) {
      await User.updateOne({ _id: u._id }, { $set: { role: nextRole } });
      updated += 1;
    }
  }

  console.log(`Role migration complete. Updated ${updated} user(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

