import { NextResponse, NextRequest } from 'next/server';
import csv from 'csv-parser';
import { ConnectionPool } from 'mssql';
import streamifier from 'streamifier';

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

// Define the type for CSV row
interface CsvRow {
  CODE_COMBINATION_ID: string;
  SEGMENT1: string;
  SEGMENT2: string;
  SEGMENT3: string;
  SEGMENT4: string;
  SEGMENT5: string;
  SEGMENT6: string;
  // Add other fields as necessary
}

// This API route handles the file upload
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type');

  if (!contentType || !contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  // Ensure file is an instance of File
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  const batchSize = 100; // Adjust batch size as needed

  // Parse the CSV file
  const buffer = await file.arrayBuffer();
  const csvData = Buffer.from(buffer).toString();

  const parseCSV = (): Promise<CsvRow[]> => {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = []; // Specify type for results
      streamifier.createReadStream(csvData)
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          // Trim the headers
          const trimmedHeaders = headers.map(header => header.trim());
          return trimmedHeaders; // Return trimmed headers
        })
        .on('data', (data: CsvRow) => {
          // Trim all fields in the data object
          const trimmedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key.trim(), value.trim()])
          ) as CsvRow; // Cast to CsvRow type

          // Concatenate segments into the code column
          const code = [
            trimmedData.SEGMENT1,
            trimmedData.SEGMENT2,
            trimmedData.SEGMENT3,
            trimmedData.SEGMENT4,
            trimmedData.SEGMENT5,
            trimmedData.SEGMENT6,
          ].join('.');

          // Push the modified data with all required fields
          results.push({ ...trimmedData, CODE_COMBINATION_ID: code });
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  };

  try {
    // Ensure database config values are defined
    const { user, password, server, database } = config;

    if (!user || !password || !server || !database) {
      return NextResponse.json({ error: 'Database configuration is incomplete' }, { status: 500 });
    }

    const parsedResults = await parseCSV();
    const pool = new ConnectionPool({
      user,
      password,
      server,
      database,
      options: config.options,
    });

    await pool.connect();

    // Track unique CODE_COMBINATION_ID values
    const uniqueCodes = new Set<string>();

    for (let i = 0; i < parsedResults.length; i += batchSize) {
      const batch = parsedResults.slice(i, i + batchSize);
      const request = pool.request();

      for (const row of batch) {
        // Check for duplicates
        if (!uniqueCodes.has(row.CODE_COMBINATION_ID)) {
          uniqueCodes.add(row.CODE_COMBINATION_ID);
          
          // Use a unique parameter name for each insertion
          const paramName = `code_${row.CODE_COMBINATION_ID}`; // Create a unique parameter name
          request.input(paramName, row.CODE_COMBINATION_ID); // Unique parameter name
          
          await request.query(
            `INSERT INTO accode (code) 
            VALUES (@${paramName})` // Use the unique parameter name
          );
        } else {
          console.log(`Duplicate CODE_COMBINATION_ID found: ${row.CODE_COMBINATION_ID}`);
        }
      }
    }

    await pool.close();
    return NextResponse.json({ message: 'File processed successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database insertion failed' }, { status: 500 });
  }
}