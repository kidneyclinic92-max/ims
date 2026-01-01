# Quick Start: Azure SQL Database Connection

## ✅ Step 1: Install Dependencies (Already Done!)
The `mssql` package is already installed in your `package.json`.

## ✅ Step 2: Create .env.local File

Create a file named `.env.local` in the root directory with:

```env
AZURE_SQL_CONNECTION_STRING=Server=tcp:managementserver.database.windows.net,1433;Initial Catalog=inventorymanagement;Persist Security Info=False;User ID=admin101;Password=YOUR_PASSWORD_HERE;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

**Replace `YOUR_PASSWORD_HERE` with your actual Azure SQL password.**

## ✅ Step 3: Configure Azure SQL Firewall

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your SQL Server: `managementserver`
3. Go to **Networking** or **Firewalls and virtual networks**
4. Click **Add client IP** or manually add your IP address
5. Click **Save**

## ✅ Step 4: Create Database Tables

1. Connect to your Azure SQL Database using:
   - Azure Portal Query Editor
   - SQL Server Management Studio (SSMS)
   - Azure Data Studio
   - Or any SQL client

2. Run the SQL script from `database/schema.sql` to create all tables

## ✅ Step 5: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and visit:
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

## 🎉 Success!

If you see the success message, your database connection is working!

## Next Steps

- Update API routes to use database instead of localStorage
- Migrate existing data to database
- Test all CRUD operations

## Troubleshooting

### "Connection timeout" error
- Check Azure SQL firewall rules
- Verify your IP is allowed
- Check server name is correct

### "Login failed" error
- Verify username: `admin101`
- Check password is correct
- Ensure database name: `inventorymanagement`

### "Cannot find module 'mssql'"
- Run: `npm install mssql`

