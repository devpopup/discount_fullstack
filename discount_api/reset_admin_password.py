#!/usr/bin/env python3
"""
Reset superadmin password using Supabase admin client
"""
import sys
sys.path.insert(0, '/home/sam/discount_fullstack/discount_api')

from app.core.database import supabase_admin

def reset_admin_password():
    try:
        # Get the user by email
        email = "admin@popupreach.com"
        new_password = "admin123"

        # First, get the user from profiles to get the UUID
        profile_result = supabase_admin.table("profiles").select("id, email, is_superadmin").eq("email", email).execute()

        if not profile_result.data:
            print(f"❌ User {email} not found in profiles table")
            return False

        profile = profile_result.data[0]
        user_id = profile['id']

        print(f"✅ Found user in profiles:")
        print(f"   ID: {user_id}")
        print(f"   Email: {profile['email']}")
        print(f"   Is Superadmin: {profile.get('is_superadmin', False)}")

        # If not superadmin, update it
        if not profile.get('is_superadmin'):
            print(f"\n📝 Setting is_superadmin=true...")
            supabase_admin.table("profiles").update({"is_superadmin": True}).eq("id", user_id).execute()
            print(f"✅ Updated profile to superadmin")

        # Update password using admin API
        print(f"\n🔑 Updating password to '{new_password}'...")
        result = supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"password": new_password}
        )

        if result:
            print(f"✅ Password updated successfully!")
            print(f"\nYou can now login with:")
            print(f"   Email: {email}")
            print(f"   Password: {new_password}")
            return True
        else:
            print(f"❌ Failed to update password")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    reset_admin_password()
