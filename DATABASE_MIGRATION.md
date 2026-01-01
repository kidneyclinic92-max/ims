# Database Migration Guide

## ✅ Database Connection: Working!

Your Azure SQL Database is now connected and ready to use.

## How Inventory Syncs with Database

### Current Setup

1. **API Routes Created** (`app/api/inventory/`)
   - `GET /api/inventory` - Fetch all items
   - `POST /api/inventory` - Create new item
   - `PUT /api/inventory/[id]` - Update item
   - `DELETE /api/inventory/[id]` - Delete item

2. **Database Store** (`lib/store-db.ts`)
   - Fetches from API instead of localStorage
   - All CRUD operations use database
   - Automatic sync on changes

## To Switch to Database

### Option 1: Update All Imports (Recommended)

Replace all imports of `@/lib/store` with `@/lib/store-db`:

**Before:**
```typescript
import { useInventoryStore } from "@/lib/store";
```

**After:**
```typescript
import { useInventoryStore } from "@/lib/store-db";
```

Files to update:
- `app/inventory/page.tsx`
- `app/orders/page.tsx`
- `app/page.tsx` (Dashboard)
- `app/cycle-count/page.tsx`
- `app/warehouse/page.tsx`
- `app/replenishment/page.tsx`
- `app/reports/page.tsx`

### Option 2: Update store.ts to use database

Replace the content of `lib/store.ts` with the content from `lib/store-db.ts`.

## Before Using Database

### Step 1: Create Database Tables

Run the SQL script in Azure SQL Database:
```sql
-- Run database/schema.sql in your Azure SQL Database
```

You can do this via:
- Azure Portal Query Editor
- SQL Server Management Studio (SSMS)
- Azure Data Studio
- Or any SQL client

### Step 2: Migrate Existing Data (Optional)

If you have data in localStorage, you can migrate it:

1. Export from localStorage (use Reports page export)
2. Use the migration script (coming soon)
3. Or manually import via API

### Step 3: Test

1. Switch to database store
2. Try creating a new item
3. Check if it appears in database
4. Refresh page - data should persist

## How It Works

### Data Flow

```
Frontend (React)
    ↓
useInventoryStore() hook
    ↓
API Calls (fetch)
    ↓
Next.js API Routes (/api/inventory)
    ↓
Database Connection (lib/db.ts)
    ↓
Azure SQL Database
```

### Real-time Sync

- **Create**: Item added → API call → Database → Frontend updates
- **Update**: Item changed → API call → Database → Frontend updates
- **Delete**: Item removed → API call → Database → Frontend updates
- **Read**: Page load → API call → Database → Display items

### Automatic Updates

- When you add/update/delete an item, it's immediately saved to database
- When you refresh the page, data loads from database
- Multiple users see the same data (shared database)
- No localStorage needed

## Benefits

✅ **Persistent**: Data survives browser cache clears
✅ **Shared**: Multiple users see same inventory
✅ **Scalable**: Handles thousands of items
✅ **Secure**: Server-side validation
✅ **Auditable**: Track who changed what
✅ **Backup**: Automatic Azure backups

## Next Steps

1. Create database tables (run schema.sql)
2. Switch imports to use database store
3. Test creating/updating items
4. Verify data in Azure Portal

## Troubleshooting

### "Table doesn't exist" error
→ Run `database/schema.sql` to create tables

### "Unauthorized" error
→ Check if you're logged in
→ Verify JWT token is valid

### Items not showing
→ Check database tables have data
→ Verify API endpoint returns data
→ Check browser console for errors

### Changes not saving
→ Check API response for errors
→ Verify database connection
→ Check user has admin role (for create/update/delete)

