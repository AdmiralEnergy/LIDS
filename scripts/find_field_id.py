import requests
import json

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host/rest/metadata/fields"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

def find_id():
    print("Searching for field 'assignedRep'...")
    # Try filtering by name directly
    url = f"{BASE_URL}?filter=name[eq]=assignedRep"
    r = requests.get(url, headers=HEADERS)
    
    if r.status_code == 200:
        data = r.json().get('data', {}).get('fields', [])
        if data:
            print(f"FOUND ID: {data[0]['id']}")
            print(f"Object ID: {data[0]['objectMetadataId']}")
            print(f"Current Options: {json.dumps(data[0].get('options'), indent=2)}")
        else:
            print("Not found by name.")
    else:
        print(r.status_code, r.text)

if __name__ == "__main__":
    find_id()
