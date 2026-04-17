import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users to avoid role enum issues
    await User.deleteMany({});
    console.log('Cleared existing users');

    const admin = await User.create({
      name: 'College Admin',
      email: 'admin@dbu.edu.et',
      password: 'adminpassword123',
      role: 'college_admin',
      isActivated: true
    });

    console.log('College Admin seeded:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
