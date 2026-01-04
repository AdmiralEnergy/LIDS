# Codex Implementation Plan - Project 27

## System Prompt

```
You are enabling Tailscale SSH across the LifeOS infrastructure to create
unified authentication for all devices and servers.

Context:
- 4 machines on Tailscale meshnet (admiral-server, droplet, Desktop, Surface Pro 9)
- Oracle ARM instance needs to be added to tailnet
- Current SSH key management is fragmented and confusing
- Goal: Any device on tailnet can SSH to any server via Tailscale identity

Tailscale IPs:
- admiral-server: 100.66.42.81
- DO Droplet: 100.94.207.1
- AdmiralEnergy (Desktop): 100.87.154.70
- DavidME-Flow (Surface Pro 9): 100.111.38.18
```

---

## Phase 1: Enable Tailscale SSH on Droplet

### Task 1.1: SSH to Droplet (via console or existing key)

Access droplet via DigitalOcean Console or existing SSH access.

### Task 1.2: Enable Tailscale SSH

```bash
# Check current Tailscale status
tailscale status

# Enable SSH
tailscale set --ssh

# Verify
tailscale status
```

### Task 1.3: Test from Surface Pro 9

```powershell
# From Surface Pro 9
ssh root@100.94.207.1
```

---

## Phase 2: Enable Tailscale SSH on Admiral-Server

### Task 2.1: SSH to Admiral-Server

```bash
ssh edwardsdavid913@100.66.42.81
```

### Task 2.2: Enable Tailscale SSH

```bash
# Enable SSH
sudo tailscale set --ssh

# Verify
tailscale status
```

### Task 2.3: Test from Surface Pro 9

```powershell
ssh edwardsdavid913@100.66.42.81
```

---

## Phase 3: Add Oracle ARM to Tailscale

### Task 3.1: SSH to Oracle ARM

```bash
# From admiral-server (has oci_arm key)
ssh -i ~/.ssh/oci_arm ubuntu@193.122.153.249
```

### Task 3.2: Install Tailscale

```bash
# Add Tailscale repo
curl -fsSL https://tailscale.com/install.sh | sh

# Start and authenticate
sudo tailscale up

# Enable SSH
sudo tailscale set --ssh
```

### Task 3.3: Record Tailscale IP

```bash
tailscale ip -4
# Record this IP for Infrastructure Registry
```

---

## Phase 4: Test All Access Paths

### From Surface Pro 9:

```powershell
# Test all servers
ssh root@100.94.207.1              # Droplet
ssh edwardsdavid913@100.66.42.81   # Admiral-server
ssh ubuntu@<oracle-tailscale-ip>   # Oracle ARM
```

### From Admiral-Server:

```bash
ssh root@100.94.207.1              # Droplet
ssh ubuntu@<oracle-tailscale-ip>   # Oracle ARM
```

---

## Phase 5: Cleanup and Documentation

### Task 5.1: Update Infrastructure Registry

Add Tailscale SSH status to all machines.

### Task 5.2: Secure SSH_KEY_ARCHITECTURE.md

1. Copy sensitive data to NordPass
2. Remove plaintext keys from .md file
3. Add note pointing to NordPass location

### Task 5.3: Update Project Status

Mark project complete.

---

## Verification Checklist

- [ ] Tailscale SSH enabled on Droplet
- [ ] Tailscale SSH enabled on Admiral-Server
- [ ] Oracle ARM on tailnet with Tailscale SSH
- [ ] Surface Pro 9 can SSH to all servers
- [ ] Desktop can SSH to all servers
- [ ] Admiral-Server can SSH to Droplet and Oracle ARM
- [ ] SSH_KEY_ARCHITECTURE.md secured
- [ ] Infrastructure Registry updated

---

## Rollback

If Tailscale SSH causes issues:

```bash
# Disable Tailscale SSH
tailscale set --ssh=false

# Fall back to traditional SSH keys
# Keys documented in SSH_KEY_ARCHITECTURE.md
```

---

*Created: 2026-01-04*
