# Project 27: Tailscale SSH Authentication

**Status:** PLANNING
**Started:** 2026-01-04
**Owner:** David Edwards
**Priority:** P1 (Infrastructure simplification)

---

## Overview

Replace traditional SSH key management with Tailscale SSH for unified authentication across all devices and servers.

**Problem:** Each server has its own `authorized_keys` file. Every device needs its key manually added to every server. This creates N x M key management overhead and confusion.

**Solution:** Enable Tailscale SSH on all servers. Any device on the tailnet can SSH using their Tailscale identity. Zero key management.

---

## Current State

| From → To | Droplet | Admiral-Server | Oracle ARM |
|-----------|---------|----------------|------------|
| Surface Pro 9 | NO | YES | NO |
| Desktop | MAYBE | YES | NO |
| Admiral-Server | NO | - | YES |

**Pain Points:**
- Surface Pro 9 cannot SSH to droplet (key not registered)
- Admiral-server cannot SSH to droplet (key not registered)
- Manual key management across 4+ machines
- No single source of auth truth

---

## Target State

| From → To | Droplet | Admiral-Server | Oracle ARM |
|-----------|---------|----------------|------------|
| Surface Pro 9 | YES | YES | YES |
| Desktop | YES | YES | YES |
| Admiral-Server | YES | - | YES |

**How:** Tailscale SSH enabled on all servers. Auth via Tailscale identity.

---

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Enable Tailscale SSH on Droplet | Pending |
| Phase 2 | Enable Tailscale SSH on Admiral-Server | Pending |
| Phase 3 | Add Oracle ARM to Tailscale + Enable SSH | Pending |
| Phase 4 | Test all access paths | Pending |
| Phase 5 | Document and secure credentials | Pending |

---

## Machines

| Machine | Tailscale IP | SSH User | Status |
|---------|--------------|----------|--------|
| admiral-server | 100.66.42.81 | edwardsdavid913 | On tailnet |
| DO Droplet | 100.94.207.1 | root | On tailnet |
| AdmiralEnergy (Desktop) | 100.87.154.70 | - | On tailnet |
| DavidME-Flow (Surface Pro 9) | 100.111.38.18 | - | On tailnet |
| Oracle ARM | 193.122.153.249 | ubuntu | NOT on tailnet |

---

## Success Criteria

- [ ] Can SSH from Surface Pro 9 to Droplet via `ssh root@100.94.207.1`
- [ ] Can SSH from Surface Pro 9 to Admiral-Server via `ssh edwardsdavid913@100.66.42.81`
- [ ] Can SSH from Admiral-Server to Droplet
- [ ] Oracle ARM on tailnet and accessible
- [ ] No manual key management required for new devices
- [ ] SSH_KEY_ARCHITECTURE.md secured in NordPass

---

## Related Documentation

- [SSH_KEY_ARCHITECTURE.md](../../../LifeOS-Core/docs/SSH_KEY_ARCHITECTURE.md) - All keys documented
- [Project 26: Tailscale Meshnet Setup](../26-tailscale-meshnet-setup/README.md) - Meshnet already complete
- [Infrastructure Registry](../../../LifeOS-Core/docs/Admiral%20Energy%20Infrastructure%20Registry%20v2.3.md)

---

*Last Updated: 2026-01-04*
