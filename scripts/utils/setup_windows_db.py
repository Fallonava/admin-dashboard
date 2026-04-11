import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# -- Konfigurasi SSH Windows Server ----------------------------
SSH_HOST = "localhost"
SSH_PORT = 2222
SSH_USER = "antrian 1"

def run_cmd(client, cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="ignore").strip()
    err = stderr.read().decode("utf-8", errors="ignore").strip()
    return exit_code, out, err

def setup_db(password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"[*] Menghubungkan ke {SSH_USER}@{SSH_HOST}:{SSH_PORT}...")
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=password, timeout=30)
    print("[+] Terhubung ke Windows Server!\n")

    # Pastikan path psql tersedia
    psql = '"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"'

    commands = [
        # 1. Buat user medcore
        (
            f'{psql} -U postgres -c "CREATE USER medcore WITH PASSWORD \'medcore_local_password\';"',
            "Membuat user 'medcore'"
        ),
        # 2. Buat database medcoredb
        (
            f'{psql} -U postgres -c "CREATE DATABASE medcoredb OWNER medcore;"',
            "Membuat database 'medcoredb'"
        ),
        # 3. Grant privileges
        (
            f'{psql} -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE medcoredb TO medcore;"',
            "Memberikan hak akses ke medcore"
        ),
        # 4. Verifikasi
        (
            f'{psql} -U postgres -c "\\l medcoredb"',
            "Verifikasi database"
        ),
    ]

    for cmd, desc in commands:
        print(f"[*] {desc}...")
        # Jalankan via PowerShell agar path dengan spasi aman
        ps_cmd = f'powershell -ExecutionPolicy Bypass -Command "& {cmd}"'
        # Set PGPASSWORD untuk auth
        full_cmd = f'powershell -ExecutionPolicy Bypass -Command "$env:PGPASSWORD=\'postgres\'; & {psql} -U postgres -c \\"CREATE USER medcore WITH PASSWORD \'medcore_local_password\'\\"'
        
        # Cara lebih sederhana: pakai PGPASSWORD via env
        code, out, err = run_cmd(
            client,
            f'cmd /c "set PGPASSWORD=postgres && {psql} -U postgres -c "{chr(34)}{cmd.split("-c ")[-1].strip(chr(34))}{chr(34)}"'
        )
        if out:
            print(f"    [+] {out}")
        if err and "already exists" in err:
            print(f"    [!] Sudah ada (aman): {err.split('ERROR:')[-1].strip()}")
        elif err and "error" in err.lower():
            print(f"    [!] {err}")
        print()

    client.close()
    print("[DONE] Setup database selesai!")

if __name__ == "__main__":
    pwd = input(f"Password SSH '{SSH_USER}@{SSH_HOST}:{SSH_PORT}': ")
    setup_db(pwd)
