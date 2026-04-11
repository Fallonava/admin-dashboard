import paramiko
import sys
import os

def execute_remote_cmd(password):
    try:
        hostname = "localhost"
        port = 2222
        username = "antrian 1"

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=hostname, 
            port=port,
            username=username, 
            password=password, 
            timeout=30
        )
        
        # Command powershell TLS 1.2 and Chocolatey install
        command = 'powershell -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri https://community.chocolatey.org/install.ps1 -OutFile install.ps1; .\install.ps1"'
        
        stdin, stdout, stderr = client.exec_command(command)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out:
            print("OUT:", out)
        if err:
            print("ERROR:", err)
            
        client.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    execute_remote_cmd('qwer')


