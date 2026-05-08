import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://IMSuser:IMSuser123@imscluster.cdoaxzc.mongodb.net/?appName=IMScluster';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection;
        
        console.log('Starting migration: Copying name to fullName where fullName is missing...');
        
        const result = await db.collection('users').updateMany(
            { $or: [{ fullName: '' }, { fullName: { $exists: false } }, { fullName: null }] },
            [
                { $set: { fullName: { $ifNull: ['$name', 'Unknown User'] } } }
            ]
        );

        console.log(`Matched ${result.matchedCount} users, updated ${result.modifiedCount} users.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
