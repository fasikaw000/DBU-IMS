import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).select('+password');
    console.log('Users in DB:');
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUsers();
