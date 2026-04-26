import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Internship from './models/Internship.js';
import Placement from './models/Placement.js';
import Company from './models/Company.js';
import Student from './models/Student.js';

dotenv.config({ path: './.env' });

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    await Internship.deleteMany({});
    console.log('Cleared Internships');

    await Placement.deleteMany({});
    console.log('Cleared Placements');

    await Company.updateMany({}, { $set: { students: [] } });
    console.log('Cleared Company student links');

    await Student.updateMany({}, { $set: { assignedAdvisor: null } });
    console.log('Cleared Student advisor assignments');

    console.log('Data cleared successfully!');
  } catch (err) {
    console.error('Error clearing data:', err);
  } finally {
    mongoose.disconnect();
  }
}

clearData();
