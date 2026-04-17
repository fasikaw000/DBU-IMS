import User from '../models/User.js';
import Student from '../models/Student.js';
import Department from '../models/Department.js';

const seedDatabase = async () => {
  try {
    const mongoose = (await import('mongoose')).default;
    console.log(`🔍 Seeding Flow on DB: "${mongoose.connection.name}"`);

    // 1. Ensure Department exists (Find or Create)
    const csDept = await Department.findOneAndUpdate(
      { name: 'Computer Science' },
      { 
        name: 'Computer Science', 
        code: 'CS', 
        description: 'Department of Computer Science' 
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Department Ready: ${csDept.name} (${csDept._id})`);

    // 2. Clean only specific test users to avoid collisions
    const testUsernames = ['DBU2600001', 'STF260001', 'STF260002', 'STF260003'];
    await User.deleteMany({ username: { $in: testUsernames } });
    await Student.deleteMany({ username: 'DBU2600001' });
    console.log('🧹 Cleaned existing test accounts.');

    // 3. Create User Accounts (Pending Activation)
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
        name: 'Weldeyes',
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
    console.log('👤 User stubs created.');

    // 4. Create Student Profile for Fasikaw
    await Student.create({
      user: users[0]._id,
      username: 'DBU2600001',
      studentId: 'DBU1501198',
      department: csDept._id,
      cbeAccount: '1000123456789'
    });
    console.log('🎓 Student profile created: DBU2600001');

    console.log('🎉 Seeding Success: All Test Accounts Ready.');
  } catch (err) {
    console.error('❌ SEEDING CRITICAL ERROR:', err.message);
  }
};

export default seedDatabase;
