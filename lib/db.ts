import sql from 'mssql';

// Parse connection string
const connectionString = process.env.AZURE_SQL_CONNECTION_STRING || '';

// Parse connection string into config object
function parseConnectionString(connStr: string): sql.config {
  const config: any = {
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
      connectionTimeout: 30000,
      requestTimeout: 30000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  // Parse connection string
  const parts = connStr.split(';').filter(p => p.trim());
  parts.forEach((part) => {
    const equalIndex = part.indexOf('=');
    if (equalIndex === -1) return;
    
    const key = part.substring(0, equalIndex).trim().toLowerCase();
    const value = part.substring(equalIndex + 1).trim();

    switch (key) {
      case 'server':
        // Remove tcp: prefix and port if present
        const serverValue = value.replace(/^tcp:/i, '').split(',')[0].trim();
        config.server = serverValue;
        break;
      case 'initial catalog':
      case 'database':
        config.database = value;
        break;
      case 'user id':
      case 'uid':
        config.user = value;
        break;
      case 'password':
      case 'pwd':
        // Remove curly braces if present
        config.password = value.replace(/[{}]/g, '');
        break;
      case 'encrypt':
        config.options.encrypt = value.toLowerCase() === 'true';
        break;
      case 'connection timeout':
        config.options.connectionTimeout = parseInt(value) * 1000;
        break;
      case 'trustservercertificate':
        config.options.trustServerCertificate = value.toLowerCase() === 'true';
        break;
    }
  });

  // Set authentication
  if (config.user && config.password) {
    config.authentication = {
      type: 'default',
      options: {
        userName: config.user,
        password: config.password,
      },
    };
  }

  return config as sql.config;
}

const config = parseConnectionString(connectionString);

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('Connected to Azure SQL Database');
    }
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT 1 as test');
    return result.recordset.length > 0;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Helper function to execute queries
export async function executeQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getConnection();
  const request = pool.request();

  // Add parameters if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }

  const result = await request.query(query);
  return result.recordset as T[];
}

// Helper function to execute stored procedures
export async function executeProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getConnection();
  const request = pool.request();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }

  const result = await request.execute(procedureName);
  return result.recordset as T[];
}

