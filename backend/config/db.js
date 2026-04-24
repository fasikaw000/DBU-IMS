import mongoose from 'mongoose';

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

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log("Database connected successfully and is now persistent.");
    
    // Log database name to verify we are not in memory
    console.log(`Connected to database: ${conn.connection.name}`);

  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    console.error("Critical Failure: Could not connect to persistent database. Exiting...");
    process.exit(1);
  }
};

export default connectDB;
