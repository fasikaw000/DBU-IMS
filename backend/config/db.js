import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    let fallbackToMemory = process.env.USE_MEMORY_DB === 'true';

    if (!fallbackToMemory) {
        try {
            const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            console.warn(`⚠️ Could not connect to Atlas: ${error.message}. Falling back to Memory Server...`);
            fallbackToMemory = true;
        }
    }

    if (fallbackToMemory) {
        const mongoServer = await MongoMemoryServer.create();
        const memUri = mongoServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`MongoDB Memory Server Connected`);
    }
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
