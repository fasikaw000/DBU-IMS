export const ROLE_VALUES = ['college_admin', 'department_dean', 'advisor', 'student'];

const LEGACY_ROLE_MAP = {
  admin: 'college_admin',
  dean: 'department_dean',
  advisor: 'advisor',
  student: 'student',
  college_admin: 'college_admin',
  department_dean: 'department_dean'
};

export const normalizeRole = (role) => {
  if (!role) return role;
  return LEGACY_ROLE_MAP[role] || role;
};

export const isValidRole = (role) => ROLE_VALUES.includes(normalizeRole(role));
