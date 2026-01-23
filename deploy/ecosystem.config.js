// PM2 配置文件
module.exports = {
  apps: [
    {
      name: 'campus-api',
      script: './server/app.js',
      cwd: '/var/www/campus-trade',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/campus-api-error.log',
      out_file: '/var/log/pm2/campus-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
}
