/**
 * casaos-detect.js
 * Deteksi reverse proxy dan tunnel yang digunakan di CasaOS server
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

  console.log('=== Port 80/443 listening processes ===');
  console.log(await run('echo "@Fallonava35" | sudo -S ss -tlnp | grep -E ":80|:443|:3000" 2>&1'));

  console.log('\n=== Caddy (CasaOS built-in gateway) ===');
  console.log(await run('which caddy 2>&1 || echo "no caddy"; echo "@Fallonava35" | sudo -S systemctl status casaos-gateway 2>&1 | head -6'));

  console.log('\n=== Cloudflared tunnel ===');
  console.log(await run('which cloudflared 2>&1; echo "@Fallonava35" | sudo -S systemctl status cloudflared 2>&1 | head -6'));

  console.log('\n=== All systemd services running ===');
  console.log(await run('echo "@Fallonava35" | sudo -S systemctl list-units --state=running --type=service 2>&1 | grep -iE "caddy|proxy|tunnel|cloud|gate|nginx|frp|traefik"'));

  console.log('\n=== Docker all containers ===');
  console.log(await run('docker ps --format "{{.Names}} {{.Image}} {{.Ports}}" 2>&1 | head -20'));

  ssh.dispose();
}

main().catch(e => console.error(e.message));
