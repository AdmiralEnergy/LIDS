# Codex Implementation Plan - Project 26

## System Prompt

```
You are setting up Tailscale meshnet connectivity between Windows devices
to enable remote ComfyUI control for video generation.

Context:
- AdmiralEnergy: GPU workstation with RTX 4060 Ti, runs ComfyUI
- DavidME-Flow: Surface Pro 9, used by Leigh as remote controller
- admiral-server: Already on Tailscale (100.66.42.81)
- DO Droplet: Already on Tailscale (100.94.207.1)

Goal:
- Both Windows devices on Tailscale meshnet
- ComfyUI controllable remotely via HTTP API
- video-generator service uses Tailscale to reach ComfyUI

Current machine: AdmiralEnergy (GPU Desktop)
```

---

## Phase 1: Install Tailscale on AdmiralEnergy

### Task 1.1: Download and Install

**Manually perform on AdmiralEnergy:**

1. Open browser, go to: `https://tailscale.com/download/windows`
2. Click "Download Tailscale for Windows"
3. Run the installer
4. When prompted, click "Connect"
5. Sign in with Tailscale account (same as admiral-server uses)

### Task 1.2: Verify Installation

**In PowerShell (as Administrator):**

```powershell
# Check if Tailscale is running
tailscale status

# Get your Tailscale IP
tailscale ip -4
```

**Expected output:**
```
100.x.x.x    AdmiralEnergy    davide@  windows  -
100.66.42.81 admiral-server   davide@  linux    active
100.94.207.1 ubuntu-droplet   davide@  linux    active
```

### Task 1.3: Record IP Address

**Save the Tailscale IP for AdmiralEnergy:**

```powershell
# This will be something like 100.105.123.45
tailscale ip -4
```

Update the Infrastructure Registry with this IP.

### Task 1.4: Verify from admiral-server

```bash
# SSH to admiral-server
ssh edwardsdavid913@192.168.1.23

# Check Tailscale status
tailscale status

# Ping AdmiralEnergy
tailscale ping AdmiralEnergy
```

---

## Phase 2: Install Tailscale on DavidME-Flow

### Task 2.1: Download and Install

**On Surface Pro 9:**

Same steps as Phase 1:
1. Download from: `https://tailscale.com/download/windows`
2. Run installer
3. Connect and authenticate

### Task 2.2: Verify Mesh

```powershell
# Check status - should show all 4 devices
tailscale status
```

**Expected:**
```
100.x.x.x    AdmiralEnergy    davide@  windows  active
100.y.y.y    DavidME-Flow     davide@  windows  -
100.66.42.81 admiral-server   davide@  linux    active
100.94.207.1 ubuntu-droplet   davide@  linux    active
```

### Task 2.3: Test Cross-Device Connectivity

```powershell
# From Surface Pro 9, ping AdmiralEnergy
ping 100.x.x.x

# Test SSH to admiral-server
ssh edwardsdavid913@100.66.42.81
```

---

## Phase 3: Create ComfyUI Controller

### Task 3.1: Create Service Directory

**On AdmiralEnergy:**

```powershell
mkdir C:\LifeOS\services\comfyui-controller
cd C:\LifeOS\services\comfyui-controller
```

### Task 3.2: Initialize Node.js Project

```powershell
npm init -y
npm install express
```

### Task 3.3: Create Controller Script

**File: C:\LifeOS\services\comfyui-controller\server.js**

```javascript
const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 4300;
const COMFYUI_PATH = 'C:\\ComfyUI';  // Adjust to actual ComfyUI location

let comfyProcess = null;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'comfyui-controller',
    comfyPath: COMFYUI_PATH
  });
});

// Check if ComfyUI is running
app.get('/comfyui/status', async (req, res) => {
  try {
    // Try to reach ComfyUI
    const response = await fetch('http://localhost:8188/system_stats', {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const stats = await response.json();
      res.json({ running: true, stats });
    } else {
      res.json({ running: false });
    }
  } catch {
    res.json({ running: false });
  }
});

// Start ComfyUI
app.post('/comfyui/start', (req, res) => {
  if (comfyProcess) {
    return res.json({ success: false, error: 'Already running' });
  }

  try {
    // Start ComfyUI in background
    comfyProcess = spawn('python', ['main.py', '--listen', '0.0.0.0'], {
      cwd: COMFYUI_PATH,
      detached: true,
      stdio: 'ignore'
    });

    comfyProcess.unref();

    res.json({
      success: true,
      message: 'ComfyUI starting...',
      pid: comfyProcess.pid
    });

    // Clear reference after a moment
    setTimeout(() => {
      comfyProcess = null;
    }, 5000);

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Stop ComfyUI
app.post('/comfyui/stop', (req, res) => {
  exec('taskkill /F /IM python.exe /FI "WINDOWTITLE eq ComfyUI*"', (err, stdout) => {
    if (err && !stdout.includes('not found')) {
      // Try broader kill
      exec('taskkill /F /IM python.exe', (err2) => {
        res.json({ success: !err2, message: 'Killed all Python processes' });
      });
    } else {
      res.json({ success: true, message: 'ComfyUI stopped' });
    }
  });
  comfyProcess = null;
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ComfyUI Controller running on port ${PORT}`);
  console.log(`ComfyUI path: ${COMFYUI_PATH}`);
});
```

### Task 3.4: Create Startup Script

**File: C:\LifeOS\services\comfyui-controller\start.bat**

```batch
@echo off
cd /d C:\LifeOS\services\comfyui-controller
node server.js
```

### Task 3.5: Run Controller

```powershell
cd C:\LifeOS\services\comfyui-controller
node server.js
```

### Task 3.6: Test Controller

```powershell
# From PowerShell
curl http://localhost:4300/health
curl http://localhost:4300/comfyui/status
```

---

## Phase 4: Update Video Generator

### Task 4.1: Update Environment Variables

**On admiral-server:**

```bash
ssh edwardsdavid913@192.168.1.23
cd ~/LifeOS-Core/agents/infrastructure/video-generator

