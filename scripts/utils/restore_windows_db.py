import paramiko
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Konfigurasi Server Windows ('srimed')
SSH_HOST = "192.168.0.81"
SSH_PORT = 22
SSH_USER = "antrian 1"

LOCAL_FILE = r"F:\Next\admin-dashboard\backups\backup_hospital_20260411_230246.sql"
REMOTE_FILE = r"C:\Users\ANTRIAN 1\backup_medcoredb.dump"

def run_cmd(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="ignore").strip()
    err = stderr.read().decode("utf-8", errors="ignore").strip()
    return exit_code, out, err

def restore_db(password):
    if not os.path.exists(LOCAL_FILE):
        print(f"[!] File lokal tidak ditemukan: {LOCAL_FILE}")
        return

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"[*] Menghubungkan ke {SSH_USER}@{SSH_HOST}:{SSH_PORT}...")
    try:
        # Coba konek pakai IP lokal dulu
        client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=password, timeout=15)
    except Exception as e:
        print(f"[!] Koneksi ke {SSH_HOST} gagal: {e}")
        print("[*] Mencoba connect via localhost port 2222 (tunnel)...")
        # Fallback ke tunnel
        client.connect("localhost", port=2222, username=SSH_USER, password=password, timeout=15)
        
    print("[+] Terhubung! Mengunggah file backup...")
    
    # 1. Upload File
    sftp = client.open_sftp()
    sftp.put(LOCAL_FILE, REMOTE_FILE.replace("\\", "/"))
    sftp.close()
    print("[+] Upload selesai!")

    # 2. Proses Restore
    print("[*] Menjalankan pg_restore pada Windows Server...")
    
    # Perintah pg_restore yang aman dimasukkan di PowerShell string
    # Data lama akan dibersihkan (-c / clean) supaya gak bentrok dengan tabel Prisma yang tadi
    psql_path = r"C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
    cmd = f'powershell -ExecutionPolicy Bypass -Command "$env:PGPASSWORD=\'medcore_local_password\'; & \'{psql_path}\' -U medcore -d medcoredb -c -1 \'{REMOTE_FILE}\'"'
    
    code, out, err = run_cmd(client, cmd)
    if out:
        print("OUT:", out)
    if err and "warning" not in err.lower():
        print("ERR:", err)
        
    print("\n[+] Restore database selesai!")

    # 3. Hapus file temporary di server & restart PM2
    run_cmd(client, f'powershell -Command "Remove-Item \'{REMOTE_FILE}\' -Force"')
    run_cmd(client, f'powershell -Command "pm2 restart admin-dashboard"')
    print("[+] PM2 di-restart dengan data baru. Selesai!")
    
    client.close()

if __name__ == "__main__":
    pwd = input(f"Password SSH Server Windows ({SSH_USER}): ")
    restore_db(pwd)
