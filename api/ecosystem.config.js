module.exports = {
  apps: [
    {
      name: 'coincraft-api',
      script: 'dist/server.js',
      cwd: '/opt/coincraft-api',
      instances: 1,
      exec_mode: 'fork',
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 4001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/var/log/pm2/coincraft-api-error.log',
      out_file: '/var/log/pm2/coincraft-api-out.log',
      time: true,
    },
  ],
};
