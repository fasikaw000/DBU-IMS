import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

/**
 * MANUAL ADMIN CREATION SCRIPT
 * Edit the details below and run 'node create-admin.js'
 */
const adminDetails = {
  name: "Dr. Seblewengel E.",   // You can change this
  username: "STF000001",    // Professional format STFXXXXXX
  role: "Admin",    // DO NOT CHANGE THIS ROLE
  email: "admin@gmail.com",
  isActivated: false        // Set to false so you can activate it through the UI
};

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB...');

    // 1. Check if admin already exists
    const existing = await User.findOne({ username: adminDetails.username });
    if (existing) {
      console.log(`⚠️ User with username ${adminDetails.username} already exists!`);
      process.exit(0);
    }

    // 2. Create the admin
    await User.create(adminDetails);

    console.log('✅ Success! System Administrator Created.');
    console.log(`👤 Name: ${adminDetails.name}`);
    console.log(`🔑 Username: ${adminDetails.username}`);
    console.log('--------------------------------------------------');
    console.log('NEXT STEP: Go to the website and "Activate Account"');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating Admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
