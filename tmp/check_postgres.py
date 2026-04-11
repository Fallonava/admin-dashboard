import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_HOST = "192.168.1.12"
SSH_PORT = 22
SSH_USER = "fallonava"

def check(password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=password, timeout=30)
    print("Mengecek proses PostgreSQL yang berjalan (Docker/Native)...")
    
    # Cek proses postgresql (native atau lewat docker)
    cmd = "ps aux | grep postgres"
    stdin, stdout, stderr = client.exec_command(cmd)
    print(f"\n[ps aux]\n{stdout.read().decode('utf-8').strip()}")
    
    # Cek docker containers
    cmd = "sudo docker ps | grep postgres || echo 'Bukan docker / tidak ditemukan'"
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    import time; time.sleep(1)
    stdin.write(password + '\n'); stdin.flush()
    stdout.channel.recv_exit_status()
    print(f"\n[docker ps]\n{stdout.read().decode('utf-8').strip()}")
    
    client.close()

if __name__ == "__main__":
    pwd = input(f"Password SSH {SSH_USER}@{SSH_HOST}: ")
    check(pwd)
