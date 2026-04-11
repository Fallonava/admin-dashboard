import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_HOST = "localhost"
SSH_PORT = 2222
SSH_USER = "antrian 1"
SVC_NAME = "actions.runner.Fallonava-admin-dashboard.DESKTOP-Q6PH7S6"
WIN_USER = "DESKTOP-Q6PH7S6\\ANTRIAN 1"
WIN_PASS = "@Fallonava35"

def run_cmd(client, cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="ignore").strip()
    err = stderr.read().decode("utf-8", errors="ignore").strip()
    return exit_code, out, err

def fix_runner_service(ssh_password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[*] Menghubungkan ke {SSH_USER}@{SSH_HOST}:{SSH_PORT}...")
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER,
                   password=ssh_password, timeout=30)
    print("[+] Terhubung!\n")

    # Step 1: Ganti akun service
    print(f"[*] Mengubah akun service '{SVC_NAME}' ke '{WIN_USER}'...")
    ps_cmd = f"""powershell -ExecutionPolicy Bypass -Command "
$svcName = '{SVC_NAME}'
$username = '{WIN_USER}'
$password = '{WIN_PASS}'
$svc = Get-WmiObject Win32_Service -Filter \\\"Name='$svcName'\\\"
$result = $svc.Change($null,$null,$null,$null,$null,$null,$username,$password)
Write-Host \\\"Change result: $($result.ReturnValue)\\\"
" """
    code, out, err = run_cmd(client, ps_cmd, timeout=30)
    print(f"    {out or err}")

    # Step 2: Stop service
    print(f"\n[*] Menghentikan service...")
    code, out, err = run_cmd(client,
        f'powershell -Command "Stop-Service -Name \'{SVC_NAME}\' -Force"', timeout=30)
    print(f"    {out or err or 'OK'}")
    time.sleep(3)

    # Step 3: Start service
    print(f"[*] Menjalankan ulang service...")
    code, out, err = run_cmd(client,
        f'powershell -Command "Start-Service -Name \'{SVC_NAME}\'"', timeout=30)
    print(f"    {out or err or 'OK'}")
    time.sleep(3)

    # Step 4: Verifikasi
    print(f"\n[*] Verifikasi status service...")
    code, out, err = run_cmd(client,
        f'powershell -Command "Get-Service \'{SVC_NAME}\' | Select-Object Name,Status,StartType | Format-List"')
    print(f"    {out}")

    print(f"\n[*] Cek akun yang dipakai service...")
    code, out, err = run_cmd(client,
        f'powershell -Command "(Get-WmiObject Win32_Service -Filter \\\"Name=\'{SVC_NAME}\'\\\").StartName"')
    print(f"    Akun: {out}")

    client.close()
    print("\n[DONE] Selesai! Runner service sekarang berjalan sebagai 'ANTRIAN 1'.")
    print("       PM2 akan bisa diakses dengan benar oleh GitHub Actions.")

if __name__ == "__main__":
    pwd = input(f"Password SSH '{SSH_USER}@{SSH_HOST}:{SSH_PORT}': ")
    fix_runner_service(pwd)
