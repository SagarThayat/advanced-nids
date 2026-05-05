from flask import Flask, jsonify
from flask_cors import CORS
from packet_capture import PacketCapture
import threading
import time
import atexit

app = Flask(__name__)
CORS(app)  # Allow React frontend

capture = PacketCapture()
capture_thread = None

def capture_loop():
    """Infinite capture for real-time."""
    capture.start_capture(iface=None)  # No count = infinite

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
    from blocker import block_ip
    success = block_ip(ip)
    return jsonify({'success': success, 'ip': ip})

@app.route('/start')
def start():
    global capture_thread
    if capture_thread and capture_thread.is_alive():
        return jsonify({'status': 'already running'})
    capture.running = True
    capture_thread = threading.Thread(target=capture_loop, daemon=True)
    capture_thread.start()
    return jsonify({'status': 'started'})

@app.route('/stop')
def stop():
    capture.stop_capture()
    return jsonify({'status': 'stopped'})

if __name__ == '__main__':
    print("NIDS Backend starting... Run as ADMIN!")
    print("API: http://127.0.0.1:5000 (status)")
    atexit.register(capture.stop_capture)
    app.run(host='127.0.0.1', port=5000, debug=True)

