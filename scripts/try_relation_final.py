import requests
import json

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host/rest/metadata/fields"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

PERSON_ID = "95782d2d-8813-4e3a-8c64-9f1c48f51126"
MEMBER_ID = "0d5a14b5-eecd-436d-bfe6-946f210de180"

def create():
    payload = {
        "objectMetadataId": PERSON_ID,
        "name": "assignedRep",
        "label": "Assigned Rep",
        "type": "RELATION",
        "icon": "IconUser",
        "settings": {
            "relationType": "MANY_TO_ONE",
            "relatedObjectMetadataId": MEMBER_ID
        }
    }
    r = requests.post(BASE_URL, headers=HEADERS, json=payload)
    print(r.status_code)
    print(r.text)

create()
