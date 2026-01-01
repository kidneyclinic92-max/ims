import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import sql from 'mssql';

export async function GET() {
  try {
    // Check if connection string is set
    const connString = process.env.AZURE_SQL_CONNECTION_STRING;
    if (!connString) {
      return NextResponse.json({ 
        success: false, 
        message: "Connection string not found",
        error: "AZURE_SQL_CONNECTION_STRING environment variable is not set"
      }, { status: 500 });
    }

    // Try to connect
    const pool = await getConnection();
    const result = await pool.request().query('SELECT @@VERSION as version, GETDATE() as server_time');
    
    return NextResponse.json({ 
      success: true, 
      message: "Successfully connected to Azure SQL Database",
      database: {
        version: result.recordset[0]?.version?.substring(0, 50) || "Connected",
        serverTime: result.recordset[0]?.server_time
      }
    });
  } catch (error: any) {
    console.error('Connection error details:', error);
    
    // Provide more detailed error information
    let errorMessage = error.message || "Unknown error";
    let errorCode = error.code || "UNKNOWN";
    
    // Common error codes
    if (error.code === 'ETIMEOUT' || error.message?.includes('timeout')) {
      errorMessage = "Connection timeout - Check firewall rules in Azure Portal";
      errorCode = "TIMEOUT";
    } else if (error.code === 'ELOGIN' || error.message?.includes('Login failed')) {
      errorMessage = "Authentication failed - Check username and password";
      errorCode = "AUTH_FAILED";
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      errorMessage = "Server not found - Check server name in connection string";
      errorCode = "SERVER_NOT_FOUND";
    } else if (error.message?.includes('TLS') || error.message?.includes('SSL')) {
      errorMessage = "TLS/SSL error - Check encryption settings";
      errorCode = "TLS_ERROR";
    }
    
    return NextResponse.json({ 
      success: false, 
      message: "Failed to connect to Azure SQL Database",
      error: errorMessage,
      errorCode: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

