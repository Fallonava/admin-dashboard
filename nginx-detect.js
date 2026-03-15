/**
 * nginx-detect.js
 * Deteksi instalasi Nginx di server via SSH
 */
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run(cmd) {
  const r = await ssh.execCommand(cmd);
  return (r.stdout + r.stderr).trim();
}

async function main() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35', readyTimeout: 10000 });
  console.log('✅ Connected\n');

  console.log('=== which nginx ===');
  console.log(await run('which nginx || echo "NOT FOUND"'));

  console.log('\n=== nginx via snap ===');
  console.log(await run('which snap && snap list nginx 2>&1 || echo "no snap nginx"'));

  console.log('\n=== nginx via Docker ===');
  console.log(await run('docker ps --filter name=nginx --format "{{.Names}} {{.Image}} {{.Status}}" 2>&1'));
  
  console.log('\n=== nginx via CasaOS/Docker-all ===');
  console.log(await run('docker ps --format "{{.Names}} {{.Image}}" | grep -i nginx 2>&1 || echo "not in docker"'));

  console.log('\n=== ls /etc/nginx ===');
  console.log(await run('ls /etc/nginx/ 2>&1 || echo "no /etc/nginx"'));

  console.log('\n=== find nginx binary ===');
  console.log(await run('find /usr /opt /snap -name nginx -type f 2>/dev/null | head -5'));

  console.log('\n=== systemctl nginx ===');
  console.log(await run('echo "@Fallonava35" | sudo -S systemctl status nginx 2>&1 | head -10'));

  ssh.dispose();
}

main().catch(e => console.error(e.message));
