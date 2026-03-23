const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });
  const res = await ssh.execCommand('df -h');
  console.log(res.stdout);
  ssh.dispose();
}
check();
