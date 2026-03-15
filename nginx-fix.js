/**
 * nginx-fix.js  v2
 * Menggunakan echo | sudo -S agar bisa berjalan via SSH non-interaktif
 */
const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const LOCAL_NGINX = path.join('f:', 'Next', 'admin-dashboard', 'medcore.nginx');
const SUDO_PASS = '@Fallonava35';

// Helper: jalankan sudo command via SSH dengan password di-pipe
async function sudoExec(cmd) {
  const result = await ssh.execCommand(`echo '${SUDO_PASS}' | sudo -S ${cmd} 2>&1`);
  return (result.stdout + result.stderr).trim();
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 MedCore — Fix Nginx WebSocket Config');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await ssh.connect({
    host: '192.168.1.12',
    username: 'fallonava',
    password: SUDO_PASS,
    readyTimeout: 10000,
  });
  console.log('✅ Terhubung ke server.\n');

  // 1. Upload file Nginx
  console.log('[1/4] Upload medcore.nginx ke /tmp/medcore.tmp...');
  await ssh.putFile(LOCAL_NGINX, '/tmp/medcore.tmp');
  console.log('✅ File diunggah.\n');

  // 2. Copy ke sites-available
  console.log('[2/4] Salin ke /etc/nginx/sites-available/medcore...');
  const copy = await sudoExec('cp /tmp/medcore.tmp /etc/nginx/sites-available/medcore');
  if (copy) console.log(' ', copy);
  console.log('✅ Disalin.\n');

  // 3. Aktifkan symlink + hapus default
  console.log('[3/4] Aktifkan symlink sites-enabled...');
  const link = await sudoExec(
    'ln -sf /etc/nginx/sites-available/medcore /etc/nginx/sites-enabled/medcore'
  );
  await sudoExec('rm -f /etc/nginx/sites-enabled/default');
  if (link) console.log(' ', link);
  console.log('✅ Symlink aktif.\n');

  // 4. Test & reload Nginx
  console.log('[4/4] Test konfigurasi Nginx...');
  const testOut = await sudoExec('nginx -t');
  console.log(' ', testOut);

  if (testOut.includes('successful')) {
    console.log('\n🔄 Reload Nginx...');
    const reload = await sudoExec('systemctl reload nginx');
    if (reload) console.log(' ', reload);
    console.log('✅ Nginx berhasil di-reload!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 WebSocket /socket.io/ sekarang aktif!');
    console.log('   Domain → https://medcore.fallonava.my.id');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.error('\n❌ Nginx config test GAGAL!');
    console.log('   Periksa log di atas untuk detail error.');
  }

  ssh.dispose();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
