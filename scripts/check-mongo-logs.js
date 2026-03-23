const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });

  console.log('--- DOCKER LOGS FOR MEDCORE-MONGO ---');
  const dlogs = await ssh.execCommand('docker logs --tail 100 medcore-mongo 2>&1');
  console.log(dlogs.stdout || dlogs.stderr);

  ssh.dispose();
}
check();
