import requests
import json

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host/graphql"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def inspect_person_object():
    print("=== Inspecting 'Person' Object Metadata via GraphQL ===")
    
    # GraphQL Introspection Query to find fields on the 'Person' type
    query = """
    {
      __type(name: "Person") {
        name
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
    """
    
    response = requests.post(BASE_URL, headers=HEADERS, json={"query": query})
    
    if response.status_code == 200:
        data = response.json()
        fields = data.get('data', {}).get('__type', {}).get('fields', [])
        
        found = False
        print(f"Found {len(fields)} fields on Person object.")
        
        for f in fields:
            name = f['name']
            # Check for anything that looks like our field
            if 'assign' in name.lower() or 'rep' in name.lower():
                print(f"MATCH FOUND: {name} (Type: {f['type']['name']}/{f['type']['kind']})")
                found = True
                
        if not found:
            print("No fields matching 'assign' or 'rep' found.")
            # Print first 10 fields to verify we're looking at the right object
            print("Sample fields:", [f['name'] for f in fields[:10]])
            
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    inspect_person_object()
