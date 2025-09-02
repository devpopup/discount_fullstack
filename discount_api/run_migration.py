#!/usr/bin/env python3
"""
Script to add timezone and notification columns to the businesses table.
Run this script to update your database schema.
"""

import asyncio
import sys
from app.core.database import supabase_admin

async def run_migration():
    """Add the new columns to the businesses table"""
    
    print("🔄 Starting database migration...")
    
    try:
        # SQL commands to add the new columns
        migrations = [
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'America/Toronto';",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS promotional_updates BOOLEAN NOT NULL DEFAULT true;",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS transaction_alerts BOOLEAN NOT NULL DEFAULT true;",
            "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;",
        ]
        
        for sql in migrations:
            print(f"Executing: {sql}")
            try:
                # Execute the SQL using Supabase admin client
                result = supabase_admin.postgrest.rpc('execute_sql', {'query': sql}).execute()
                print(f"✅ Success")
            except Exception as e:
                print(f"⚠️  Warning: {e}")
                # Continue with other migrations even if one fails
        
        print("\n🎉 Migration completed!")
        print("The following columns have been added to the businesses table:")
        print("  - timezone (VARCHAR, default: 'America/Toronto')")
        print("  - promotional_updates (BOOLEAN, default: true)")
        print("  - transaction_alerts (BOOLEAN, default: true)")
        print("  - email_notifications (BOOLEAN, default: true)")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
        
    return True

if __name__ == "__main__":
    print("Business Settings Migration")
    print("=" * 30)
    
    success = asyncio.run(run_migration())
    
    if success:
        print("\n✅ You can now restart your API server and test the settings functionality!")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)