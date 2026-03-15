const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function cleanDocker() {
  try {
    await ssh.connect({
      host: '192.168.1.12',
      username: 'fallonava',
      password: '@Fallonava35',
    });
    
    console.log('--- All Containers ---');
    const ps = await ssh.execCommand('docker ps -a');
    console.log(ps.stdout);

    console.log('\n--- Removing medcore-admin-backup if it exists ---');
    const rm = await ssh.execCommand('docker rm -f medcore-admin-backup');
    console.log(rm.stdout || 'Removed (or not found).');

    ssh.dispose();
  } catch (err) {
    console.error('Cleanup failed:', err);
    ssh.dispose();
  }
}

cleanDocker();
