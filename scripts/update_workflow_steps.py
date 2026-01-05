#!/usr/bin/env python3
"""Update workflow version with steps."""

import requests
import json
import uuid

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host/graphql"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

VERSION_ID = "7c4e9ba8-9be4-461d-916e-67ce7b12ea74"

# Define the steps as JSON
step_id = str(uuid.uuid4())
steps = [
    {
        "id": step_id,
        "name": "Update Person assignedRep",
        "type": "UPDATE_RECORD",
        "valid": True,
        "settings": {
            "objectName": "person",
            "input": {
                "objectRecord": {
                    "id": "{{trigger.record.id}}",
                    "assignedRep": "{{trigger.record.createdBy.name.firstName | upcase}}_{{trigger.record.createdBy.name.lastName | upcase}}"
                }
            }
        }
    }
]

mutation = """
mutation UpdateWorkflowVersion($id: UUID!, $data: WorkflowVersionUpdateInput!) {
    updateWorkflowVersion(id: $id, data: $data) {
        id
        status
        steps
    }
}
"""

payload = {
    "query": mutation,
    "variables": {
        "id": VERSION_ID,
        "data": {
            "steps": steps
        }
    }
}

resp = requests.post(BASE_URL, headers=HEADERS, json=payload)
print(json.dumps(resp.json(), indent=2))
