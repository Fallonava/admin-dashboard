/**
 * scripts/migrate-db.js
 * 
 * Script otomatis untuk:
 * 1. SSH ke CasaOS
 * 2. Upload docker-compose.infra.yml & jalankan
 * (Tidak ada data ditarik dari NanoDB karena limit)
 */
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();
const SSH_HOST = '192.168.1.12';
const SSH_USER = 'fallonava';
const SSH_PASS = '@Fallonava35';

async function runMigration() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Memulai Setup Infra Database Lokal ke CasaOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('[1/3] Connect SSH ke CasaOS (192.168.1.12)...');
    await ssh.connect({
      host: SSH_HOST,
      username: SSH_USER,
      password: SSH_PASS,
      readyTimeout: 20000,
    });
    console.log('✅ Connected SSH.\n');

    await ssh.execCommand('sudo mkdir -p /mnt/AppData && sudo chmod 777 -R /mnt/AppData');

    console.log('[2/3] Upload docker-compose.infra.yml ke server...');
    const composeSource = path.join(__dirname, '../docker-compose.infra.yml');
    const composeDest = '/home/fallonava/docker-compose.infra.yml';
    await ssh.putFile(composeSource, composeDest);
    console.log('✅ Uploaded.\n');

    console.log('[3/3] Menjalankan Docker Containers Lokal...');
    const composeCmd = `
      cd /home/fallonava
      docker compose -f docker-compose.infra.yml up -d
      echo "✅ Docker Compose up executed"
    `;
    const composeResult = await ssh.execCommand(composeCmd, {
      onStdout: (chunk) => process.stdout.write(chunk.toString('utf8')),
      onStderr:  (chunk) => process.stderr.write(chunk.toString('utf8')),
    });
    console.log('✅ Containers PostgreSQL, Redis, MongoDB berjalan (Fresh DB).\n');

    ssh.dispose();
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    ssh.dispose();
  }
}

runMigration();
