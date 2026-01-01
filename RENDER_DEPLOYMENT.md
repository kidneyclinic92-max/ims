# Deploying to Render

This guide will help you deploy your Inventory Management System to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your Azure SQL Database connection string
3. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Push Your Code to Git

Make sure your code is pushed to a Git repository:

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main  # or master, depending on your branch
```

## Step 2: Create a New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Select your repository

## Step 3: Configure the Service

Render will auto-detect Next.js, but verify these settings:

- **Name**: `inventory-management-system` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Choose Starter (free) or a paid plan

## Step 4: Set Environment Variables

In the Render dashboard, go to **Environment** and add:

### Required Environment Variable:

- **Key**: `AZURE_SQL_CONNECTION_STRING`
- **Value**: Your Azure SQL connection string
  ```
  Server=tcp:YOUR_SERVER.database.windows.net,1433;Initial Catalog=YOUR_DATABASE;Persist Security Info=False;User ID=YOUR_USER;Password=YOUR_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
  ```

### Optional Environment Variables:

- **NODE_ENV**: `production` (usually set automatically)

## Step 5: Configure Azure SQL Firewall

**Important**: You need to allow Render's IP addresses to connect to your Azure SQL Database.

1. Go to Azure Portal → Your SQL Server → **Networking**
2. Add firewall rules for Render's IPs:
   - You can find Render's IP ranges in their documentation
   - Or use "Allow Azure services and resources to access this server" (less secure)
   - Better: Add specific IPs from Render's outbound IPs

**Note**: Render provides static outbound IPs for paid plans. For free tier, IPs may change.

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Install dependencies
   - Run the build
   - Start your application

## Step 7: Monitor Deployment

- Watch the build logs in the Render dashboard
- Check for any errors
- Once deployed, your app will be available at: `https://your-app-name.onrender.com`

## Troubleshooting

### Build Fails

- Check build logs for errors
- Ensure all dependencies are in `package.json`
- Verify TypeScript types are installed (`@types/mssql`, `@types/bcryptjs`)

### Database Connection Fails

- Verify `AZURE_SQL_CONNECTION_STRING` is set correctly
- Check Azure SQL firewall allows Render's IPs
- Test connection string locally first

### App Crashes on Start

- Check runtime logs
- Verify `PORT` environment variable (Render sets this automatically)
- Ensure build completed successfully

## Updating Your Deployment

Render automatically deploys when you push to your connected branch. To manually deploy:

1. Go to your service in Render dashboard
2. Click **"Manual Deploy"**
3. Select the branch/commit

## Custom Domain

Render supports custom domains:
1. Go to your service → **Settings** → **Custom Domain**
2. Add your domain
3. Follow DNS configuration instructions

## Need Help?

- Render Docs: https://render.com/docs
- Render Support: https://render.com/support

