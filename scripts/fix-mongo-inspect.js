const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.1.12', username: 'fallonava', password: '@Fallonava35' });

  console.log('--- DOCKER INSPECT MEDCORE-MONGO ---');
  const inspect = await ssh.execCommand('docker inspect medcore-mongo');
  try {
     const data = JSON.parse(inspect.stdout);
     if (data && data[0]) {
         const config = data[0].Config;
         const hostConfig = data[0].HostConfig;
         console.log("Image:", config.Image);
         console.log("Env:", config.Env);
         console.log("Binds:", hostConfig.Binds);
         console.log("PortBindings:", hostConfig.PortBindings);
         console.log("Labels:", config.Labels);
     }
  } catch (e) {
     console.log('Error parsing inspect:', inspect.stdout.substring(0, 100));
  }

  ssh.dispose();
}
check();
