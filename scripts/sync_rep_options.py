import requests
import json
import re

# Configuration
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

PERSON_ID = "95782d2d-8813-4e3a-8c64-9f1c48f51126" # Standard Person Object
ASSIGNED_REP_FIELD_NAME = "assignedRep"

def to_snake_case(name):
    """Converts 'David Edwards' to 'DAVID_EDWARDS' for the value."""
    # Remove special chars, upper case, replace spaces with underscore
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    return clean.upper().replace(' ', '_')

def get_workspace_members():
    """Fetches all active workspace members via GraphQL."""
    print("Fetching Workspace Members (GraphQL)...")
    url = f"{BASE_URL}/graphql"
    
    query = """
    query GetMembers {
        workspaceMembers {
            edges {
                node {
                    id
                    name {
                        firstName
                        lastName
                    }
                }
            }
        }
    }
    """
    
    resp = requests.post(url, headers=HEADERS, json={"query": query})
    
    if resp.status_code != 200:
        print(f"Error fetching members: {resp.status_code} - {resp.text}")
        return []
        
    data = resp.json()
    edges = data.get('data', {}).get('workspaceMembers', {}).get('edges', [])
    members = [e['node'] for e in edges]
    
    print(f"Found {len(members)} members.")
    return members

def get_field_id():
    """Finds the metadata ID for the assignedRep field by fetching all fields."""
    print("Fetching all fields to find assignedRep...")
    url = f"{BASE_URL}/rest/metadata/fields"
    resp = requests.get(url, headers=HEADERS)

    if resp.status_code != 200:
        print(f"Error fetching fields: {resp.status_code} - {resp.text[:200]}")
        return None

    # Handle different response structures
    data = resp.json()
    fields = data.get('data', {}).get('fields', data.get('fields', data if isinstance(data, list) else []))

    for f in fields:
        if f.get('name') == ASSIGNED_REP_FIELD_NAME and f.get('type') == 'SELECT':
            print(f"Found field: {f.get('id')}")
            return f.get('id')

    return None

def update_field_options(field_id, options):
    """Updates the field definition with the new options list."""
    url = f"{BASE_URL}/rest/metadata/fields/{field_id}"
    
    payload = {
        "options": options
    }
    
    print(f"Updating field {field_id} with {len(options)} options...")
    resp = requests.patch(url, headers=HEADERS, json=payload)
    
    if resp.status_code == 200:
        print("[SUCCESS] Dropdown options updated successfully!")
    else:
        print(f"[FAIL] {resp.status_code} - {resp.text}")

def create_select_field(options):
    """Creates the assignedRep SELECT field."""
    print("Creating 'Assigned Rep' SELECT field...")
    url = f"{BASE_URL}/rest/metadata/fields"
    
    payload = {
        "objectMetadataId": PERSON_ID,
        "name": ASSIGNED_REP_FIELD_NAME,
        "label": "Assigned Rep",
        "type": "SELECT",
        "icon": "IconUserCheck",
        "description": "Sales Rep assigned to this lead",
        "options": options
    }
    
    resp = requests.post(url, headers=HEADERS, json=payload)
    
    if resp.status_code == 200:
        print("[SUCCESS] Field created!")
    else:
        print(f"[FAIL] Create failed: {resp.text}")

def main():
    # 1. Get Members
    members = get_workspace_members()
    if not members:
        return

    # 2. Build Options List
    # Use a rotating set of professional colors
    COLORS = ["#4B5563", "#1D4ED8", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#65A30D"]

    options = []
    for i, m in enumerate(members):
        # GraphQL structure is slightly different (name is object)
        first = m.get('name', {}).get('firstName', '')
        last = m.get('name', {}).get('lastName', '')
        full_name = f"{first} {last}".strip()

        if not full_name:
            continue

        options.append({
            "label": full_name,
            "value": to_snake_case(full_name),
            "color": COLORS[i % len(COLORS)],
            "position": i
        })

    # Sort alphabetically
    options.sort(key=lambda x: x['label'])

    # Fix positions after sorting
    for i, opt in enumerate(options):
        opt['position'] = i

    # 3. Find or Create Field
    field_id = get_field_id()
    
    if field_id:
        # Update existing
        update_field_options(field_id, options)
    else:
        # Create new
        create_select_field(options)

if __name__ == "__main__":
    main()
