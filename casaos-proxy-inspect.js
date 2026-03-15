/**
 * casaos-proxy-inspect.js
 * Memeriksa konfigurasi CasaOS Gateway dan Cloudflare Tunnel
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

  // 1. CasaOS Gateway config
  console.log('=== CasaOS Gateway config files ===');
  console.log(await run('echo "@Fallonava35" | sudo -S find /etc/casaos /var/lib/casaos /usr/share/casaos -name "*.conf" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" 2>/dev/null | head -20'));

  console.log('\n=== CasaOS Gateway reverse proxy config ===');
  console.log(await run('echo "@Fallonava35" | sudo -S cat /etc/casaos/gateway.ini 2>&1 || echo "@Fallonava35" | sudo -S ls /etc/casaos/ 2>&1'));
  
  console.log('\n=== CasaOS ports config ===');
  console.log(await run('echo "@Fallonava35" | sudo -S cat /etc/casaos/casaos.conf 2>&1 | head -30'));

  // 2. Cloudflared config
  console.log('\n=== Cloudflared Docker container detail ===');
  console.log(await run('docker inspect wisdomsky/cloudflared-web:2025.2.1 2>&1 | head -5 || docker ps --filter "ancestor=wisdomsky/cloudflared-web" --format "{{.Names}}" 2>&1'));

  console.log('\n=== Cloudflared container name ===');
  const cfName = await run('docker ps --format "{{.Names}}" | grep -i cloud 2>&1');
  console.log(cfName);

  if (cfName && !cfName.includes('not')) {
    console.log('\n=== Cloudflared tunnel config in container ===');
    console.log(await run(`docker exec ${cfName.split('\n')[0]} cat /etc/cloudflared/config.yml 2>&1 || docker exec ${cfName.split('\n')[0]} ls /etc/cloudflared/ 2>&1`));
  }

  // 3. Port 3000 reachable?
  console.log('\n=== Test port 3000 locally ===');
  console.log(await run('curl -sI http://127.0.0.1:3000 | head -5 || echo "Port 3000 tidak merespons"'));

  ssh.dispose();
}

main().catch(e => console.error(e.message));
