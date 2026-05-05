from scapy.all import sniff, IP, TCP
import threading
import time
from detector import AttackDetector
from blocker import block_ip

class PacketCapture:
    def __init__(self):
        self.detector = AttackDetector()
        self.running = False
        self.lock = threading.Lock()
        self.alerts = []
        self.iface = None  # Auto-detect first

    def packet_handler(self, pkt):
        if IP in pkt:
            src_ip = pkt[IP].src
            with self.lock:
                self.detector.update_packet(pkt, src_ip)
                
                # Simulate brute force (HTTP 401 for demo)
                if TCP in pkt and pkt[TCP].dport == 80 and b'401' in pkt.payload:
                    self.detector.update_auth_fail(src_ip)

    def detection_loop(self):
        while self.running:
            with self.lock:
                alerts, to_block = self.detector.detect_attacks()
                for ip in to_block:
                    block_ip(ip)
            time.sleep(5)  # Check every 5s

    def start_capture(self, iface=None, count=0):
        if iface:
            self.iface = iface
        print(f"Starting capture on {self.iface or 'default'} iface. Run as admin!")
        self.running = True
        
        # Detection thread
        detect_thread = threading.Thread(target=self.detection_loop, daemon=True)
        detect_thread.start()
        
        # Sniff thread
        def sniff_callback(pkt):
            self.packet_handler(pkt)
            
        sniff(iface=self.iface, prn=sniff_callback, store=0, stop_filter=lambda _: not self.running, count=count)

    def stop_capture(self):
        self.running = False

    def get_status(self):
        with self.lock:
            stats = self.detector.get_stats()
            return {
                'stats': stats,
                'alerts': self.detector.alerts[-20:],  # Last 20
                'blocked_ips': []  # From blocker.list_blocked_ips()
            }

# Test (run as admin)
if __name__ == "__main__":
    cap = PacketCapture()
    try:
        cap.start_capture(iface=None, count=1000)  # Capture 1000 pkts
    except KeyboardInterrupt:
        cap.stop_capture()

