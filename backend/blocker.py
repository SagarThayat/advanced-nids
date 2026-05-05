import subprocess
import re
import os

def block_ip(ip):
    """
    Block IP using Windows Firewall (netsh).
    Returns True if blocked successfully.
    """
    if not ip or not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip):
        print(f"❌ Invalid IP: {ip}")
        return False
    
    rule_name = f"blockIP_{ip.replace('.', '_')}"
    cmd = [
        'netsh', 'advfirewall', 'firewall', 'add', 'rule',
        f'name={rule_name}',
        'dir=in', 'action=block', f'remoteip={ip}'
    ]
    
    print(f"🔨 Blocking {ip}...")
    try:
        # Run as admin required
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ BLOCKED {ip} '{rule_name}' OK!")
        print(f"  Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ BLOCK FAIL {ip}")
        print(f"  Error: {e.stderr.strip()}")
        print(f"  CMD: {' '.join(cmd)}")
        return False
    except Exception as e:
        print(f"💥 Exception blocking {ip}: {e}")
        return False

def unblock_ip(ip):
    rule_name = f"blockIP_{ip.replace('.', '_')}"
    cmd = [
        'netsh', 'advfirewall', 'firewall', 'delete', 'rule',
        f'name={rule_name}'
    ]
    
    try:
        subprocess.run(cmd, capture_output=True, text=True)
        print(f"🔓 Unblocked {ip}")
    except:
        pass

def list_blocked_ips():
    try:
        result = subprocess.run(['netsh', 'advfirewall', 'firewall', 'show', 'rule', 'name=all'], 
                               capture_output=True, text=True)
        blocked = re.findall(r'blockIP_(\d+_\d+_\d+_\d+).*RemoteIP:(\S+)', result.stdout)
        return [ip for _, ip in blocked]
    except:
        return []

if __name__ == "__main__":
    block_ip("192.168.1.100")
    print("Blocked IPs:", list_blocked_ips())

