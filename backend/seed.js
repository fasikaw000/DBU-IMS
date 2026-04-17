import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Student from './models/Student.js';
import ValidStudentId from './models/ValidStudentId.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear existing data (CAUTION)
    await User.deleteMany({});
    await Student.deleteMany({});
    await ValidStudentId.deleteMany({});

    const users = [
      { name: 'Student User', email: 'student@test.com', password: 'password123', role: 'student' },
      { name: 'Advisor User', email: 'advisor@test.com', password: 'password123', role: 'advisor' },
      { name: 'Dept Head User', email: 'dept@test.com', password: 'password123', role: 'department_head' },
      { name: 'College Head User', email: 'dean@test.com', password: 'password123', role: 'college_head' },
      { name: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'admin' }
    ];

    for (const u of users) {
      const user = await User.create(u);
      console.log(`Created user: ${user.name} (${user.email})`);

      if (user.role === 'student') {
        const studentId = 'DBU1234567';
        await ValidStudentId.create({ studentId, isRegistered: true });
        await Student.create({
          user: user._id,
          studentId: studentId,
          department: 'CS',
          phone: '0911223344'
        });
        console.log(`Created student record for: ${user.name}`);
      }
    }

    console.log('Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
