const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });

  console.log('--- CHECKING DOCKER CONTAINERS ---');
  const docker = await ssh.execCommand('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -i mongo');
  console.log(docker.stdout || 'MongoDB container not found in docker ps output.');

  console.log('\n--- ALL RUNNING DOCKER CONTAINERS ---');
  const dockerAll = await ssh.execCommand('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
  console.log(dockerAll.stdout);

  ssh.dispose();
}
check();
