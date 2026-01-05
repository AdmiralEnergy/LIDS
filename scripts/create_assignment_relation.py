import requests
import json
import sys

# Configuration
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host/rest/metadata/fields"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Object IDs (Retrieved from previous step)
PERSON_ID = "95782d2d-8813-4e3a-8c64-9f1c48f51126"
WORKSPACE_MEMBER_ID = "0d5a14b5-eecd-436d-bfe6-946f210de180"

def create_relation():
    print("=== Creating 'Assigned Rep' Relation Field ===")
    
    payload = {
        "objectMetadataId": PERSON_ID,
        "name": "assignedRep",
        "label": "Assigned Rep",
        "type": "RELATION",
        "icon": "IconUserCheck",
        "description": "System User assigned to this lead",
        "settings": {
            "relationType": "MANY_TO_ONE",
            "relatedObjectMetadataId": WORKSPACE_MEMBER_ID,
            # Adding inverse side configuration
            "targetFieldName": "assignedLeads", 
            "targetFieldLabel": "Assigned Leads"
        }
    }

    print("Sending Payload:")
    print(json.dumps(payload, indent=2))

    try:
        response = requests.post(BASE_URL, headers=HEADERS, json=payload)
        
        if response.status_code == 200:
            print("\n[SUCCESS] Field Created Successfully!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"\n[FAIL] Status Code: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"\n[ERROR] Exception occurred: {e}")

if __name__ == "__main__":
    create_relation()
