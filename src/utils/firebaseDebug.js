/**
 * Firebase Debug Utility
 * Logs all Firebase operations to help diagnose issues
 */

const isDev = import.meta.env.DEV;

export const logFirebaseOperation = (operation, details) => {
  if (!isDev) return; // Only log in development

  console.group(`🔥 Firebase: ${operation}`);
  console.log('Details:', details);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};

export const logFirebaseError = (operation, error) => {
  console.group(`❌ Firebase Error: ${operation}`, { color: 'red' });
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
  console.error('Full Error:', error);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};

export const getFirebaseErrorMessage = (error) => {
  const errorMap = {
    'permission-denied': 'Access denied. Check Firestore rules.',
    'not-found': 'Document not found.',
    'already-exists': 'Document already exists.',
    'unavailable': 'Firebase service unavailable. Check connection.',
    'unauthenticated': 'User not authenticated. Please login.',
    'invalid-argument': 'Invalid data. Check your input.',
  };

  return errorMap[error.code] || error.message || 'Unknown Firebase error';
};
