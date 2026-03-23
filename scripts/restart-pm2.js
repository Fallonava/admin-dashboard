const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });

  console.log('--- RESTARTING PM2 APP ---');
  const pm2 = await ssh.execCommand(`
    export HOME=/home/fallonava
    source "$HOME/.nvm/nvm.sh"
    pm2 restart medcore-admin
  `);
  console.log(pm2.stdout || pm2.stderr);

  ssh.dispose();
}
check();
