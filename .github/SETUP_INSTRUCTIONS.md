# GitHub Actions Deployment Setup Instructions

## Overview
Two deployment workflows are provided:
- **deploy.yml**: Simple deployment using git pull on the server
- **deploy-advanced.yml**: Advanced deployment with file transfer, backup, and health checks

## Prerequisites

### 1. Server Requirements
- Git installed (for deploy.yml)
- Node.js installed
- SSH access enabled
- Process manager (PM2 recommended or systemd)

### 2. GitHub Repository Setup
Your repository must be cloned on your server (for deploy.yml), or deployment directory must exist (for deploy-advanced.yml)

## Setup Instructions

### Step 1: Generate SSH Key Pair (if you don't have one)

On your local machine or any secure location:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f github-actions-deploy-key
```

This creates two files:
- `github-actions-deploy-key` (private key)
- `github-actions-deploy-key.pub` (public key)

### Step 2: Add Public Key to Server

Copy the public key to your server:
```bash
ssh-copy-id -i github-actions-deploy-key.pub user@your-server.com
```

Or manually add it to `~/.ssh/authorized_keys` on your server:
```bash
cat github-actions-deploy-key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add Secrets to GitHub Repository

Go to your GitHub repository:
1. Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Required Secrets:
- **SERVER_HOST**: Your server's IP address or domain
  - Example: `192.168.1.100` or `myserver.com`

- **SERVER_USERNAME**: SSH username
  - Example: `ubuntu` or `root` or your username

- **SSH_PRIVATE_KEY**: Private SSH key content
  - Copy the entire content of `github-actions-deploy-key` file
  - Include the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines

- **DEPLOY_PATH**: Absolute path where your application is located
  - Example: `/home/ubuntu/badminton-backend` or `/var/www/badminton-backend`

#### Optional Secrets:
- **SERVER_PORT**: SSH port (default: 22)
  - Example: `22` or custom port like `2222`

- **SERVER_URL**: Your application URL for health checks (advanced workflow only)
  - Example: `http://myserver.com:3000` or `https://api.myapp.com`

### Step 4: Update Workflow Configuration

Edit the workflow file (.github/workflows/deploy.yml or deploy-advanced.yml):

1. Change the branch name if needed:
   ```yaml
   on:
     push:
       branches:
         - main  # Change to 'master' if needed
   ```

2. Update Node.js version to match your server:
   ```yaml
   node-version: '20'  # Change to '18', '20', etc.
   ```

3. For deploy.yml, update the restart command if needed:
   ```yaml
   npm run restart || pm2 restart badminton-backend || systemctl restart badminton-backend
   ```

4. For deploy-advanced.yml, update the PM2 app name if different:
   ```yaml
   pm2 restart badminton-backend || pm2 start server.js --name badminton-backend
   ```

### Step 5: Prepare Your Server

#### Option A: For deploy.yml (Git Pull Method)
1. Clone your repository on the server:
   ```bash
   cd /path/to/deployment
   git clone https://github.com/yourusername/badminton-backend.git
   cd badminton-backend
   npm ci --production
   ```

2. Set up your .env file:
   ```bash
   nano .env
   # Add your environment variables
   ```

3. Install PM2 (recommended):
   ```bash
   npm install -g pm2
   pm2 start server.js --name badminton-backend
   pm2 save
   pm2 startup
   ```

#### Option B: For deploy-advanced.yml (File Transfer Method)
1. Create deployment directory:
   ```bash
   mkdir -p /path/to/deployment
   ```

2. Create .env file in parent directory:
   ```bash
   nano /path/to/.env
   # Add your environment variables
   ```

3. Install PM2:
   ```bash
   npm install -g pm2
   ```

### Step 6: Add Scripts to package.json (Optional)

Update your package.json to add helpful scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "restart": "pm2 restart badminton-backend",
    "test": "echo \"No tests yet\" && exit 0"
  }
}
```

### Step 7: Test the Deployment

1. Push a commit to your main branch:
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push origin main
   ```

2. Check the Actions tab in your GitHub repository to monitor the deployment

3. View logs if there are any errors

## Troubleshooting

### SSH Connection Issues
- Verify SSH key is correctly added to server
- Check SERVER_HOST and SERVER_USERNAME are correct
- Ensure SSH_PRIVATE_KEY includes the full key content
- Test SSH connection manually: `ssh -i github-actions-deploy-key user@server`

### Permission Issues
- Ensure the deployment user has write permissions to DEPLOY_PATH
- For systemd restart, you may need to configure sudoers:
  ```bash
  sudo visudo
  # Add: username ALL=(ALL) NOPASSWD: /bin/systemctl restart badminton-backend
  ```

### Application Not Restarting
- Check if PM2 is installed: `pm2 --version`
- Verify PM2 process name: `pm2 list`
- Check logs: `pm2 logs badminton-backend`

### Git Pull Fails (deploy.yml)
- Ensure repository is cloned on server
- Check git remote: `git remote -v`
- Verify branch exists: `git branch -a`
- Check for uncommitted changes: `git status`

## Security Best Practices

1. ✅ Use SSH keys, not passwords
2. ✅ Use a dedicated deployment user with limited permissions
3. ✅ Keep your SSH private key secure (never commit it)
4. ✅ Regularly rotate SSH keys
5. ✅ Use firewall rules to limit SSH access
6. ✅ Keep .env files outside the deployment directory
7. ✅ Use non-standard SSH port if possible

## Maintenance

### Viewing Deployment Logs
- GitHub Actions logs: Repository → Actions → Select workflow run
- Server logs: `pm2 logs badminton-backend` or `journalctl -u badminton-backend`

### Manual Deployment
You can trigger deployment manually:
- Go to Actions tab → Select "Deploy to Personal Server" → Run workflow

### Rolling Back
With deploy-advanced.yml, backups are created automatically:
```bash
cd /path/to/deployment_backup_YYYYMMDD_HHMMSS
pm2 restart badminton-backend
```

## Next Steps

1. Set up a health check endpoint in your application
2. Add notification integrations (Slack, Discord, Email)
3. Implement database migration strategy
4. Add automated tests
5. Set up monitoring (PM2 Plus, New Relic, etc.)

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check server logs
3. Verify all secrets are correctly set
4. Test SSH connection manually
