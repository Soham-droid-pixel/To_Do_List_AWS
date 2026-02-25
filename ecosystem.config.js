// ecosystem.config.js – PM2 configuration for EC2 deployment
// Usage:
//   pm2 start ecosystem.config.js          # start in production
//   pm2 start ecosystem.config.js --env dev # start in dev mode
//   pm2 save && pm2 startup                # persist across reboots

module.exports = {
  apps: [
    {
      name: 'dynamodb-crud-server',
      script: 'server/index.js',
      cwd: '/home/ec2-user/app',        // ← change to your deploy path on EC2

      // Keep 2 instances for zero-downtime reload (requires at least 1 CPU)
      instances: 1,
      exec_mode: 'fork',

      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      /* Environment variables – do NOT put secrets here.
         AWS credentials come from the EC2 IAM Role attached to the instance. */
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        AWS_REGION: 'us-east-1',
        DYNAMODB_TABLE: 'Tasks',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        AWS_REGION: 'us-east-1',
        DYNAMODB_TABLE: 'Tasks',
      },

      // Log paths
      out_file: '/var/log/pm2/dynamodb-crud-out.log',
      error_file: '/var/log/pm2/dynamodb-crud-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
