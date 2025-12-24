# ADS Dashboard

Admiral Dialer System - Full-featured CRM and dialer dashboard.

## Features

- **Lead Management**: Import, classify, and manage leads with TCPA compliance
- **Dialer**: Click-to-call with Twilio integration
- **Pipeline**: Kanban-style lead progression
- **Calendar**: Twenty CRM calendar integration
- **Settings**: Configure integrations

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard |
| `/leads` | Lead list with CSV import |
| `/pipeline` | Pipeline/calendar view |
| `/dialer` | Phone dialer |
| `/settings` | App configuration |

## Backend

- Twenty CRM: `192.168.1.23:3001`
- Twilio: `192.168.1.23:4115`
