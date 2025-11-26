import apiClient from './api';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name?: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_business: boolean;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function updateUserProfile(data: UserUpdateData): Promise<UserProfile | null> {
  try {
    const response = await apiClient.put('/auth/me', data);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function changePassword(data: PasswordChangeData): Promise<boolean> {
  try {
    await apiClient.put('/auth/change-password', data);
    return true;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}
