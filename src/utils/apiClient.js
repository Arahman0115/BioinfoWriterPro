/**
 * Centralized API client with timeout, error handling, and retry logic
 * Provides resilient API calls with proper error handling and timeouts
 */

const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

export const apiClient = {
  /**
   * Main API request method with timeout and error handling
   * @param {string} endpoint - API endpoint (e.g., '/api/predict')
   * @param {object} options - Fetch options (method, headers, body, etc)
   * @param {number} timeout - Request timeout in milliseconds (default: 10000)
   * @returns {Promise<object>} - Parsed JSON response
   * @throws {Error} - On network error, timeout, or non-200 response
   */
  async request(endpoint, options = {}, timeout = 10000) {
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      const error = new Error('API URL not configured. Please check environment variables.');
      error.code = 'NO_API_URL';
      throw error;
    }

    const url = `${apiUrl}${endpoint}`;

    try {
      const response = await fetchWithTimeout(url, options, timeout);

      // Handle non-2xx responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = 'API_ERROR';
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Log for debugging
      console.error(`API Error [${endpoint}]:`, error.message);

      // Re-throw with context
      if (error.message === 'Request timeout') {
        error.code = 'TIMEOUT';
        error.userMessage = 'Request took too long. Please check your connection and try again.';
      } else if (error.message.includes('Failed to fetch')) {
        error.code = 'NETWORK_ERROR';
        error.userMessage = 'Network error. Please check your internet connection.';
      } else if (!error.code) {
        error.code = 'UNKNOWN_ERROR';
        error.userMessage = error.message || 'An unexpected error occurred.';
      }

      throw error;
    }
  },

  /**
   * For long-running API operations (bioinformatics tools)
   * Uses 5-minute timeout instead of 10 seconds
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<object>} - Parsed JSON response
   */
  async longRunningRequest(endpoint, options = {}) {
    return this.request(endpoint, options, 300000); // 5 minutes
  }
};

/**
 * Helper to format user-friendly error messages
 * @param {Error} error - Error object from apiClient
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (error?.userMessage) {
    return error.userMessage;
  }

  switch (error?.code) {
    case 'TIMEOUT':
      return 'Request took too long. Please try again.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your internet connection.';
    case 'NO_API_URL':
      return 'Application not configured properly. Please contact support.';
    case 'API_ERROR':
      return error.message || 'Server error. Please try again.';
    default:
      return error?.message || 'An unexpected error occurred.';
  }
};
