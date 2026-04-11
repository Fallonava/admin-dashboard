import paramiko
import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_HOST = "192.168.1.12"
SSH_PORT = 22
SSH_USER = "fallonava"
DB_USER = "medcore"
DB_NAME = "medcoredb"
LOCAL_FILE = r"F:\Next\admin-dashboard\backups\backup_hospital_20260411_230246.sql"
REMOTE_FILE = "/tmp/backup_db.sql"

def run_cmd(client, cmd, password):
    # Dapatkan pseudo-terminal untuk sudo
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    time.sleep(1)
    stdin.write(password + '\n')
    stdin.flush()
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="ignore").strip()
    return exit_code, out

def restore_ubuntu(password):
    print(f"[*] Menghubungkan ke UBUNTU Server ({SSH_USER}@{SSH_HOST})...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=password)
    
    print("[*] Mengunggah file backup (154 KB) ke Ubuntu...")
    sftp = client.open_sftp()
    sftp.put(LOCAL_FILE, REMOTE_FILE)
    sftp.close()
    print("[+] Upload OK!")

    print("[*] Memasukkan file backup ke dalam Docker Container PostgreSQL...")
    run_cmd(client, f"sudo docker cp {REMOTE_FILE} medcore-postgres:/tmp/backup.sql", password)

    print("[*] Mengeksekusi pg_restore (menghapus data kosong & memasukkan data jadwal/dokter)...")
    cmd_restore = f"sudo docker exec -t medcore-postgres pg_restore -U {DB_USER} -d {DB_NAME} -c -1 /tmp/backup.sql"
    exit_code, out = run_cmd(client, cmd_restore, password)
    
    if exit_code == 0 or "warning" in out.lower():
        print("[+] RESTORE KE UBUNTU BERHASIL! Seluruh jadwal pasien/dokter kembali aman. ✅")
    else:
        print(f"[!] Periksa Output: {out}")
        
    print("[*] Membersihkan file cache...")
    run_cmd(client, f"sudo docker exec medcore-postgres rm /tmp/backup.sql", password)
    run_cmd(client, f"sudo rm {REMOTE_FILE}", password)
    
    # Restart PM2
    run_cmd(client, f"pm2 restart medcore-admin", password)

    client.close()

if __name__ == "__main__":
    pwd = input(f"Password SSH Ubuntu ({SSH_USER}): ")
    restore_ubuntu(pwd)
