from flask import Flask, jsonify
from flask_cors import CORS
from packet_capture import PacketCapture
import threading
import time
import atexit
import os
import random

app = Flask(__name__)
CORS(app)

# Detect environment
IS_PRODUCTION = os.environ.get("RENDER", False)

capture = PacketCapture()
capture_thread = None

# -----------------------------
# REAL CAPTURE (LOCAL)
# -----------------------------
def capture_loop():
    capture.start_capture(iface=None)

# -----------------------------
# SIMULATION MODE (RENDER)
# -----------------------------
def simulation_loop():
    fake_ips = ["192.168.1.10", "10.0.0.5", "172.16.0.3"]
    attack_types = ["DDoS", "Port Scan", "Brute Force"]

    while capture.running:
        # fake packet count
        capture.detector.stats["packets"] += random.randint(5, 20)

        # random alert
        if random.random() > 0.6:
            alert = {
                "ip": random.choice(fake_ips),
                "type": random.choice(attack_types),
                "time": time.strftime("%H:%M:%S")
            }
            capture.detector.alerts.append(alert)
            capture.detector.stats["attacks"] += 1

        time.sleep(2)

# -----------------------------
# API ROUTES
# -----------------------------
@app.route('/api/status')
def status():
    return jsonify(capture.get_status())

@app.route('/api/alerts')
def alerts():
    return jsonify({'alerts': capture.detector.alerts})

@app.route('/api/stats')
def stats():
    return jsonify({'stats': capture.detector.get_stats()})

@app.route('/api/block/<ip>')
def manual_block(ip):
    try:
        from blocker import block_ip
        success = block_ip(ip)
    except:
        success = True  # simulation fallback
    return jsonify({'success': success, 'ip': ip})

@app.route('/start')
def start():
    global capture_thread

    if capture_thread and capture_thread.is_alive():
        return jsonify({'status': 'already running'})

    capture.running = True

    # 🔥 AUTO SWITCH
    if IS_PRODUCTION:
        print("⚠️ Running in SIMULATION mode (Render)")
        target_function = simulation_loop
    else:
        print("✅ Running REAL packet capture (Local)")
        target_function = capture_loop

    capture_thread = threading.Thread(target=target_function, daemon=True)
    capture_thread.start()

    return jsonify({'status': 'started'})

@app.route('/stop')
def stop():
    capture.stop_capture()
    return jsonify({'status': 'stopped'})

# -----------------------------
# RUN APP (DEPLOY READY)
# -----------------------------
def shutdown():
    capture.stop_capture()

atexit.register(shutdown)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))

    print("🚀 NIDS Backend starting...")
    print(f"Mode: {'SIMULATION' if IS_PRODUCTION else 'REAL'}")

    app.run(host='0.0.0.0', port=port)