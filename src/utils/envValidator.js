/**
 * Environment variable validation
 * Ensures required configuration is present on app startup
 */

export const validateEnv = () => {
  const required = ['VITE_API_URL', 'VITE_FIREBASE_API_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return {
      isValid: false,
      missing,
      error: `Missing configuration: ${missing.join(', ')}`
    };
  }

  // Validate format
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    console.error('VITE_API_URL must be a valid URL');
    return {
      isValid: false,
      missing: [],
      error: 'VITE_API_URL must be a valid HTTP/HTTPS URL'
    };
  }

  console.info('Environment validation passed');
  return {
    isValid: true,
    missing: [],
    error: null
  };
};
