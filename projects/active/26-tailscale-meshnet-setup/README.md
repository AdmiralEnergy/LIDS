# Project 26: Tailscale Meshnet Setup

**Status:** PHASE 1-3 COMPLETE
**Started:** 2026-01-03
**Completed (Mesh):** 2026-01-04
**Owner:** David Edwards
**Priority:** P1 (Enables remote ComfyUI control)

---

## Overview

Install and configure Tailscale on all Windows devices to enable secure remote access between:

1. **AdmiralEnergy** (GPU Desktop) - RTX 4060 Ti, ComfyUI host
2. **DavidME-Flow** (Surface Pro 9) - Leigh's remote controller

This enables Leigh to remotely start/stop ComfyUI services on the GPU workstation for video generation in Studio.

---

## Current State

| Device | IP Address | Tailscale IP | Status |
|--------|------------|--------------|--------|
| **admiral-server** | 192.168.1.23 | 100.66.42.81 | ✅ Connected |
| **DO Droplet** | 165.227.111.24 | 100.94.207.1 | ✅ Connected |
| **AdmiralEnergy** | 192.168.1.15 | 100.87.154.70 | ✅ Connected |
| **DavidME-Flow** | Dynamic | 100.111.38.18 | ✅ Connected |

---

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Install Tailscale on AdmiralEnergy (Desktop) | ✅ **COMPLETE** |
| Phase 2 | Install Tailscale on DavidME-Flow (Surface Pro 9) | ✅ **COMPLETE** |
| Phase 3 | Verify mesh connectivity | ✅ **COMPLETE** |
| Phase 4 | Create ComfyUI Service Controller | Pending |
| Phase 5 | Add remote start button to Studio | Pending |

---

## Phase 1: AdmiralEnergy Setup

### Step 1: Download Tailscale

1. Go to: https://tailscale.com/download/windows
2. Download and run installer
3. Click "Connect" in system tray
4. Authenticate with Tailscale account

### Step 2: Verify Connection

```powershell
# Check Tailscale status
tailscale status

# Should show admiral-server and Droplet
```

### Step 3: Get Tailscale IP

```powershell
tailscale ip -4
# Record this IP (100.x.x.x)
```

### Expected Result

```
100.x.x.x    AdmiralEnergy    davide@  windows  -
100.66.42.81 admiral-server   davide@  linux    active
100.94.207.1 ubuntu-droplet   davide@  linux    active
```

---

## Phase 2: DavidME-Flow (Surface Pro 9) Setup

Same steps as Phase 1, but on the Surface Pro 9.

### Expected Result

All 4 devices connected:
```
100.x.x.x    AdmiralEnergy    davide@  windows  active
100.y.y.y    DavidME-Flow     davide@  windows  active
100.66.42.81 admiral-server   davide@  linux    active
100.94.207.1 ubuntu-droplet   davide@  linux    active
```

---

## Phase 3: Verify Mesh Connectivity

### From Surface Pro 9:

```powershell
# Ping AdmiralEnergy via Tailscale
ping 100.x.x.x  # AdmiralEnergy's Tailscale IP

# SSH to admiral-server
ssh edwardsdavid913@100.66.42.81
```

### From admiral-server:

```bash
# Test connection to AdmiralEnergy
tailscale ping AdmiralEnergy
```

---

## Phase 4: ComfyUI Service Controller

Create a simple HTTP service on AdmiralEnergy that can:
- Start ComfyUI
- Stop ComfyUI
- Check ComfyUI status

### Service Location

```
AdmiralEnergy
├── C:\LifeOS\services\
│   └── comfyui-controller\
│       ├── server.js       # Express server on port 4300
│       └── package.json
```

### API Endpoints

```
GET  /health              → { status: "ok" }
GET  /comfyui/status      → { running: true/false, pid: 1234 }
POST /comfyui/start       → Starts ComfyUI, returns status
POST /comfyui/stop        → Stops ComfyUI, returns status
```

