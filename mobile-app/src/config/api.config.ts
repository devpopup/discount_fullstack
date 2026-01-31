/**
 * API Configuration
 *
 * To use a local backend during development:
 * 1. Find your computer's local IP address:
 *    - macOS/Linux: Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
 *    - Windows: Run `ipconfig` and look for IPv4 Address
 * 2. Update LOCAL_API_URL below with your IP (e.g., 'http://192.168.1.100:8000/api/v1')
 * 3. Set USE_LOCAL_API to true
 *
 * To use the production backend:
 * 1. Set USE_LOCAL_API to false
 * 2. Ensure PRODUCTION_API_URL points to your deployed backend
 */

// Toggle between local and production API
export const USE_LOCAL_API = false;

// Local development API (replace with your computer's local IP)
export const LOCAL_API_URL = 'http://192.168.1.100:8000/api/v1';

// Production API (deployed on Render)
export const PRODUCTION_API_URL = 'https://discount-fullstack.onrender.com/api/v1';

// Get the active API URL based on configuration
export const API_BASE_URL = USE_LOCAL_API ? LOCAL_API_URL : PRODUCTION_API_URL;

// API timeout in milliseconds
export const API_TIMEOUT = 15000; // 15 seconds

// Auth token storage key
export const TOKEN_KEY = '@auth_token';
