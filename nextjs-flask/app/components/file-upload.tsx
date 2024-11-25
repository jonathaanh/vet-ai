"use client";

import { useEffect, useState, useRef } from "react";
import { ClipLoader } from "react-spinners";

type SupabaseFile = {
  created_at: string;
  id: string;
  file_name: string;
  file_size: number;
};

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<SupabaseFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const MAX_FILE_SIZE = 45 * 1000 * 1000;
  const MAX_TOTAL_SIZE = 2 * 1000 * 1000 * 1000;
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    getFiles();
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 45MB limit.";
    }
    if (getTotalSize() + file.size > MAX_TOTAL_SIZE) {
      return "Total size would exceed 1GB limit.";
    }
    if (
      uploadedFiles.some((existingFile) => existingFile.file_name === file.name)
    ) {
      return "File already uploaded.";
    }
    return null;
  };

  const handleWebsiteClick = () => {
    console.log("Website clicked");
    setIsModalOpen(true);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          console.log(error);
          continue;
        }
        await uploadFiles(file);
      }
    }
  };

  const handleWebsiteUpload = async (url: string) => {
    console.log("Website upload");
    if (url === "") {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/upload_website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Uploading website failed: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);
      getFiles();
    } catch (error) {
      console.error("Uploading website error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/get_files");

      if (!response.ok) {
        throw new Error(`Retrieving files failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);

      setUploadedFiles(data.files);
    } catch (error) {
      console.error("Retrieving files error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFiles = async (file: string) => {
    console.log(file);
    setLoading(true);
    try {
      const response = await fetch("/api/delete_file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: file,
        }),
      });
      if (!response.ok) {
        throw new Error(`Retrieving files failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Delete successful:", data);
      getFiles();
    } catch (error) {
      console.error("Deleting files error:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_size", file.size.toString());
    console.log("here");
    setLoading(true);
    try {
      const response = await fetch("/api/upload_file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Upload successful:", data);
      getFiles();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log10(bytes) / Math.log10(1000));
    return `${(bytes / Math.pow(1000, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getTotalSize = (): number => {
    return uploadedFiles.reduce((total, file) => total + file.file_size, 0);
  };

  const totalSize = getTotalSize();

  return (
    <div className="h-[46vh] bg-white p-6 rounded-lg shadow flex flex-col">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Documents</h2>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <button
              className="px-4 py-2 bg-[#5474AB] text-sm text-white rounded hover:bg-[rgb(84, 116, 171)] cursor-pointer"
              onClick={handleWebsiteClick}
            >
              Use Website
            </button>
            {isModalOpen && (
              <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                <div
                  className="bg-white p-4 rounded shadow-lg w-[25vw]"
                  ref={modalRef}
                >
                  <button
                    onClick={() => setIsModalOpen(!isModalOpen)}
                    className="text-gray-500 hover:text-gray-700 border-rounded"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <textarea
                    className="w-full h-full text-black border-2 border-gray-300 rounded-md p-2"
                    placeholder="Enter URL"
                    ref={textareaRef}
                  ></textarea>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        handleWebsiteUpload(textareaRef.current?.value || "");
                      }}
                      className=" bg-[#5474AB] hover:bg-[rgb(84, 116, 171)] text-white font-bold py-2 px-4 rounded"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
              className="px-4 py-2 bg-[#5474AB] text-sm text-white rounded hover:bg-[rgb(84, 116, 171)] cursor-pointer"
            >
              Upload Files
            </label>
          </div>
        </div>
      </div>
      {/* File List */}
      <div className="flex-1 mt-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {uploadedFiles
          .filter((file) => file.file_name !== ".emptyFolderPlaceholder")
          .map((file, id) => (
            <div
              key={id}
              className="flex items-center justify-between p-2 bg-gray-100 rounded"
            >
              <span className="text-sm text-gray-600">{file.file_name}</span>
              <div className="flex items-center">
                <span className="text-xs text-gray-400">
                  {formatFileSize(file.file_size)}
                </span>
                <button
                  onClick={() => deleteFiles(file.file_name)}
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
          <span className="ml-2">{formatFileSize(totalSize)} / 2 GB</span>
        </div>
      </div>
    </div>
  );
}
