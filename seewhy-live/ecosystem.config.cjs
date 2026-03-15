module.exports = {
  apps: [
    {
      name: 'seewhy-api',
      script: './apps/api/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '512M',
      log_file: '/var/log/seewhy/combined.log',
      error_file: '/var/log/seewhy/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
