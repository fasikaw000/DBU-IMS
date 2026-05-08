import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://IMSuser:IMSuser123@imscluster.cdoaxzc.mongodb.net/?appName=IMScluster';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection;
        
        const usersWithoutFullName = await db.collection('users').find({
            $or: [
                { fullName: '' },
                { fullName: { $exists: false } },
                { fullName: null }
            ]
        }).toArray();

        console.log('Users without fullName:', usersWithoutFullName.length);
        if (usersWithoutFullName.length > 0) {
            usersWithoutFullName.forEach(u => {
                console.log(`ID: ${u._id}, Username: ${u.username}, Name: ${u.name || 'N/A'}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
