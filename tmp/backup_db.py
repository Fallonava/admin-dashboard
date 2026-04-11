import paramiko
import os
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_HOST     = "192.168.1.12"
SSH_PORT     = 22
SSH_USER     = "fallonava"

DB_USER     = "medcore"
DB_NAME     = "medcoredb"

TIMESTAMP   = datetime.now().strftime("%Y%m%d_%H%M%S")
REMOTE_FILE = f"/tmp/backup_hospital_{TIMESTAMP}.sql"
LOCAL_DIR   = os.path.dirname(os.path.abspath(__file__))
LOCAL_FILE  = os.path.join(LOCAL_DIR, f"backup_hospital_{TIMESTAMP}.sql")

def run_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="ignore").strip()
    err = stderr.read().decode("utf-8", errors="ignore").strip()
    return exit_code, out, err

def run_backup(password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"[*] Menghubungkan ke {SSH_USER}@{SSH_HOST}:{SSH_PORT}...")
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=password, timeout=30)
    print("[+] Terhubung!")

    # Jalankan pg_dump di DALAM container docker: medcore-postgres
    print("[*] Menjalankan pg_dump di dalam Docker container 'medcore-postgres'...")
    cmd = f"sudo docker exec -t medcore-postgres pg_dump -U {DB_USER} -d {DB_NAME} -Fc > {REMOTE_FILE}"
    
    # We use get_pty=True so we can provide sudo password
    stdin, stdout, stderr = client.exec_command(cmd, timeout=180, get_pty=True)
    import time; time.sleep(1)
    stdin.write(password + '\n'); stdin.flush()
    exit_code = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode("utf-8", errors="ignore").strip()
    err = stderr.read().decode("utf-8", errors="ignore").strip()

    if exit_code != 0:
        print(f"[!] Error saat pg_dump: {out or err}")
        client.close()
        return

    # Cek ukuran file
    code, out, err = run_cmd(client, f"ls -lh {REMOTE_FILE}")
    print(f"[+] File di server: {out}")

    # Download
    print(f"[*] Mendownload ke: {LOCAL_FILE}")
    sftp = client.open_sftp()
    sftp.get(REMOTE_FILE, LOCAL_FILE)
    sftp.close()

    # Hapus file temp
    run_cmd(client, f"rm -f {REMOTE_FILE}")
    client.close()

    size_kb = os.path.getsize(LOCAL_FILE) / 1024
    print(f"\n[DONE] Backup BERHASIL!")
    print(f"       File  : {LOCAL_FILE}")
    print(f"       Ukuran: {size_kb:.1f} KB")

if __name__ == "__main__":
    pwd = input(f"Password SSH {SSH_USER}@{SSH_HOST} (sudo): ")
    run_backup(pwd)
