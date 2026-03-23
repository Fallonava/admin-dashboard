const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });

  console.log('--- UPDATING DOCKER-COMPOSE ---');
  // First, let's backup the file
  await ssh.execCommand('cp /home/fallonava/docker-compose.infra.yml /home/fallonava/docker-compose.infra.yml.bak');
  
  // Replace mongo image
  const sedResult = await ssh.execCommand('sed -i "s/image: mongo:.*/image: mongo:4.4/g" /home/fallonava/docker-compose.infra.yml');
  console.log('Sed Replace:', sedResult.stdout || sedResult.stderr || 'Success');

  console.log('\n--- VERIFYING FILE ---');
  const cat = await ssh.execCommand('grep -A 2 -B 2 "image: mongo:4.4" /home/fallonava/docker-compose.infra.yml');
  console.log(cat.stdout);

  console.log('\n--- RESTARTING MONGODB ---');
  // Recreate the cluster service
  const upResult = await ssh.execCommand('docker compose -f /home/fallonava/docker-compose.infra.yml up -d mongodb');
  console.log(upResult.stdout || upResult.stderr);

  ssh.dispose();
}
check();
