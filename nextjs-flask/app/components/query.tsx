"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiSave, FiUpload } from "react-icons/fi";

interface QueryBoxProps {
  onResponseReceived: (response: string) => void;
  onLoading: (loading: boolean) => void;
}

interface Template {
  id: string;
  template_name: string;
  content: string;
}

export default function QueryBox({
  onResponseReceived,
  onLoading,
}: QueryBoxProps) {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const calculateCharCount = (text: string) => {
    return text.length;
  };

  useEffect(() => {
    loadTemplates();
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const charCount = calculateCharCount(query);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/load_templates");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Response:", data.templates);
      setTemplates(data.templates);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const populateTemplate = (template: Template) => {
    setQuery(template.content);
    setIsDropdownOpen(false);
  };

  const askVetAI = async () => {
    onLoading(true);
    try {
      const response = await fetch("/api/search_documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: query,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response:", data.results);
      onResponseReceived(data.results);
      return data.response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    } finally {
      onLoading(false);
    }
  };

  const saveTemplate = async () => {
    const name = modalRef.current?.querySelector("textarea")?.value;
    if (!name) {
      console.log("No name provided");
      return;
    }
    try {
      const response = await fetch("/api/save_template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          text: query,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response:", data);
      loadTemplates();
      return data.response;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  return (
    <div className="h-[46vh] bg-[white] p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Assistant</h2>
      <textarea
        className="w-full h-[60%] p-3 border rounded-md text-[#2b2b2b] resize-none"
        placeholder="Enter your query here..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <button
            onClick={askVetAI}
            className="mt-3 px-4 py-2 bg-[#5474AB] text-sm text-white rounded hover:bg-[rgb(84, 116, 171)]"
          >
            Ask VetAI
          </button>

          <div className="">
            <button
              onClick={openModal}
              className="flex items-center mt-3 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors duration-200"
              title="Save as template"
            >
              <FiSave className="mr-2" />
              Save Template
            </button>
            {isModalOpen && (
              <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
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
                    placeholder="Enter Template Name"
                  ></textarea>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setIsModalOpen(!isModalOpen);
                        saveTemplate();
                      }}
                      className=" bg-[#5474AB] hover:bg-[rgb(84, 116, 171)] text-white font-bold py-2 px-4 rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center mt-3 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              title="Load template"
            >
              <FiUpload className="mr-2" />
              Load Template
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border rounded-md shadow-lg">
                <div className="py-1 max-h-48 overflow-y-auto">
                  {templates.length > 0 ? (
                    templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => populateTemplate(template)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                      >
                        {template.template_name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No templates available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Chracter Count: {charCount}
        </div>
      </div>
    </div>
  );
}
