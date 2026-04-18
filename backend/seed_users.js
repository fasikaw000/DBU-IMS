import mongoose from 'mongoose';
import User from './models/User.js';
import Student from './models/Student.js';
import Department from './models/Department.js';

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/dbu-ims');

    // Clear existing data for a clean test environment
    await User.deleteMany({});
    await Student.deleteMany({});
    await Department.deleteMany({});

    // 1. Create Computer Science Department
    const csDept = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Department of Computer Science'
    });

    console.log('Created Department:', csDept.name);

    // 2. Create User Accounts (Disabled/Pending Activation)
    const users = await User.create([
      {
        name: 'Fasikaw Ayten',
        username: 'DBU2600001',
        role: 'student',
        isActivated: false,
        department: csDept._id
      },
      {
        name: 'Sirage Z',
        username: 'STF260001',
        role: 'advisor',
        isActivated: false,
        department: csDept._id
      },
      {
        name: 'Weldeyes A',
        username: 'STF260002',
        role: 'department_dean',
        isActivated: false,
        department: csDept._id
      },
      {
        name: 'Dr. Seble E',
        username: 'STF260003',
        role: 'college_admin',
        isActivated: false,
        department: csDept._id
      }
    ]);

    // 3. Create Student Profile for Fasikaw
    await Student.create({
      user: users[0]._id,
      studentId: 'DBU1501198',
      name: 'Fasikaw Ayten',
      department: csDept._id,
      cbeAccount: '1000123456789'
    });

    console.log('Seeding successful!');
    console.log('Student Username: DBU2600001 (ID: DBU1501198)');
    console.log('Advisor Username: STF260001');
    console.log('Dean Username: STF260002');
    console.log('Admin Username: STF260003');

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    process.exit();
  }
}

run();
