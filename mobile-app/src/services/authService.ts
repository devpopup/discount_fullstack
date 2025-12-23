import apiClient, { setAuthToken, removeAuthToken } from './api';

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  avatar_url?: string;
  is_active?: boolean;
  is_business?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

/**
 * Sign up a new user
 */
export async function signUp(data: SignUpData): Promise<{ success: boolean; error?: string; token?: string }> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    if (response.data.access_token) {
      await setAuthToken(response.data.access_token);
      return { success: true, token: response.data.access_token };
    }

    return { success: false, error: 'No token received' };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to sign up'
    };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(data: SignInData): Promise<{ success: boolean; error?: string; token?: string }> {
  try {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      {
        email: data.email,
        password: data.password,
      }
    );

    if (response.data.access_token) {
      await setAuthToken(response.data.access_token);
      return { success: true, token: response.data.access_token };
    }

    return { success: false, error: 'No token received' };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to sign in'
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await removeAuthToken();
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<{ user: User | null; error?: string }> {
  try {
    const response = await apiClient.get<User>('/auth/me');
    return { user: response.data };
  } catch (error: any) {
    console.error('Get user error:', error);
    return {
      user: null,
      error: error.response?.data?.detail || error.message || 'Failed to get user'
    };
  }
}
