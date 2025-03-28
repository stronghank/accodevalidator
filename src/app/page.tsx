/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false); // State for download status

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('Please select a file.');

    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      alert(data.message || data.error);
    } catch (error) {
      alert('An error occurred during the upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch('/api/delcodes', {
        method: 'DELETE',
      });

      const data = await response.json();
      alert(data.message || data.error);
    } catch (error) {
      alert('An error occurred during the deletion.');
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const confirmDelete = () => {
    setShowConfirmDelete(true);
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch('/api/download', {
        method: 'GET',
      });

      const data = await response.json();
      alert(data.message || data.error);
    } catch (error) {
      alert('An error occurred during the download.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Upload CSV File</h1>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-500 file:text-white
                     hover:file:bg-blue-600 mb-4"
        />
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full ${isUploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} 
                      text-white font-semibold py-2 rounded-md transition duration-200`}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>

        <button
          onClick={confirmDelete}
          disabled={isDeleting}
          className={`mt-4 w-full ${isDeleting ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} 
                      text-white font-semibold py-2 rounded-md transition duration-200`}
        >
          {isDeleting ? 'Deleting...' : 'Delete All Records'}
        </button>

        {/* Confirmation Dialog */}
        {showConfirmDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete all records?</h2>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="mr-2 text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`mt-4 w-full ${isDownloading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} 
                      text-white font-semibold py-2 rounded-md transition duration-200`}
        >
          {isDownloading ? 'Downloading...' : 'Download Latest CSV'}
        </button>
      </div>
    </div>
  );
}