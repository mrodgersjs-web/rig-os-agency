module.exports = {
  apps: [
    {
      name: 'rig-os-agency',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3737',
      cwd: '/Users/rig128gb/Developer/rig-os-agency',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 3737,
      },
    },
  ],
};
