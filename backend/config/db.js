import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    // Successful persistent connection
    return conn.connection;
  } catch (error) {
    // Log failure reason
    console.error('❌ MongoDB Connection Failed');
    console.error(`Reason: ${error.message}`);

    // Only allow memory DB fallback when explicitly enabled in development
    const allowMemory = process.env.NODE_ENV === 'development' && process.env.ENABLE_MEMORY_DB === 'true';
    if (allowMemory) {
      try {
        console.warn('Attempting mongodb-memory-server fallback (development + ENABLE_MEMORY_DB=true)...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({
          instance: { dbName: 'dbu_ims' }
        });
        const uri = mongod.getUri();
        console.log('✅ mongodb-memory-server started');
        const memConn = await mongoose.connect(uri, { autoIndex: true });
        return memConn.connection;
      } catch (memErr) {
        console.error('❌ In-memory MongoDB fallback failed');
        console.error(`Reason: ${memErr.message}`);
      }
    }

    // If we get here, we must exit to avoid starting server without DB
    console.error('Critical Failure: Could not connect to MongoDB. Exiting...');
    process.exit(1);
  }
};

export default connectDB;
