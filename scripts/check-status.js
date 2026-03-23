const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });
  
  const pm2 = await ssh.execCommand(`
    export HOME=/home/fallonava
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
    pm2 list
  `);
  console.log('=== PM2 STATUS ===');
  console.log(pm2.stdout);
  
  const curl = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || curl -s -o /dev/null -w "%{http_code}" http://localhost:3000');
  console.log('=== HTTP STATUS ===');
  console.log('Response code:', curl.stdout);
  
  ssh.dispose();
}
check();
