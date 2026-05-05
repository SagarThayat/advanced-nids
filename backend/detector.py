import time
from collections import defaultdict, deque
from datetime import datetime, timedelta

class AttackDetector:
    def __init__(self):
        # IP stats tracking
        self.ip_stats = defaultdict(lambda: {
            'pkts': deque(maxlen=60),
            'syn_ports': set(),
            'auth_fails': deque(maxlen=60),
            'last_update': time.time()
        })
        self.alerts = []

    def update_packet(self, pkt, src_ip):
        now = time.time()
        stats = self.ip_stats[src_ip]
        stats['pkts'].append(now)
        if hasattr(pkt, 'haslayer') and pkt.haslayer('TCP') and pkt['TCP'].flags & 0x02:
            stats['syn_ports'].add(pkt['TCP'].dport)
        stats['last_update'] = now

    def update_auth_fail(self, src_ip):
        self.ip_stats[src_ip]['auth_fails'].append(time.time())

    def detect_attacks(self):
        now = time.time()
        alerts = []
        to_block = []

        for ip, stats in list(self.ip_stats.items()):
            if now - stats['last_update'] > 300:
                del self.ip_stats[ip]
                continue

            recent_pkts = sum(1 for t in stats['pkts'] if now - t < 60)
            print(f"🔍 {ip}: {recent_pkts}p/min, {len(stats['syn_ports'])} ports")
            if recent_pkts > 20:
                msg = f"DDoS {ip}: {recent_pkts}p/min"
                alerts.append(msg)
                to_block.append(ip)
                print(f"🚨 {msg} → BLOCK!")
            if len(stats['syn_ports']) > 3:
                msg = f"Port Scan {ip}: {len(stats['syn_ports'])} ports"
                alerts.append(msg)
                to_block.append(ip)
                print(f"🚨 {msg} → BLOCK!")

            recent_fails = sum(1 for t in stats['auth_fails'] if now - t < 60)
            if recent_fails > 5:
                alerts.append(f"Brute Force {ip}: {recent_fails} fails")
                to_block.append(ip)

        self.alerts.extend(alerts[-10:])
        print(f"📋 New alerts: {len(alerts)}, Blocks: {to_block}")
        return alerts, list(set(to_block))

    def get_stats(self):
        return [
            {'ip': ip, 'pkts_per_min': len(s['pkts']), 'syn_ports': len(s['syn_ports'])}
            for ip, s in list(self.ip_stats.items())
        ]

    def add_alert(self, msg):
        self.alerts.append(f"{datetime.now().strftime('%H:%M:%S')}: {msg}")

