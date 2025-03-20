import { NextResponse } from 'next/server';
import { ConnectionPool } from 'mssql';

const config = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Check if any required config values are missing
if (!config.user || !config.password || !config.server || !config.database) {
  throw new Error('Database configuration is incomplete');
}

// This API route checks if the input code exists in the accode table
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
  }

  try {
    const pool = new ConnectionPool(config);
    await pool.connect();

    // Query to check if the code exists
    const result = await pool.request()
      .input('code', code)
      .query('SELECT COUNT(*) AS count FROM accode WHERE code = @code');

    await pool.close();

    // Check if the count is greater than 0
    const exists = result.recordset[0].count > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}