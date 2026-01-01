# Azure SQL Database Setup Guide

## Step 1: Install Dependencies

Run the following command to install the required package:

```bash
npm install mssql
```

## Step 2: Configure Environment Variables

1. Create a `.env.local` file in the root directory (if it doesn't exist)

2. Add your Azure SQL connection string:

```env
AZURE_SQL_CONNECTION_STRING=Server=tcp:managementserver.database.windows.net,1433;Initial Catalog=inventorymanagement;Persist Security Info=False;User ID=admin101;Password=YOUR_ACTUAL_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

**Important:** Replace `YOUR_ACTUAL_PASSWORD` with your actual Azure SQL password.

## Step 3: Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Visit the test endpoint in your browser:
```
http://localhost:3000/api/test-connection
```

3. You should see:
```json
{
  "success": true,
  "message": "Successfully connected to Azure SQL Database"
}
```

## Step 4: Configure Azure SQL Firewall

Make sure your Azure SQL Database firewall allows connections from:
- Your development machine's IP address
- Azure services (if deploying to Azure)

To add your IP:
1. Go to Azure Portal
2. Navigate to your SQL Server
3. Go to "Networking" or "Firewalls and virtual networks"
4. Add your current IP address
5. Save

## Step 5: Create Database Schema

Run the SQL scripts to create the necessary tables. See `database/schema.sql` for the complete schema.

## Troubleshooting

### Connection Timeout
- Check your firewall rules in Azure Portal
- Verify your IP address is allowed
- Check if the server name is correct

### Authentication Failed
- Verify username and password are correct
- Check if the user has proper permissions
- Ensure the database name is correct

### SSL/TLS Errors
- The connection string already has `Encrypt=True`
- Make sure your Azure SQL supports TLS 1.2+

## Next Steps

After successful connection:
1. Create database tables (see schema.sql)
2. Update API routes to use database instead of localStorage
3. Migrate existing data from localStorage to database

