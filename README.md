# Advanced Network Intrusion Prevention System (NIPS)

## Overview
Real-time packet capture, **detection + prevention** of DDoS, port scanning, brute force attacks. Dashboard with charts. **Auto-blocks suspicious IPs using Windows Firewall!**

**Note**: Requires **Administrator privileges** for packet sniffing (Scapy + Npcap) and firewall rules.

## Quick Start (Windows 11)
1. Install Npcap: Download from https://npcap.com/#download (Npcap 1.79+ required for Scapy).
2. Backend:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```
   - Runs on http://127.0.0.1:5000 (API)
3. Frontend:
   ```
   cd frontend
   npm install
   npm start
   ```
   - Opens http://localhost:3000 (Dashboard)
4. Access dashboard → View real-time alerts/charts/blocks.

## Features
- **Real-time Capture**: Scapy sniffs interface (default: first available).
- **Detections + Prevention**:
  | Attack | Threshold | Action |
  |--------|-----------|--------|
  | DDoS | >100 pkts/min/IP | Auto-block |
  | Port Scan | >10 unique SYN ports/IP | Auto-block |
  | Brute Force | >5 auth fails/min | Auto-block |
- **Auto-block**: Windows Firewall rule via netsh.
- **Dashboard**: Live charts (pkts/sec, ports), alerts, stats table.

## Architecture
```
advanced-nips/
├── backend/     (Flask API, Scapy detection, netsh blocking)
├── frontend/    (React + Recharts cyberpunk UI)
├── TODO.md
└── README.md
```

## Live Test
```
# Terminal 1 (Admin): Backend
python backend/app.py

# Terminal 2: Attack sim
powershell "1..110 | % { Test-NetConnection 127.0.0.1:80 -Quiet; Start-Sleep 0.5 }"

# Check: netsh advfirewall firewall show rule | findstr blockIP
# Dashboard: localhost:3001 → See "Port Scan" alert!
```

## Customization
- Interface: `backend/packet_capture.py` `iface='Wi-Fi'`
- Thresholds: `backend/detector.py`
- Unblock: `netsh advfirewall firewall delete rule name="blockIP_127_0_0_1"`

## Troubleshooting
- Scapy: Npcap + Admin
- No packets: Check `getiflist()` in Python
- Blocks not showing: Run backend as Admin

**Built**: Python/Flask/Scapy + React/Recharts. **NIPS Complete!** 🚀

