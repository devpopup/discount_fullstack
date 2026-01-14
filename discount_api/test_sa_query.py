#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/sam/discount_fullstack/discount_api')

from app.core.database import supabase
from datetime import datetime, timezone

current_time = datetime.now(timezone.utc).isoformat()

print(f"Current time: {current_time}")
print()

# Test query
print("Testing superadmin_offers query...")
try:
    sa_query = supabase.table("superadmin_offers").select(
        "*, superadmin_businesses(*)"
    ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

    print(f"Query built successfully")
    result = sa_query.execute()
    print(f"Query executed successfully")
    print(f"Found {len(result.data)} offers")
    print()

    for offer in result.data:
        print(f"- {offer.get('title')}")
        print(f"  Start: {offer.get('start_date')}")
        print(f"  Expiry: {offer.get('expiry_date')}")
        print(f"  Is Active: {offer.get('is_active')}")
        print()

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
