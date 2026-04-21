export const ROLE_VALUES = ['Admin', 'Dean', 'Advisor', 'Student'];

const LEGACY_ROLE_MAP = {
  // canonical
  Admin: 'Admin',
  Dean: 'Dean',
  Advisor: 'Advisor',
  Student: 'Student',
  // legacy db values
  college_admin: 'Admin',
  department_dean: 'Dean',
  advisor: 'Advisor',
  student: 'Student',
  // legacy intermediate values used previously
  admin: 'Admin',
  dean: 'Dean'
};

export const normalizeRole = (role) => {
  if (!role) return role;
  return LEGACY_ROLE_MAP[role] || role;
};

export const isValidRole = (role) => ROLE_VALUES.includes(normalizeRole(role));
