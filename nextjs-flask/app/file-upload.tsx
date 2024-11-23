"use client";

import { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners'

type SupabaseFile = {
  created_at: string;
  id: string;
  name: string;
  metadata: {
      size: number;
      mimetype: string;
      cacheControl: string;
      lastModified: string;
  };
};


export default function FileUpload() {
    const [uploadedFiles, setUploadedFiles] = useState<SupabaseFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const MAX_FILE_SIZE = 45 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 1024 * 1024 * 1024;

    useEffect(() => {
        getFiles();
    }, []);

    const validateFile = (file: File): string | null => {
      if (file.size > MAX_FILE_SIZE) {
        return 'File size exceeds 45MB limit.';
      }
      if (getTotalSize() + file.size > MAX_TOTAL_SIZE) {
        return 'Total size would exceed 1GB limit.';
      }
      //check if file is already in uploadedFiles
      if (uploadedFiles.some(existingFile => existingFile.name === file.name)) {
        return 'File already uploaded.';
      }
      return null;
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
          const error = validateFile(file);
          if (error) {
            console.log(error);
            continue; // Skip this file and move to next
          }
          await uploadFiles(file);
        }
      }
    };

    const getFiles = async () => {
      try {
        const response = await fetch('/api/get_files');

        if (!response.ok) {
          throw new Error(`Retrieving files failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);

        setUploadedFiles(data.files);
      } catch (error) {
        console.error('Retrieving files error:', error);
      }
    };

    const deleteFiles = async (file: string) => {
      console.log(file);
      setLoading(true);
      try{
        const response = await fetch('/api/delete_file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_name: file
          })
        });
        if (!response.ok) {
          throw new Error(`Retrieving files failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Delete successful:', data);
        getFiles();

      } catch (error) {
        console.error('Deleting files error:', error);
      } finally {
        setLoading(false);
      }
    };

    const uploadFiles = async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      setLoading(true);
      try {
        const response = await fetch('/api/upload_file', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Upload successful:', data);
        getFiles();
      } catch (error) {
          console.error('Upload error:', error);
      } finally {
        setLoading(false);
      }
    };


    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const getTotalSize = (): number => {
      return uploadedFiles.reduce((total, file) => total + file.metadata.size, 0);
    };

    const totalSize = getTotalSize();  

    return (
        <div className="h-[46vh] bg-white p-6 rounded-lg shadow flex flex-col">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Documents</h2>
          
            <div className="flex items-center">
                <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.csv,.doc,.docx"
                />
                <label 
                    htmlFor="file-upload"
                    className="px-4 py-2 bg-[#5474AB] text-white rounded hover:bg-[rgb(84, 116, 171)] cursor-pointer"
                >
                    Upload Files
                </label>
            </div>
          </div>
            {/* File List */}
            <div className="flex-1 mt-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {uploadedFiles
                  .filter(file => file.name !== '.emptyFolderPlaceholder')
                  .map((file, id) => (
                    <div key={id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400">
                          {formatFileSize(file.metadata.size)}
                          </span>
                          <button
                              onClick={() => deleteFiles(file.name)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              aria-label="Delete file"
                          >
                              <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                              >
                              <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                              />
                              </svg>
                          </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between">
              <div className="pt-2">
                {loading && (
                  <div className="items-center">
                      <ClipLoader size={18} color={"#5474AB"} loading={loading} />
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 pt-2">
                  <span>Total Size: </span>
                  <span className="ml-2">{formatFileSize(totalSize)} / 1 GB</span>
              </div>
            </div>
        </div>
    );
}