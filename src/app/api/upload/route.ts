import { NextResponse } from 'next/server';
import multer from 'multer';
import csv from 'csv-parser';
import { ConnectionPool } from 'mssql';

const upload = multer({ storage: multer.memoryStorage() });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use this if you're on Azure
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true', // Change to true for local dev / self-signed certs
  },
};

// This API route handles the file upload
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  const results: any[] = [];
  const batchSize = 1000; // Adjust batch size as needed

  // Parse the CSV file
  const buffer = await file.arrayBuffer();
  const csvData = Buffer.from(buffer).toString();

  csvData
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const pool = await new ConnectionPool(config).connect();

        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          const request = pool.request();

          batch.forEach((row) => {
            request.input('column1', row.column1); // Adjust according to your CSV structure
            request.input('column2', row.column2);
            // Add more inputs as needed
            request.query('INSERT INTO your_table (column1, column2) VALUES (@column1, @column2)'); // Adjust as needed
          });

          await request.execute('yourStoredProcedure'); // Or use request.query() for raw SQL
        }

        await pool.close();
        return NextResponse.json({ message: 'File processed successfully' });
      } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Database insertion failed' }, { status: 500 });
      }
    });

  return new Promise(() => {}); // Keep the promise alive until the CSV processing is done
}