#!/usr/bin/env python3
"""
Add custom fields to Twenty CRM custom objects for Studio Dashboard.
"""

import requests
import json

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZDQ0ZjY4YS0zMWUzLTQzNjEtOTU3Yy03MjRkYWE5NjEyNWYiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMmQ0NGY2OGEtMzFlMy00MzYxLTk1N2MtNzI0ZGFhOTYxMjVmIiwiaWF0IjoxNzY2NjYxMTI0LCJleHAiOjQ5MjAyNjExMjMsImp0aSI6ImZjOGJjYzcwLWRhOTgtNGNmZC05ZDczLTA3NmRkNWViMGQwZCJ9.6QDAuNGTpDgNRNeTCBa1uq0hxaKMeYtBA3YGxcv0Pj8"
BASE_URL = "https://twenty.ripemerchant.host/rest/metadata"

# Object IDs
CONTENT_ITEM_ID = "59076336-a524-410f-ac85-9c7ba5858c84"
WEEKLY_PLAN_ID = "a95fc0e3-6685-45cf-ba4d-2ccf4a72dfd4"
PROGRESSION_ID = "c55ddb2b-d734-4a1e-bcdd-bce928314c41"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

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

    response = requests.post(f"{BASE_URL}/fields", headers=headers, json=payload)

    if response.status_code == 200:
        data = response.json()
        field_name = data.get('data', {}).get('createOneField', {}).get('name', 'unknown')
        print(f"  [OK] Created: {field_name}")
        return True
    else:
        error = response.json()
        # Check if it's a "field already exists" error
        if "already exist" in str(error).lower():
            print(f"  - Skipped (exists): {name}")
            return True
        print(f"  [FAIL] Failed: {name} - {error}")
        return False

def main():
    print("\n=== Adding fields to studioContentItem ===")
    content_fields = [
        ("contentType", "Content Type", "TEXT", "video, image, text, carousel", "IconPhoto"),
        ("status", "Status", "TEXT", "idea, planned, scripted, assets, editing, review, scheduled, posted", "IconProgress"),
        ("scheduledDate", "Scheduled Date", "DATE_TIME", "When this content is scheduled to post", "IconCalendarEvent"),
        ("postedDate", "Posted Date", "DATE_TIME", "When this content was posted", "IconCalendarCheck"),
        ("script", "Script", "TEXT", "Content script or body text", "IconFileText"),
        ("caption", "Caption", "TEXT", "Social media caption", "IconMessage"),
        ("hashtags", "Hashtags", "TEXT", "Comma-separated hashtags", "IconHash"),
        ("museNotes", "MUSE Notes", "TEXT", "Why this content fits the strategy", "IconSparkles"),
        ("workflowStep", "Workflow Step", "NUMBER", "Current step in TikTok workflow (1-8)", "IconListNumbers"),
        ("assignedTo", "Assigned To", "TEXT", "leigh, sarai, or muse", "IconUser"),
        ("postizPostId", "Postiz Post ID", "TEXT", "Postiz API post ID", "IconLink"),
    ]

    for name, label, ftype, desc, icon in content_fields:
        add_field(CONTENT_ITEM_ID, name, label, ftype, desc, icon)

    print("\n=== Adding fields to studioWeeklyPlan ===")
    weekly_fields = [
        ("weekStart", "Week Start", "DATE_TIME", "Monday of the week", "IconCalendarEvent"),
        ("weekEnd", "Week End", "DATE_TIME", "Sunday of the week", "IconCalendarEvent"),
        ("suggestions", "Suggestions", "TEXT", "JSON array of content suggestions", "IconSparkles"),
        ("plannedCount", "Planned Count", "NUMBER", "Number of planned items", "IconListNumbers"),
        ("completedCount", "Completed Count", "NUMBER", "Number of completed items", "IconCheck"),
    ]

    for name, label, ftype, desc, icon in weekly_fields:
        add_field(WEEKLY_PLAN_ID, name, label, ftype, desc, icon)

    print("\n=== Adding fields to marketingProgression ===")
    progression_fields = [
        ("email", "Email", "TEXT", "User email", "IconMail"),
        ("totalXp", "Total XP", "NUMBER", "Cumulative experience points", "IconStar"),
        ("currentLevel", "Current Level", "NUMBER", "Calculated from XP", "IconTrendingUp"),
        ("rank", "Rank", "TEXT", "content-creator-1 through marketing-lead", "IconMedal"),
        ("badges", "Badges", "TEXT", "JSON array of badge IDs", "IconAward"),
        ("streakDays", "Streak Days", "NUMBER", "Consecutive activity days", "IconFlame"),
        ("lastActivityDate", "Last Activity Date", "DATE_TIME", "Last activity timestamp", "IconCalendarEvent"),
        ("longestStreak", "Longest Streak", "NUMBER", "Best streak achieved", "IconTrophy"),
        ("postsPublished", "Posts Published", "NUMBER", "Total posts published", "IconShare"),
        ("videosCreated", "Videos Created", "NUMBER", "Total videos created", "IconVideo"),
        ("totalEngagement", "Total Engagement", "NUMBER", "likes + comments + shares", "IconHeart"),
        ("coursesCompleted", "Courses Completed", "TEXT", "JSON array of course IDs", "IconCertificate"),
        ("titles", "Titles", "TEXT", "JSON array of earned titles", "IconCrown"),
        ("activeTitle", "Active Title", "TEXT", "Currently displayed title", "IconBadge"),
    ]

    for name, label, ftype, desc, icon in progression_fields:
        add_field(PROGRESSION_ID, name, label, ftype, desc, icon)

    print("\n[DONE] All fields added to Twenty CRM custom objects.")

if __name__ == "__main__":
    main()
