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
  const currentYearStr = new Date().getFullYear().toString().substring(2, 4); // "26"

  if (lastUser && lastUser.username) {
    const lastNumberStr = lastUser.username.substring(prefix.length);
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  } else {
    // Starting format: current 2-digit year + padded zeros + 1
    // For DBU (7 digits total): e.g., year '26' + 5 padded digits (00001) -> 2600001
    // For STF (6 digits total): e.g., year '26' + 4 padded digits (0001) -> 260001
    // Actually the spec example has DBU2300001, meaning 23 is year, 00001 is incremental.
    const zerosNeeded = digitsCount - 2;
    const padding = '0'.repeat(zerosNeeded - 1) + '1';
    nextNumber = parseInt(`${currentYearStr}${padding}`, 10);
  }

  // Formatting back to string with exact length constraint
  const newNumberString = nextNumber.toString().padStart(digitsCount, '0');
  
  return `${prefix}${newNumberString}`;
};
