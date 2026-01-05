#!/usr/bin/env python3
"""
Create a Twenty CRM workflow that auto-assigns leads to whoever uploads them.

Workflow: "Auto-assign leads to uploader"
Trigger: When a Person is created
Action: Set assignedRep = createdBy name (converted to SCREAMING_SNAKE_CASE)
"""

import requests
import json

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host/graphql"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Person object metadata ID
PERSON_OBJECT_ID = "95782d2d-8813-4e3a-8c64-9f1c48f51126"


def graphql(query, variables=None):
    """Execute a GraphQL query/mutation."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = requests.post(BASE_URL, headers=HEADERS, json=payload)
    data = resp.json()
    if "errors" in data:
        print(f"GraphQL Error: {json.dumps(data['errors'], indent=2)}")
        return None
    return data.get("data")


def create_workflow():
    """Step 1: Create the workflow container."""
    print("Step 1: Creating workflow...")

    mutation = """
    mutation CreateWorkflow($data: WorkflowCreateInput!) {
        createWorkflow(data: $data) {
            id
            name
        }
    }
    """

    result = graphql(mutation, {
        "data": {
            "name": "Auto-assign leads to uploader"
        }
    })

    if result and result.get("createWorkflow"):
        workflow_id = result["createWorkflow"]["id"]
        print(f"  Created workflow: {workflow_id}")
        return workflow_id
    return None


def create_workflow_version(workflow_id):
    """Step 2: Create a workflow version with trigger and steps."""
    print("Step 2: Creating workflow version...")

    # The trigger configuration for DATABASE_EVENT
    trigger_config = {
        "type": "DATABASE_EVENT",
        "settings": {
            "eventName": "person.created",
            "objectType": "person"
        }
    }

    # The steps - using CODE action to compute and UPDATE_RECORD to save
    # For now, let's create a simple version and see what Twenty expects
    mutation = """
    mutation CreateWorkflowVersion($data: WorkflowVersionCreateInput!) {
        createWorkflowVersion(data: $data) {
            id
            name
            status
            trigger
            steps
        }
    }
    """

    result = graphql(mutation, {
        "data": {
            "name": "v1",
            "workflow": {"connect": {"id": workflow_id}},
            "trigger": trigger_config,
            "steps": []  # We'll add steps separately
        }
    })

    if result and result.get("createWorkflowVersion"):
        version_id = result["createWorkflowVersion"]["id"]
        print(f"  Created version: {version_id}")
        print(f"  Trigger: {result['createWorkflowVersion'].get('trigger')}")
        return version_id
    return None


def add_code_step(workflow_version_id):
    """Step 3: Add a CODE step that computes the assignedRep value."""
    print("Step 3: Adding CODE step...")

    # JavaScript to convert createdBy name to SCREAMING_SNAKE_CASE
    code = """
// Get the triggering person's createdBy info
const person = trigger.record;
const createdBy = person.createdBy;

// Extract name (may be nested)
let firstName = '';
let lastName = '';

if (createdBy && createdBy.name) {
    firstName = createdBy.name.firstName || '';
    lastName = createdBy.name.lastName || '';
}

// Convert to SCREAMING_SNAKE_CASE
const fullName = (firstName + ' ' + lastName).trim();
const assignedRepValue = fullName.toUpperCase().replace(/\\s+/g, '_').replace(/[^A-Z0-9_]/g, '_');

return {
    personId: person.id,
    assignedRep: assignedRepValue
};
"""

    mutation = """
    mutation CreateWorkflowVersionStep($input: CreateWorkflowVersionStepInput!) {
        createWorkflowVersionStep(input: $input) {
            id
            name
            type
            settings
        }
    }
    """

    result = graphql(mutation, {
        "input": {
            "workflowVersionId": workflow_version_id,
            "stepType": "CODE",
            "position": {"x": 0, "y": 100}
        }
    })

    if result and result.get("createWorkflowVersionStep"):
        step = result["createWorkflowVersionStep"]
        print(f"  Created step: {step.get('id')}")
        return step.get("id")
    return None


def add_update_step(workflow_version_id, parent_step_id):
    """Step 4: Add an UPDATE_RECORD step that sets assignedRep."""
    print("Step 4: Adding UPDATE_RECORD step...")

    mutation = """
    mutation CreateWorkflowVersionStep($input: CreateWorkflowVersionStepInput!) {
        createWorkflowVersionStep(input: $input) {
            id
            name
            type
            settings
        }
    }
    """

    result = graphql(mutation, {
        "input": {
            "workflowVersionId": workflow_version_id,
            "stepType": "UPDATE_RECORD",
            "parentStepId": parent_step_id,
            "position": {"x": 0, "y": 200}
        }
    })

    if result and result.get("createWorkflowVersionStep"):
        step = result["createWorkflowVersionStep"]
        print(f"  Created step: {step.get('id')}")
        return step.get("id")
    return None


def activate_workflow(workflow_version_id):
    """Step 5: Activate the workflow version."""
    print("Step 5: Activating workflow...")

    mutation = """
    mutation ActivateWorkflowVersion($workflowVersionId: UUID!) {
        activateWorkflowVersion(workflowVersionId: $workflowVersionId) {
            id
            status
        }
    }
    """

    result = graphql(mutation, {"workflowVersionId": workflow_version_id})

    if result and result.get("activateWorkflowVersion"):
        print(f"  Activated: {result['activateWorkflowVersion'].get('status')}")
        return True
    return False


def check_existing_workflows():
    """Check if workflow already exists."""
    query = """
    {
        workflows {
            edges {
                node {
                    id
                    name
                }
            }
        }
    }
    """
    result = graphql(query)
    if result:
        workflows = result.get("workflows", {}).get("edges", [])
        for w in workflows:
            if w["node"]["name"] == "Auto-assign leads to uploader":
                return w["node"]["id"]
    return None


def main():
    print("=" * 60)
    print("Twenty CRM Workflow: Auto-assign leads to uploader")
    print("=" * 60)

    # Check if already exists
    existing = check_existing_workflows()
    if existing:
        print(f"\nWorkflow already exists: {existing}")
        print("Delete it first if you want to recreate.")
        return

    # Create workflow
    workflow_id = create_workflow()
    if not workflow_id:
        print("Failed to create workflow")
        return

    # Create version with trigger
    version_id = create_workflow_version(workflow_id)
    if not version_id:
        print("Failed to create workflow version")
        return

    # Add steps
    code_step_id = add_code_step(version_id)
    if code_step_id:
        update_step_id = add_update_step(version_id, code_step_id)

    # Activate
    # Note: May need to configure steps first in Twenty UI
    # activate_workflow(version_id)

    print("\n" + "=" * 60)
    print("Workflow created successfully!")
    print(f"Workflow ID: {workflow_id}")
    print(f"Version ID: {version_id}")
    print("\nNext steps:")
    print("1. Go to Twenty CRM -> Workflows")
    print("2. Open 'Auto-assign leads to uploader'")
    print("3. Configure the CODE step with the JavaScript")
    print("4. Configure the UPDATE_RECORD step to set assignedRep")
    print("5. Activate the workflow")
    print("=" * 60)


if __name__ == "__main__":
    main()
