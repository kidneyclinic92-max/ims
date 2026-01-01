import { NextResponse } from "next/server";

export async function GET() {
  // Check environment variables (without exposing sensitive data)
  const hasConnectionString = !!process.env.AZURE_SQL_CONNECTION_STRING;
  const connString = process.env.AZURE_SQL_CONNECTION_STRING || '';
  
  // Parse connection string to check format (without exposing password)
  const parts = connString.split(';');
  const server = parts.find(p => p.toLowerCase().includes('server='))?.split('=')[1] || 'Not found';
  const database = parts.find(p => p.toLowerCase().includes('initial catalog=') || p.toLowerCase().includes('database='))?.split('=')[1] || 'Not found';
  const userId = parts.find(p => p.toLowerCase().includes('user id='))?.split('=')[1] || 'Not found';
  const hasPassword = !!parts.find(p => p.toLowerCase().includes('password='));
  
  return NextResponse.json({
    environmentCheck: {
      hasConnectionString,
      connectionStringLength: connString.length,
      parsed: {
        server: server.replace('tcp:', '').split(',')[0],
        database,
        userId,
        hasPassword,
        passwordLength: hasPassword ? 'Set' : 'Not set'
      }
    },
    commonIssues: {
      firewall: "Make sure your IP is added to Azure SQL firewall rules",
      password: "Verify password is correct and has no special characters that need escaping",
      serverName: "Check server name: managementserver.database.windows.net",
      databaseName: "Check database name: inventorymanagement"
    }
  });
}

