import { NextResponse } from 'next/server';
import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';

const sftp = new SftpClient();

export async function GET() {
  // Ensure environment variables are defined
  const host = process.env.SFTP_HOST;
  const port = process.env.SFTP_PORT;
  const username = process.env.SFTP_USERNAME;
  const privateKeyPath = process.env.SFTP_PRIVATE_KEY_PATH;

  if (!host || !port || !username || !privateKeyPath) {
    return NextResponse.json({ error: 'Missing configuration for SFTP.' }, { status: 500 });
  }

  // Resolve the private key path to an absolute path
  const resolvedPrivateKeyPath = path.resolve(process.cwd(), privateKeyPath);

  // Read the private key file
  let privateKey;
  try {
    privateKey = fs.readFileSync(resolvedPrivateKeyPath); // Use the resolved path
  } catch (error) {
    console.error('Error reading private key file:', error);
    return NextResponse.json({ error: 'Failed to read private key file.' }, { status: 500 });
  }

  const config = {
    host,
    port: Number(port), // Convert port to a number
    username,
    privateKey,
  };

  try {
    await sftp.connect(config);
    
    // Define the remote path for the latest CSV file
    const remotePath = '/path/to/your/latest_file.csv'; // Update with the correct path
    const localPath = path.join(process.cwd(), 'latest_file.csv');

    // Download the file
    await sftp.get(remotePath, localPath);
    
    await sftp.end();

    return NextResponse.json({ message: 'File downloaded successfully', file: localPath });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}