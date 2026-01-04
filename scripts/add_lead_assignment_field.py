#!/usr/bin/env python3
"""
Add assignedToWorkspaceMemberId field to Person object in Twenty CRM.
This enables per-rep lead assignment.
"""

import requests
import json

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def get_person_object_id():
    """Find the Person object metadata ID."""
    response = requests.get(
        f"{BASE_URL}/rest/metadata/objects",
        headers=headers
    )

    if response.status_code != 200:
        print(f"[ERROR] Failed to fetch objects: {response.text}")
        return None

    data = response.json()
    objects = data.get('data', {}).get('objects', [])

    for obj in objects:
        if obj.get('nameSingular') == 'person':
            return obj.get('id')

    # Try alternative lookup
    for obj in objects:
        if 'person' in obj.get('nameSingular', '').lower():
            print(f"[INFO] Found object: {obj.get('nameSingular')} - {obj.get('id')}")
            return obj.get('id')

    return None

def add_field(object_id, name, label, field_type, description, icon):
    """Add a field to a Twenty CRM object."""
    payload = {
        "objectMetadataId": object_id,
        "name": name,
        "label": label,
        "type": field_type,
        "description": description,
        "icon": icon
    }

    response = requests.post(
        f"{BASE_URL}/rest/metadata/fields",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        data = response.json()
        field_name = data.get('data', {}).get('createOneField', {}).get('name', 'unknown')
        print(f"  [OK] Created: {field_name}")
        return True
    else:
        error = response.json()
        if "already exist" in str(error).lower():
            print(f"  - Skipped (exists): {name}")
            return True
        print(f"  [FAIL] Failed: {name} - {error}")
        return False

def check_existing_fields(object_id):
    """Check if field already exists."""
    response = requests.get(
        f"{BASE_URL}/rest/metadata/fields",
        headers=headers,
        params={"filter": f"objectMetadataId[eq]={object_id}"}
    )

    if response.status_code != 200:
        return []

    data = response.json()
    fields = data.get('data', {}).get('fields', [])
    return [f.get('name') for f in fields]

def main():
    print("\n=== Adding Lead Assignment Field to Twenty CRM ===\n")

    # Get Person object ID
    print("[1] Finding Person object...")
    person_object_id = get_person_object_id()

    if not person_object_id:
        print("[ERROR] Could not find Person object. Trying standard ID...")
        # Person is a standard object, use standard endpoint
        person_object_id = "person"  # Standard objects use singular name

    print(f"    Person Object ID: {person_object_id}")

    # Check existing fields
    print("\n[2] Checking existing fields...")
    existing = check_existing_fields(person_object_id)
    if "assignedToWorkspaceMemberId" in existing:
        print("    Field 'assignedToWorkspaceMemberId' already exists!")
        return

    # Add the field
    print("\n[3] Adding assignedToWorkspaceMemberId field...")
    success = add_field(
        object_id=person_object_id,
        name="assignedToWorkspaceMemberId",
        label="Assigned Rep ID",
        field_type="TEXT",
        description="WorkspaceMember ID of assigned sales rep - enables per-rep lead lists",
        icon="IconUserCheck"
    )

    if success:
        print("\n[DONE] Field added successfully!")
        print("\nNext steps:")
        print("1. Update twentyDataProvider.ts to include field in queries")
        print("2. Add filtering logic in dialer.tsx and leads.tsx")
        print("3. Create AssignRepDropdown component")
    else:
        print("\n[FAILED] Could not add field. Check Twenty CRM manually.")
        print(f"\nManual steps:")
        print("1. Go to https://twenty.ripemerchant.host")
        print("2. Settings > Data Model > People")
        print("3. Add field: assignedToWorkspaceMemberId (Text)")

if __name__ == "__main__":
    main()
