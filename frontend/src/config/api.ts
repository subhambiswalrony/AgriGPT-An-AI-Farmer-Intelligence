// API Configuration
// Use environment variable or fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Weather & Soil Analysis – proxied through the Python backend (no separate port needed)
export const WEATHER_API_BASE_URL = import.meta.env.VITE_WEATHER_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/login',
  SIGNUP: '/api/signup',
  SEND_OTP: '/api/send-otp',
  VERIFY_OTP: '/api/verify-otp',
  GOOGLE_AUTH: '/api/auth/google',
  CREATE_PASSWORD: '/api/create-password',
  
  // Chat
  CHAT: '/api/chat',
  VOICE: '/api/voice',
  CHATS: '/api/chats',
  HISTORY: '/api/history',
  
  // Reports
  REPORT: '/api/report',
  REPORTS: '/api/reports',
  
  // User Settings
  UPDATE_PROFILE: '/api/update-profile',
  CHANGE_PASSWORD: '/api/change-password',
  DELETE_ACCOUNT: '/api/delete-account',
  
  // Disease Prediction
  PREDICT: '/api/predict',

  // Feedback
  FEEDBACK: '/api/feedback',
  ADMIN_FEEDBACKS: '/api/admin/feedbacks',
  CHECK_DEVELOPER: '/api/check-developer',
  ADMIN_STATISTICS: '/api/admin/statistics',
};

// Helper function to build full API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Helper function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('email');
  localStorage.removeItem('name');
  localStorage.removeItem('profilePicture');
  window.location.href = '/auth';
};
