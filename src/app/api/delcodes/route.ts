import { NextResponse, NextRequest } from 'next/server';
import { ConnectionPool } from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(req: NextRequest) {
  try {
    // Ensure database config values are defined
    const { user, password, server, database } = config;

    if (!user || !password || !server || !database) {
      return NextResponse.json({ error: 'Database configuration is incomplete' }, { status: 500 });
    }

    const pool = new ConnectionPool({
      user,
      password,
      server,
      database,
      options: config.options,
    });

    await pool.connect();

    // Execute delete query
    await pool.request().query(`DELETE FROM accode`);

    await pool.close();
    return NextResponse.json({ message: 'All records deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete records from the database' }, { status: 500 });
  }
}