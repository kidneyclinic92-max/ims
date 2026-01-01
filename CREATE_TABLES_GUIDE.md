# How to Create Database Tables in Azure SQL

## Option 1: Azure Portal Query Editor (Easiest)

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in with your Azure account

2. **Navigate to Your SQL Database**
   - Search for "SQL databases" in the top search bar
   - Click on your database: `inventorymanagement`
   - Or go to: SQL Server → `managementserver` → Databases → `inventorymanagement`

3. **Open Query Editor**
   - In the left sidebar, click **"Query editor"**
   - You may need to authenticate:
     - Click "Use SQL authentication"
     - Enter username: `admin101`
     - Enter your password
     - Click "OK"

4. **Run the Schema Script**
   - Open the file `database/schema.sql` from your project
   - Copy the entire contents (Ctrl+A, Ctrl+C)
   - Paste into the Query Editor (Ctrl+V)
   - Click **"Run"** button (or press F5)
   - Wait for "Query succeeded" message

5. **Verify Tables Created**
   - In Query Editor, run:
     ```sql
     SELECT TABLE_NAME 
     FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_TYPE = 'BASE TABLE'
     ```
   - You should see: `categories`, `inventory_items`, `orders`, `order_items`, `cycle_counts`, `audit_logs`, `replenishment_requests`

6. **Refresh Your App**
   - Go back to your inventory page
   - Refresh the browser
   - Error should be gone!

---

## Option 2: SQL Server Management Studio (SSMS)

1. **Download SSMS** (if not installed)
   - Download from: https://aka.ms/ssmsfullsetup

2. **Connect to Azure SQL**
   - Open SSMS
   - Server name: `managementserver.database.windows.net`
   - Authentication: SQL Server Authentication
   - Login: `admin101`
   - Password: (your password)
   - Click "Connect"

3. **Run Schema Script**
   - Open `database/schema.sql` in SSMS
   - Select database: `inventorymanagement`
   - Click "Execute" (F5)

---

## Option 3: Azure Data Studio

1. **Download Azure Data Studio** (if not installed)
   - Download from: https://aka.ms/azuredatastudio

2. **Connect to Azure SQL**
   - Click "New Connection"
   - Server: `managementserver.database.windows.net`
   - Authentication: SQL Login
   - Username: `admin101`
   - Password: (your password)
   - Database: `inventorymanagement`
   - Click "Connect"

3. **Run Schema Script**
   - Open `database/schema.sql`
   - Click "Run" (F5)

---

## Quick Test Query

After creating tables, test with:

```sql
SELECT COUNT(*) as table_count
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
```

Should return: `7` (seven tables)

---

## Troubleshooting

### "Login failed" error
- Check username: `admin101`
- Verify password is correct
- Make sure you're using SQL authentication (not Azure AD)

### "Firewall" error
- Go to Azure Portal → SQL Server → Networking
- Add your current IP address
- Save and wait 1-2 minutes

### "Permission denied" error
- Make sure you're connected to the correct database: `inventorymanagement`
- Verify your user has CREATE TABLE permissions

---

## What Gets Created

The schema creates these tables:
- ✅ `categories` - Product categories
- ✅ `inventory_items` - All inventory items
- ✅ `orders` - Purchase and sales orders
- ✅ `order_items` - Items in each order
- ✅ `cycle_counts` - Physical inventory counts
- ✅ `audit_logs` - Change tracking
- ✅ `replenishment_requests` - Stock replenishment

Plus indexes for performance!

