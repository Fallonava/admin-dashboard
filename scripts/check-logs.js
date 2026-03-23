const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });

  console.log('--- FETCHING ERROR LOG ---');
  const errLog = await ssh.execCommand('tail -n 100 /home/fallonava/logs/medcore-error.log');
  console.log(errLog.stdout);

  console.log('\n--- FETCHING OUT LOG ---');
  const outLog = await ssh.execCommand('tail -n 50 /home/fallonava/logs/medcore-out.log');
  console.log(outLog.stdout);

  console.log('\n--- CHECKING PM2 PROCESS ---');
  const pm2 = await ssh.execCommand(`
    export HOME=/home/fallonava
    source "$HOME/.nvm/nvm.sh"
    pm2 jlist
  `);
  try {
     const list = JSON.parse(pm2.stdout);
     list.forEach(proc => {
        console.log(`Name: ${proc.name}, Status: ${proc.pm2_env.status}, Restarts: ${proc.pm2_env.restart_time}`);
     });
  } catch(e) {
     console.log('Could not parse PM2 jlist');
  }

  ssh.dispose();
}
check();
