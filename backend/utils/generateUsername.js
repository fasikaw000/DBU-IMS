import User from '../models/User.js';

/**
 * Automatically generates a unique username.
 * For students: DBU + 7 digits (e.g., DBU2300001)
 * For staff: STF + 6 digits (e.g., STF000101)
 */
export const generateUsername = async (role) => {
  let prefix = 'DBU';
  let digitsCount = 7;

  if (role !== 'student') {
    prefix = 'STF';
    digitsCount = 6;
  }

  // Find the user with the highest sequential number for this prefix
  const lastUser = await User.findOne({ username: { $regex: `^${prefix}` } })
    .sort({ username: -1 })
    .select('username')
    .lean();

  let nextNumber = 1;

  if (lastUser && lastUser.username) {
    const lastNumberStr = lastUser.username.substring(prefix.length);
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Formatting back to string with exact length constraint (leading zeros)
  const newNumberString = nextNumber.toString().padStart(digitsCount, '0');
  
  return `${prefix}${newNumberString}`;
};