# Update .env or PM2 ecosystem
# Replace 192.168.1.15 with Tailscale IP (100.x.x.x)
echo "COMFYUI_HOST=100.x.x.x:8188" >> .env
echo "COMFYUI_CONTROLLER=100.x.x.x:4300" >> .env
```

### Task 4.2: Restart Video Generator

```bash
pm2 restart video-generator
pm2 logs video-generator --lines 20
```

### Task 4.3: Test End-to-End

```bash
# Check ComfyUI status via controller (through Tailscale)
curl http://100.x.x.x:4300/comfyui/status

# Test video-generator health
curl http://localhost:4200/health
```

---

## Phase 5: Add Auto-Start to GenerationPanel

### Task 5.1: Update GenerationPanel.tsx

**File: apps/studio/client/src/components/create/steps/GenerationPanel.tsx**

Add remote start capability:

```typescript
// Add to handleGenerate function, before the generation call
const handleStartComfyUI = async () => {
  try {
    const response = await fetch('/api/video-gen/comfyui/start', {
      method: 'POST'
    });
    if (response.ok) {
      // Wait for ComfyUI to start
      setStatus('queued');
      await new Promise(r => setTimeout(r, 10000));
      // Refresh ComfyUI status
      checkComfyUI();
    }
  } catch (err) {
    setError('Failed to start ComfyUI');
  }
};
```

### Task 5.2: Add Start Button to UI

```tsx
{/* ComfyUI Offline State */}
{comfyuiStatus && !comfyuiStatus.connected && status === 'idle' && (
  <div className="space-y-3">
    <div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
      <p className="text-yellow-400 text-sm">
        ComfyUI is offline. Start it remotely or use Demo Mode.
      </p>
    </div>
    <div className="flex gap-3">
      <Button
        onClick={handleStartComfyUI}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
      >
        <Cpu className="w-4 h-4 mr-2" />
        Start ComfyUI Remotely
      </Button>
      <Button
        onClick={() => setProvider('mock')}
        variant="outline"
        className="flex-1"
      >
        Use Demo Mode
      </Button>
    </div>
  </div>
)}
```

---

## Verification Checklist

### Phase 1: AdmiralEnergy on Tailscale
- [ ] Tailscale installed and authenticated
- [ ] Shows in `tailscale status` from admiral-server
- [ ] Tailscale IP recorded (100.x.x.x)

### Phase 2: Surface Pro 9 on Tailscale
- [ ] Tailscale installed and authenticated
- [ ] Shows in `tailscale status` from admiral-server
- [ ] Can ping AdmiralEnergy from Surface

### Phase 3: ComfyUI Controller
- [ ] Controller service running on AdmiralEnergy:4300
- [ ] `/health` returns OK
- [ ] `/comfyui/status` returns correct state
- [ ] `/comfyui/start` successfully starts ComfyUI
- [ ] `/comfyui/stop` successfully stops ComfyUI

### Phase 4: Video Generator Integration
- [ ] COMFYUI_HOST updated to Tailscale IP
- [ ] video-generator can check ComfyUI status
- [ ] video-generator can trigger ComfyUI start

### Phase 5: Studio UI
- [ ] "Start ComfyUI Remotely" button appears when offline
- [ ] Button successfully triggers remote start
- [ ] Status updates after remote start

---

## Troubleshooting

### Tailscale not connecting
```powershell
# Check Tailscale service
Get-Service Tailscale
Start-Service Tailscale

# Re-authenticate
tailscale logout
tailscale login
```

### Controller can't start ComfyUI
1. Check COMFYUI_PATH in server.js
2. Ensure Python is in PATH
3. Check ComfyUI directory structure

### Video generator can't reach controller
1. Verify Tailscale IP is correct
2. Check firewall allows port 4300
3. Test with direct curl from admiral-server

---

## Rollback

1. **Tailscale:** Uninstall from Control Panel, use Parsec instead
2. **Controller:** Kill node process, start ComfyUI manually
3. **Video generator:** Set COMFYUI_HOST back to local IP

---

*Created: 2026-01-03*
