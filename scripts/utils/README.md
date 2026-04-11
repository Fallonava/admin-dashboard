# 🔧 Utility Scripts

Script-script utilitas untuk manajemen server dan database.

## Daftar Script

| Script | Fungsi |
|--------|--------|
| `backup_db.py` | Backup database PostgreSQL dari Ubuntu server via SSH (Docker) |
| `check_postgres.py` | Cek versi dan status PostgreSQL di Ubuntu server |
| `run_ssh_windows.py` | Eksekusi perintah di Windows server via SSH |
| `setup-choco.ps1` | Setup Chocolatey di Windows server |

## Cara Pakai

Semua script dijalankan dari root project:

```bash
# Backup database
python scripts/utils/backup_db.py

# Cek PostgreSQL status
python scripts/utils/check_postgres.py

# Jalankan perintah di Windows server
python scripts/utils/run_ssh_windows.py
```