### Example Implementation

```javascript
// server.js
const express = require('express');
const { exec } = require('child_process');
const app = express();

const COMFYUI_PATH = 'C:\\ComfyUI';

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/comfyui/status', (req, res) => {
  exec('tasklist /FI "IMAGENAME eq python.exe"', (err, stdout) => {
    const running = stdout.includes('python.exe');
    res.json({ running });
  });
});

app.post('/comfyui/start', (req, res) => {
  exec(`start /D "${COMFYUI_PATH}" python main.py`, (err) => {
    res.json({ started: !err });
  });
});

app.post('/comfyui/stop', (req, res) => {
  exec('taskkill /F /IM python.exe', (err) => {
    res.json({ stopped: !err });
  });
});

app.listen(4300, '0.0.0.0', () => {
  console.log('ComfyUI Controller on port 4300');
});
```

---

## Phase 5: Studio Integration

Update video-generator service to use ComfyUI Controller:

### Environment Variable

```bash
# On admiral-server video-generator
COMFYUI_HOST=100.x.x.x:8188           # AdmiralEnergy Tailscale IP
COMFYUI_CONTROLLER=100.x.x.x:4300     # Controller API
```

### Remote Start Flow

```
Studio (Droplet)
    ↓
video-generator (admiral-server:4200)
    ↓
Check ComfyUI status at COMFYUI_HOST
    ↓
If offline → POST to COMFYUI_CONTROLLER/comfyui/start
    ↓
Wait for ComfyUI to be ready
    ↓
Send generation request
```

### UI Enhancement

Add "Start ComfyUI" button to GenerationPanel when ComfyUI is offline:

```tsx
// GenerationPanel.tsx
{!comfyuiStatus?.connected && (
  <Button onClick={handleStartComfyUI}>
    Start ComfyUI Remotely
  </Button>
)}
```

---

## Success Criteria

- [ ] AdmiralEnergy visible in `tailscale status` from admiral-server
- [ ] DavidME-Flow visible in `tailscale status` from admiral-server
- [ ] Can ping AdmiralEnergy from Surface Pro 9 via Tailscale
- [ ] ComfyUI Controller running on AdmiralEnergy:4300
- [ ] video-generator can reach ComfyUI via Tailscale IP
- [ ] Leigh can start ComfyUI from Studio without being physically present

---

## Network Topology (After Completion)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TAILSCALE MESHNET                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐           ┌─────────────────────────┐         │
│  │ AdmiralEnergy           │◄─────────►│ DavidME-Flow            │         │
│  │ 100.x.x.x               │           │ 100.y.y.y               │         │
│  │ • ComfyUI (:8188)       │           │ • Surface Pro 9         │         │
│  │ • Controller (:4300)    │           │ • Leigh's remote        │         │
│  └────────────┬────────────┘           └─────────────────────────┘         │
│               │                                                             │
│               │ Tailscale tunnel                                           │
│               │                                                             │
│  ┌────────────▼────────────┐           ┌─────────────────────────┐         │
│  │ admiral-server          │◄─────────►│ DO Droplet              │         │
│  │ 100.66.42.81            │           │ 100.94.207.1            │         │
│  │ • video-generator (:4200)│          │ • Studio (:3103)        │         │
│  │ • Agent-Claude (:4110)  │           │ • LIDS (:5000)          │         │
│  └─────────────────────────┘           └─────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Rollback Plan

1. **Tailscale issues:** Uninstall Tailscale from Windows devices, use Parsec as fallback
2. **ComfyUI Controller issues:** Manually start/stop ComfyUI via Parsec
3. **Video generator issues:** Revert to mock mode (already supported)

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Master reference with connection info
- [Infrastructure Registry](../../docs/architecture/Admiral%20Energy%20Infrastructure%20Registry%20v2.3.md)
- [Project 25: Studio Content Creation](../active/25-studio-content-creation-suite/README.md)

---

*Last Updated: 2026-01-03*
