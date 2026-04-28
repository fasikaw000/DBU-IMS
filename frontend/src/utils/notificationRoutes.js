/**
 * Maps a notification type to its canonical frontend route.
 * Returns null if the notification type has no dedicated page (e.g. ANNOUNCEMENT).
 * Returns '/notifications' as a safe fallback for unknown types.
 *
 * @param {string} type  - The notification.type string (case-insensitive).
 * @param {string} role  - The current user's role (used for ADVISOR_ASSIGNED routing).
 * @param {string} [link] - Optional pre-saved link from the notification document.
 * @returns {string|null}
 */
export const getNotificationRoute = (type, role, link) => {
  // 1. Normalize saved link if present (fixes legacy/incorrect paths).
  if (link) {
    if (link.includes('/student/dashboard')) return '/student-dashboard';
    if (link.includes('/advisor/dashboard')) return '/advisor-dashboard';
    if (link.includes('/advisor/internships')) return '/advisor-dashboard';
    if (link.includes('/advisor/reports')) return '/advisor-dashboard';
    if (link.includes('/dean/dashboard')) return '/dept-dashboard';
    if (link.includes('/admin/dashboard')) return '/admin-dashboard';
    // Validate the saved link is a real route before using it
    const knownPrefixes = [
      '/student-dashboard', '/advisor-dashboard', '/dept-dashboard',
      '/admin-dashboard', '/messages', '/notifications', '/students',
      '/profile', '/logbook', '/internships',
    ];
    if (knownPrefixes.some((p) => link.startsWith(p))) return link;
    // If we don't recognise it, fall through to type mapping below.
  }

  // 2. Type-based mapping.
  const t = String(type || '').toUpperCase();
  switch (t) {
    // — Messages —
    case 'NEW_MESSAGE':
    case 'MESSAGE':
    case 'CHAT':
      return '/messages';

    // — Assignment —
    case 'ADVISOR_ASSIGNED':
      return role === 'Student' ? '/student-dashboard' : '/advisor-dashboard';

    // — Application status (student) —
    case 'APPLICATION_APPROVED':
    case 'APPLICATION_REJECTED':
    case 'APPLICATION_UPDATE':
    case 'INTERNSHIP_APPROVED':
    case 'INTERNSHIP_STATUS_UPDATE':
      return '/student-dashboard';

    // — New application (dean) —
    case 'NEW_INTERNSHIP_APPLICATION':
    case 'INTERNSHIP_APPLICATION':
      return '/dept-dashboard';

    // — Reports / evaluations (advisor) —
    case 'REPORT_SUBMITTED':
    case 'EVALUATION_SUBMITTED':
    case 'NEW_REPORT':
      return '/advisor-dashboard';

    // — Announcements have no dedicated page —
    case 'ANNOUNCEMENT':
      return null;

    // — Safe fallback —
    default:
      return '/notifications';
  }
};
