const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });
  let res = await ssh.execCommand('docker logs medcore-postgres');
  console.log('LOGS:\n', res.stdout, res.stderr);
  res = await ssh.execCommand('docker inspect medcore-postgres --format "{{.State.ExitCode}} {{.State.Error}}"');
  console.log('EXIT:', res.stdout, res.stderr);
  ssh.dispose();
}
check();
