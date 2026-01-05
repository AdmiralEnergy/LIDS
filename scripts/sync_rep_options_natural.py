#!/usr/bin/env python3
"""
Sync workspace members to assignedRep SELECT field.
Uses NATURAL NAMES as values (e.g., "David Edwards") to match workflow's createdBy.name
"""

import requests
import json

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

FIELD_ID = "d207c01e-714c-4cf2-a6b1-b2b01c6ddaf4"
COLORS = ["#4B5563", "#1D4ED8", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#65A30D"]


def get_workspace_members():
    """Fetches all active workspace members via GraphQL."""
    print("Fetching Workspace Members...")
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
    data = resp.json()
    edges = data.get('data', {}).get('workspaceMembers', {}).get('edges', [])
    members = [e['node'] for e in edges]

    print(f"Found {len(members)} members.")
    return members


def main():
    members = get_workspace_members()
    if not members:
        return

    # Build options with NATURAL NAMES as values
    options = []
    for i, m in enumerate(members):
        first = m.get('name', {}).get('firstName', '')
        last = m.get('name', {}).get('lastName', '')
        full_name = f"{first} {last}".strip()

        if not full_name:
            continue

        # Use natural name as BOTH label and value
        options.append({
            "label": full_name,
            "value": full_name,  # Natural name like "David Edwards"
            "color": COLORS[i % len(COLORS)],
            "position": i
        })

    options.sort(key=lambda x: x['label'])
    for i, opt in enumerate(options):
        opt['position'] = i

    print("\nNew options (natural names):")
    for opt in options:
        print(f"  {opt['label']} -> {opt['value']}")

    # Update the field
    url = f"{BASE_URL}/rest/metadata/fields/{FIELD_ID}"
    resp = requests.patch(url, headers=HEADERS, json={"options": options})

    if resp.status_code == 200:
        print("\n[SUCCESS] SELECT field updated with natural names!")
    else:
        print(f"\n[FAIL] {resp.status_code} - {resp.text}")


if __name__ == "__main__":
    main()
