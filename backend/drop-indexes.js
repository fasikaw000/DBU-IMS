import 'dotenv/config';
import mongoose from 'mongoose';

const dropIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    console.log('Existing indexes on users collection:');
    const indexes = await User.collection.getIndexes();
    console.log(indexes);

    console.log('Dropping all indexes on users collection...');
    await User.collection.dropIndexes();
    console.log('All indexes dropped.');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

dropIndexes();
